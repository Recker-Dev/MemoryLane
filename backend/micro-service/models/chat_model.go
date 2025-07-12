package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Message struct {
	ID        string    `bson:"id" json:"id"`
	Sender    string    `bson:"sender" json:"sender"`
	Text      string    `bson:"text" json:"text"`
	Timestamp time.Time `bson:"timestamp,omitempty" json:"timestamp,omitempty"`
}

type Memory struct {
	MemID   string   `bson:"mem_id" json:"mem_id"`
	Context string   `bson:"context" json:"context"`
	Tags    []string `bson:"tags" json:"tags"`
}

type Chat struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserId    string             `bson:"userId" json:"userId"`
	ChatId    string             `bson:"chatId" json:"chatId"`
	Name      string             `bson:"name" json:"name"`
	Messages  []Message          `bson:"messages" json:"messages"`
	Memory    []Memory           `bson:"memory,omitempty" json:"memory,omitempty"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt,omitempty"`
}

type ChatHeads struct {
	ChatId  string `bson:"chatId" json:"chatId"`
	Name    string `bson:"name" json:"name"`
	Preview string `bson:"preview" json:"preview"`
}
