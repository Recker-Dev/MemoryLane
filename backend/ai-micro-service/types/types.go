package types

// Incoming control message from frontend, used only at start and end
type IncomingControl struct {
	Type             string   `json:"type"` // "user_start" or "user_end"
	UserId           string   `json:"userId"`
	ChatId           string   `json:"chatId"`
	MessageId        string   `json:"messageId"`
	SelectedMemories []string `json:"selectedMemories,omitempty"`
	SelectedFileIds  []string `json:"selectedFileIds,omitempty"`
}
