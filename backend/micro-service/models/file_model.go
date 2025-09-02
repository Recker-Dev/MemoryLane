package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Upload struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserId            string             `bson:"userId" json:"userId"`
	ChatId            string             `bson:"chatId" json:"chatId"`
	FileName          string             `bson:"fileName" json:"fileName"`
	FileType          string             `bson:"fileType" json:"fileType"`
	Path              string             `bson:"path" json:"path"`
	CreatedAt         time.Time          `bson:"createdAt" json:"createdAt"`
	IsVectorDBCreated bool               `bson:"isVectorDBcreated" json:"isVectorDBcreated"`
	Status            string             `bson:"status" json:"status"`
	Error             string             `bson:"error" json:"error"`
	Persist           bool               `bson:"persist" json:"persist"`
}
