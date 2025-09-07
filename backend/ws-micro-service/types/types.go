package types

import "time"

// IncomingMessage from WebSocket
type IncomingMessage struct {
	Type    string      `json:"type"`
	UserId  string      `json:"userId"`
	ChatId  string      `json:"chatId"`
	Message ChatMessage `json:"message"`
}

// ChatMessage payload
type ChatMessage struct {
	Id     string `json:"id"`
	Text   string `json:"text"`
	Sender string `json:"sender"`
}

type TriggerWritePump interface {
	SendToWritePump(msg interface{})
}

type IncomingQuery struct {
	MsgId     string    `json:"msgId" bson:"msgId"` // unique per message
	ChatId    string    `json:"chatId" bson:"chatId"`
	UserId    string    `json:"userId" bson:"userId"`
	Role      string    `json:"role" bson:"role"`                           // "user"
	Content   string    `json:"content" bson:"content"`                     // full text prompt
	FileIds   []string  `json:"fileIds,omitempty" bson:"fileIds,omitempty"` // optional
	MemIds    []string  `json:"memIds,omitempty" bson:"memIds,omitempty"`   // optional
	Timestamp time.Time `json:"timestamp" bson:"timestamp"`                 // unix epoch ms
}

// Kept types for future reference

// type OutgoingMessage struct {
// 	Type     string `json:"type"`  // "control" | "chunk"
// 	MsgId    string `json:"msgId"` // ties back to IncomingQuery
// 	ChatId   string `json:"chatId"`
// 	UserId   string `json:"userId"`
// 	Role     string `json:"role"`     // "assistant"
// 	Content  string `json:"content"`  // only for Type="chunk"
// 	ChunkIdx int    `json:"chunkIdx"` // order of chunks
// 	Signal   string `json:"signal"`   // only for Type="control" (e.g. "start", "end")
// }

// type OutgoingFileStatus struct {
// 	FileName string `json:"fileName"`        // Original file name
// 	Status   string `json:"status"`          // e.g., "success", "failed"
// 	Error    string `json:"error,omitempty"` // Error message if failed
// }
