package types

import "time"

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
	Type     string `json:"type"`
	FileId   string `json:"fileId"`
	FileName string `json:"fileName"`        // Original file name
	Status   string `json:"status"`          // e.g., "success", "failed"
	Error    string `json:"error,omitempty"` // Error message if failed
}
