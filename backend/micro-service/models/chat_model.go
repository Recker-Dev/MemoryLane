package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Message struct {
	MsgID     string `json:"msgId" bson:"msgId"`
	Role      string `json:"role" bson:"role"`
	Content   string `json:"content" bson:"content"`
	Timestamp string `json:"timestamp" bson:"timestamp"`
}

type Memory struct {
	Memid   string `bson:"memid" json:"memind"`
	Context string `bson:"context" json:"context"`
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
