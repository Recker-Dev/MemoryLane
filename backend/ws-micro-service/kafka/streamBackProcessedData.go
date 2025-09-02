package kafka

import (
	"context"
	"log"
	"strings"

	"github.com/Recker-Dev/NextJs-GPT/backend/ws-micro-service/types"

	"github.com/IBM/sarama"
)

// InitUserQueryProcessor streams from “server_reply” into WebSocket clients.
func StartKafkaToUserRoutine(brokers []string,
	replyTopic, groupId string,
	hub interface {
		GetClient(userId, chatId string) types.TriggerWritePump
	},
) {
	config := sarama.NewConfig()
	config.Version = sarama.V2_8_0_0
	config.Consumer.Group.Rebalance.Strategy = sarama.NewBalanceStrategyRange()
	config.Consumer.Offsets.Initial = sarama.OffsetOldest

	group, err := sarama.NewConsumerGroup(brokers, groupId+"-reply", config)
	if err != nil {
		log.Fatalf("reply consumer group error: %v", err)
	}

	handler := &consumerHandler{hub: hub}
	ctx := context.Background()
	for {
		if err := group.Consume(ctx, []string{replyTopic}, handler); err != nil {
			log.Printf("Reply consume error: %v", err)
		}
	}
}

type consumerHandler struct {
	hub interface {
		GetClient(userId, chatId string) types.TriggerWritePump
	}
}

func (consumerHandler) Setup(_ sarama.ConsumerGroupSession) error   { return nil }
func (consumerHandler) Cleanup(_ sarama.ConsumerGroupSession) error { return nil }

func (h *consumerHandler) ConsumeClaim(sess sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for msg := range claim.Messages() {
		key := string(msg.Key) // Key is in userId_chatId format

		// split key: userId_chatId
		parts := strings.SplitN(key, "_", 2)
		if len(parts) != 2 {
			log.Printf("⚠️ Invalid key format: %s", key)
			sess.MarkMessage(msg, "")
			continue
		}
		userId, chatId := parts[0], parts[1]

		// no need to unmarshal for routing unless you want validation
		client := h.hub.GetClient(userId, chatId)
		if client != nil {
			client.SendToWritePump(msg.Value) // forward raw payload
		} else {
			log.Printf("⚠️ No client found for user=%s chat=%s", userId, chatId)
		}

		sess.MarkMessage(msg, "")
	}
	return nil
}
