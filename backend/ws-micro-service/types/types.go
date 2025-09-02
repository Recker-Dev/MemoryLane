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

// OutgoingMessage for JSON send
// type OutgoingMessage struct {
// 	Type    string      `json:"type"`
// 	UserId  string      `json:"userId"`
// 	ChatId  string      `json:"chatId"`
// 	Message ChatMessage `json:"message"`
// }

// OutgoingBinary for binary send
type OutgoingBinary struct {
	Data []byte
}

type TriggerWritePump interface {
	SendToWritePump(msg interface{})
}

// Incoming control message from frontend, used only at start and end
type IncomingControl struct {
	Type             string   `json:"type"` // "user_start" or "user_end"
	UserId           string   `json:"userId"`
	ChatId           string   `json:"chatId"`
	MessageId        string   `json:"messageId"`
	SelectedMemories []string `json:"selectedMemories,omitempty"`
	SelectedFileIds  []string `json:"selectedFileIds,omitempty"`
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

// Kafka signal types that are JSON-encoded and published directly
type KafkaUserStart struct {
	Type             string   `json:"type"` // "user_start"
	UserId           string   `json:"userId"`
	ChatId           string   `json:"chatId"`
	MessageId        string   `json:"messageId"`
	SelectedMemories []string `json:"selectedMemories,omitempty"`
	SelectedFileIds  []string `json:"selectedFileIds,omitempty"`
}

type KafkaUserEnd struct {
	Type      string `json:"type"` // "user_end"
	UserId    string `json:"userId"`
	ChatId    string `json:"chatId"`
	MessageId string `json:"messageId"`
}

// Incoming control message from frontend, used only at start and end
type OutgoingControl struct {
	Type      string `json:"type"` // "user_start" or "user_end"
	UserId    string `json:"userId"`
	ChatId    string `json:"chatId"`
	MessageId string `json:"messageId"`
}

type OutgoingMessage struct {
	Type     string `json:"type"`  // "control" | "chunk"
	MsgId    string `json:"msgId"` // ties back to IncomingQuery
	ChatId   string `json:"chatId"`
	UserId   string `json:"userId"`
	Role     string `json:"role"`     // "assistant"
	Content  string `json:"content"`  // only for Type="chunk"
	ChunkIdx int    `json:"chunkIdx"` // order of chunks
	Signal   string `json:"signal"`   // only for Type="control" (e.g. "start", "end")
}

type OutgoingFileStatus struct {
	FileName string `json:"fileName"`        // Original file name
	Status   string `json:"status"`          // e.g., "success", "failed"
	Error    string `json:"error,omitempty"` // Error message if failed
}
