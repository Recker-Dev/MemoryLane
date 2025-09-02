// File: kafka/input_consumer.go
package kafka

import (
	"context"
	"encoding/json"
	"log"
	"time"

	aiservices "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/ai-services"
	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/types"

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
		log.Printf("ATEEEEENTAAIISAFDF %s", key)
		var incoming types.IncomingQuery
		if err := json.Unmarshal(msg.Value, &incoming); err != nil {
			log.Printf("❌ Failed to unmarshal IncomingQuery: %v", err)
			sess.MarkMessage(msg, "") // mark to avoid re-processing bad payloads
			continue
		}

		// Send "start" control before streaming
		start := types.OutgoingMessage{
			Type:   "control",
			MsgId:  incoming.MsgId,
			ChatId: incoming.ChatId,
			UserId: incoming.UserId,
			Role:   "ai",
			Signal: "start",
		}
		if data, err := json.Marshal(start); err == nil {
			if err := h.publisher.SendMessage("server_reply", key, data); err != nil {
				log.Printf("❌ Kafka publish failed (start control): %v", err)
			}
		} else {
			log.Printf("❌ Failed to marshal start control: %v", err)
		}

		// Process user query
		err := aiservices.StreamUserQueryResponse(
			incoming.UserId, incoming.ChatId, incoming.Content,
			incoming.FileIds, incoming.MemIds,
			func(chunk string, chunkIdx int) {
				out := types.OutgoingMessage{
					Type:     "chunk",
					MsgId:    incoming.MsgId,
					ChatId:   incoming.ChatId,
					UserId:   incoming.UserId,
					Role:     "ai",
					Content:  chunk,
					ChunkIdx: chunkIdx,
				}
				if data, err := json.Marshal(out); err == nil {
					if err := h.publisher.SendMessage("server_reply", key, data); err != nil {
						log.Printf("❌ Kafka publish failed (chunk %d): %v", chunkIdx, err)
					}
				} else {
					log.Printf("❌ Failed to marshal chunk %d: %v", chunkIdx, err)
				}
			}, func(signal string) {
				type dbRequest struct {
					UserId string `json:"userId"`
					ChatId string `json:"chatId"`
					Action string `json:"action"` // "flush" or "del"
				}
				data, _ := json.Marshal(dbRequest{UserId: incoming.UserId, ChatId: incoming.ChatId, Action: signal})
				if err := h.publisher.SendMessage("db_ops", key, data); err != nil {
					log.Printf("[QueryProcessingConsumerGroup] Kafka publish failed for signal: %v", err)
				}
				log.Printf("✅ Raised DB flush ticket for UserId: %s and ChatId: %s", incoming.UserId, incoming.ChatId)
			})

		if err != nil {
			log.Printf("[QueryProcessingConsumerGroup] Failed to stream Gemini response: %v", err)
		}

		// After streaming is done
		end := types.OutgoingMessage{
			Type:   "control",
			MsgId:  incoming.MsgId,
			ChatId: incoming.ChatId,
			UserId: incoming.UserId,
			Role:   "ai",
			Signal: "end",
		}
		if data, err := json.Marshal(end); err == nil {
			if err := h.publisher.SendMessage("server_reply", key, data); err != nil {
				log.Printf("❌ Kafka publish failed (end control): %v", err)
			}
		} else {
			log.Printf("❌ Failed to marshal end control: %v", err)
		}

		// Commit offset
		sess.MarkMessage(msg, "")
	}

	return nil
}
