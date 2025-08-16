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
		key := string(msg.Key)

		// log.Printf("Consumed reply for %s", key)

		parts := strings.SplitN(key, "_", 3)
		if len(parts) != 3 {
			sess.MarkMessage(msg, "")
			log.Print("Mismatch in key length of published topic and streaming back to user coroutine")
			continue
		}
		userId, chatId := parts[0], parts[1]

		client := h.hub.GetClient(userId, chatId)
		if client != nil {
			client.SendToWritePump(msg.Value)
		}
		sess.MarkMessage(msg, "")
	}
	return nil
}
