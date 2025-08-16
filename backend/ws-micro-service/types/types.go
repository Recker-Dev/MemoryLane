package types

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
type OutgoingMessage struct {
	Type    string      `json:"type"`
	UserId  string      `json:"userId"`
	ChatId  string      `json:"chatId"`
	Message ChatMessage `json:"message"`
}

// OutgoingBinary for binary send
type OutgoingBinary struct {
	Data []byte
}

type TriggerWritePump interface {
	SendToWritePump(data []byte)
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
