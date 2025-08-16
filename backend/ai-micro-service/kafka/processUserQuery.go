// File: kafka/input_consumer.go
package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/config"
	aiservices "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/ai-services"
	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/types"
	"github.com/redis/go-redis/v9"

	"github.com/IBM/sarama"
)

// StartConsumeProcessRepublish consumes from “user_query”, buffers per user_chat, processes on END, and republishes.

func StartUserQueryProcessing(brokers []string, inputTopic, groupId string, publisher *PublisherHandler) {
	config := sarama.NewConfig()
	config.Version = sarama.V2_8_0_0
	config.Consumer.Group.Rebalance.Strategy = sarama.NewBalanceStrategyRange()
	config.Consumer.Offsets.Initial = sarama.OffsetOldest

	group, err := sarama.NewConsumerGroup(brokers, groupId+"-input", config)
	if err != nil {
		log.Fatalf(" [QueryProcessingConsumerGroup] input consumer group error: %v", err)
	}

	handler := &inputHandler{
		publisher: publisher,
	}
	ctx := context.Background()
	for {
		if err := group.Consume(ctx, []string{inputTopic}, handler); err != nil {
			log.Printf("[QueryProcessingConsumerGroup] Input consume error: %v", err)
			time.Sleep(time.Second)
		}
	}
}

type inputHandler struct {
	publisher *PublisherHandler
}

func (inputHandler) Setup(_ sarama.ConsumerGroupSession) error   { return nil }
func (inputHandler) Cleanup(_ sarama.ConsumerGroupSession) error { return nil }

func (h *inputHandler) ConsumeClaim(sess sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for msg := range claim.Messages() {
		key := string(msg.Key)
		val := msg.Value

		var cntrl types.IncomingControl
		if err := json.Unmarshal(val, &cntrl); err == nil {

			switch {
			case cntrl.Type == "user_start":

				// Save fileids and memids in Redis (sub-key) hash
				h.storeField(key, "fileIds", cntrl.SelectedFileIds)
				h.storeField(key, "memIds", cntrl.SelectedMemories)

				// Initialize empty query
				h.storeField(key, "query", []byte{})

			case cntrl.Type == "user_end":

				// Full query fetch
				fullQuery, err := config.RedisClient.HGet(context.Background(), key, "query").Bytes()
				if err != nil {
					log.Printf("[QueryProcessingConsumerGroup] Redis HGet {query} failed: %v", err)
					return err
				}

				// Fetch fileIds
				fileIds, err := getField[[]string](key, "fileIds")
				if err != nil {
					log.Printf("[QueryProcessingConsumerGroup] Error getting fileIds: %v", err)
					return err
				}

				// Fetch memIds
				memIds, err := getField[[]string](key, "memIds")
				if err != nil {
					log.Printf("[QueryProcessingConsumerGroup] Error getting memIds: %v", err)
					return err
				}

				// Process user query
				err = aiservices.StreamUserQueryResponse(cntrl.UserId, cntrl.ChatId, string(fullQuery), fileIds, memIds, func(chunk string) {
					if err := h.publisher.SendMessage("server_reply", key, []byte(chunk)); err != nil {
						log.Printf("[QueryProcessingConsumerGroup] Kafka publish failed for chunk: %v", err)
					}
				}, func(signal string) {
					type dbRequest struct {
						UserId string `json:"userId"`
						ChatId string `json:"chatId"`
						Action string `json:"action"` // "flush" or "del"
					}
					data, _ := json.Marshal(dbRequest{UserId: cntrl.UserId, ChatId: cntrl.ChatId, Action: signal})
					if err := h.publisher.SendMessage("db_ops", key, data); err != nil {
						log.Printf("[QueryProcessingConsumerGroup] Kafka publish failed for signal: %v", err)
					}
					log.Printf("✅ Raised DB flush ticket for UserId: %s and ChatId: %s", cntrl.UserId, cntrl.ChatId)
				})

				if err != nil {
					log.Printf("[QueryProcessingConsumerGroup] Failed to stream Gemini response: %v", err)
				}

				// Clean up Redis (sub-key) hash
				if err := config.RedisClient.Del(context.Background(), key).Err(); err != nil {
					log.Printf("[QueryProcessingConsumerGroup] Failed to delete Redis key after processing: %v", err)
				}
			}

		} else {
			// Append query chunk
			h.appendQueryChunk(key, val)
		}
		// Acknowledge message
		sess.MarkMessage(msg, "")
	}
	return nil
}

// Helper: store field in Redis Hash
func (h *inputHandler) storeField(key string, field string, data interface{}) {
	var setErr error
	switch d := data.(type) {
	case []byte:
		setErr = config.RedisClient.HSet(context.Background(), key, field, d).Err()
	case []string:
		jsonVal, err := json.Marshal(d)
		if err != nil {
			log.Printf("[QueryProcessingConsumerGroup] JSON marshal error: %v", err)
			return
		}
		setErr = config.RedisClient.HSet(context.Background(), key, field, jsonVal).Err()
	default:
		log.Printf("[QueryProcessingConsumerGroup] Unsupported type in storeField: %T", d)
		return
	}
	if setErr != nil {
		log.Printf("[QueryProcessingConsumerGroup] Redis HSet error: %v", setErr)
	} else {
		// Set TTL of 1 hour (3600 seconds) for the key
		if err := config.RedisClient.Expire(context.Background(), key, time.Hour).Err(); err != nil {
			log.Printf("[QueryProcessingConsumerGroup] Redis Expire error: %v", err)
		}
	}
}

func getField[T any](key, field string) (T, error) {
	var result T

	data, err := config.RedisClient.HGet(context.Background(), key, field).Bytes()
	if err != nil {
		return result, fmt.Errorf("redis HGet %s failed: %w", field, err)
	}

	if err := json.Unmarshal(data, &result); err != nil {
		return result, fmt.Errorf("unmarshal %s failed: %w", field, err)
	}
	return result, nil
}

func (h *inputHandler) appendQueryChunk(key string, chunk []byte) {
	current, err := config.RedisClient.HGet(context.Background(), key, "query").Bytes()
	if err != nil && err != redis.Nil {
		log.Printf("[QueryProcessingConsumerGroup] Redis HGet error during append: %v", err)
		return
	}
	combined := append(current, chunk...)
	if err := config.RedisClient.HSet(context.Background(), key, "query", combined).Err(); err != nil {
		log.Printf("[QueryProcessingConsumerGroup] Redis HSet error during append: %v", err)
	}
}
