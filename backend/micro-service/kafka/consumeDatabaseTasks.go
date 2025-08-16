package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/IBM/sarama"
	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/config"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type dbRequest struct {
	UserId string `json:"userId"`
	ChatId string `json:"chatId"`
	Action string `json:"action"` // "flush" or "del"
}

type Message struct {
	MsgID     string `json:"msgId" bson:"msgId"`
	Timestamp string `json:"timestamp" bson:"timestamp"`
	Role      string `json:"role" bson:"role"`
	Content   string `json:"content" bson:"content"`
}

// StartDbopsConsumer starts consuming the dbops topic
func StartDbopsConsumer(brokers []string, topic, groupId string) {
	config := sarama.NewConfig()
	config.Version = sarama.V2_8_0_0
	config.Consumer.Group.Rebalance.Strategy = sarama.NewBalanceStrategyRange()
	config.Consumer.Offsets.Initial = sarama.OffsetOldest

	group, err := sarama.NewConsumerGroup(brokers, groupId, config)
	if err != nil {
		log.Fatalf("[DBopsTaskConsumerGroup] error: %v", err)
	}

	handler := &dbopsTaskConsumerHandler{}
	ctx := context.Background()

	for {
		if err := group.Consume(ctx, []string{topic}, handler); err != nil {
			log.Printf("[DBopsTaskConsumerGroup] consume error: %v", err)
		}
	}
}

type dbopsTaskConsumerHandler struct{}

func (dbopsTaskConsumerHandler) Setup(_ sarama.ConsumerGroupSession) error   { return nil }
func (dbopsTaskConsumerHandler) Cleanup(_ sarama.ConsumerGroupSession) error { return nil }

func (h *dbopsTaskConsumerHandler) ConsumeClaim(sess sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for msg := range claim.Messages() {
		var task dbRequest
		if err := json.Unmarshal(msg.Value, &task); err != nil {
			log.Printf("❌ Failed to unmarshal dbRequest: %v", err)
			sess.MarkMessage(msg, "")
			continue
		}

		KEY := fmt.Sprintf("chats:%s:%s", task.UserId, task.ChatId)

		switch task.Action {
		case "flush":
			log.Printf("🧪 Flushing chat from Redis → MongoDB | key=%s", KEY)

			vals, err := config.RedisClient.HGetAll(context.Background(), KEY).Result()
			if err != nil {
				log.Printf("❌ Redis HGetAll failed: %v", err)
				sess.MarkMessage(msg, "")
				continue
			}

			// Parse Redis values
			var messages []Message
			if rawMsgs, ok := vals["messages"]; ok && rawMsgs != "" {
				_ = json.Unmarshal([]byte(rawMsgs), &messages)
			}
			summary := vals["summary"]

			// If no messages and no summary → nothing to flush
			if len(messages) == 0 && summary == "" {
				log.Printf("🟡 No messages/summary found in Redis for %s, skipping flush", KEY)
				sess.MarkMessage(msg, "")
				continue
			}

			// Push to Mongo via helper
			if err := AddMessagesToChat(context.Background(), task.UserId, task.ChatId, summary, messages); err != nil {
				log.Printf("❌ Failed Mongo update for userId=%s chatId=%s: %v", task.UserId, task.ChatId, err)
				sess.MarkMessage(msg, "")
				continue
			}

			// Clear only the `messages` field in Redis (keep summary for next cycle)
			if err := config.RedisClient.HSet(context.Background(), KEY, "messages", "[]").Err(); err != nil {
				log.Printf("🔴 Redis HSet failed while clearing messages: %v", err)
			} else {
				log.Printf("🗑️  Redis field cleared: %s.messages = []", KEY)
			}

		case "del":

			log.Printf("🧹 Flush-then-delete requested for key=%s", KEY)

			vals, err := config.RedisClient.HGetAll(context.Background(), KEY).Result()
			if err != nil {
				log.Printf("❌ Redis HGetAll failed: %v", err)
				sess.MarkMessage(msg, "")
				continue
			}

			var messages []Message
			if rawMsgs, ok := vals["messages"]; ok && rawMsgs != "" {
				_ = json.Unmarshal([]byte(rawMsgs), &messages)
			}
			summary := vals["summary"]

			// Only flush if something exists
			if len(messages) > 0 || summary != "" {
				if err := AddMessagesToChat(context.Background(), task.UserId, task.ChatId, summary, messages); err != nil {
					log.Printf("❌ Failed to flush before delete for userId=%s chatId=%s: %v", task.UserId, task.ChatId, err)
					// do NOT delete key if flush fails
					sess.MarkMessage(msg, "")
					continue
				}
				log.Printf("✅ Flushed chat to DB before deletion (userId=%s, chatId=%s)", task.UserId, task.ChatId)
			}

			// Safe to delete Redis key after successful flush
			if err := config.RedisClient.Del(context.Background(), KEY).Err(); err != nil {
				log.Printf("❌ Failed to delete Redis key: %v", err)
			} else {
				log.Printf("✅ Deleted Redis key: %s", KEY)
			}

		default:
			log.Printf("⚠️ Unknown task action: %s", task.Action)
		}

		sess.MarkMessage(msg, "")
	}
	return nil
}

func AddMessagesToChat(ctx context.Context, userId, chatId, summary string, messages []Message) error {
	collection := config.GetCollection("chats")

	filter := bson.M{
		"userId": userId,
		"chatId": chatId,
	}

	update := bson.M{
		"$addToSet": bson.M{
			"messages": bson.M{"$each": messages},
		},
		"$set": bson.M{
			"summary": summary,
		},
	}

	opts := options.UpdateOptions{}
	opts.SetUpsert(true) // create doc if it doesn't exist

	result, err := collection.UpdateOne(ctx, filter, update, &opts)
	if err != nil {
		return err
	}

	if result.MatchedCount > 0 {
		log.Printf("✅ Matched %d doc(s), Modified %d", result.MatchedCount, result.ModifiedCount)
	} else if result.UpsertedCount > 0 {
		log.Printf("🆕 Created new chat doc with _id=%v", result.UpsertedID)
	}
	return nil
}
