package kafka

import (
	"log"

	"github.com/IBM/sarama"
)

type PublisherHandler struct {
	publisher sarama.SyncProducer
}

func InitProducer(brokers []string) *PublisherHandler {
	config := sarama.NewConfig()
	config.Producer.Return.Successes = true
	config.Producer.Idempotent = true
	config.Producer.RequiredAcks = sarama.WaitForAll // ✅ CRITICAL
	config.Producer.Retry.Max = 5                    // ✅ Recommended
	config.Net.MaxOpenRequests = 1                   // ✅ Recommended for strict ordering
	config.Version = sarama.V2_8_0_0

	p, err := sarama.NewSyncProducer(brokers, config)
	if err != nil {
		log.Fatalf("Failed to start Kafka producer: %v", err)
	}
	log.Println("✅ Kafka producer ready")
	return &PublisherHandler{publisher: p}
}

func (ph *PublisherHandler) SendMessage(topic, key string, value []byte) error {
	msg := &sarama.ProducerMessage{
		Topic: topic,
		Key:   sarama.StringEncoder(key),
		Value: sarama.ByteEncoder(value),
	}
	partition, offset, err := ph.publisher.SendMessage(msg)
	if err != nil {
		log.Printf("Kafka send error: %v", err)
		return err
	}
	log.Printf("Sent to Kafka topic=%s partition=%d offset=%d", topic, partition, offset)
	return nil
}
