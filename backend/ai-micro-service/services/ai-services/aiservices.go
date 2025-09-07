package aiservices

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/config"
	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/helperfuncs"
	apimodels "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/models/api-models"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/genai"
)

func StreamUserQueryResponse(userId, chatId, query string, filesIds, memIds []string, sendChunk func(chunk string, chunkIdx int), sendSignal func(signal string)) error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	client := config.GeminiClient
	if client == nil {
		log.Println("❌ Gemini client is not initialized.")
		return fmt.Errorf("internal error: AI module unavailable")
	}

	KEY := fmt.Sprintf("chats:%s:%s", userId, chatId)

	// 1. Fetch chats from Redis or fallback to DB
	summary, messages, err := helperfuncs.FetchChatsFromRedis(ctx, KEY)
	if err != nil || (summary == "" && len(messages) == 0) {
		log.Printf("[AIService] ⚠️ No Redis context for falling back to DB...")
		dbSummary, dbMessages, dbErr := helperfuncs.FetchChatSummaryAndLastMessages(ctx, userId, chatId)
		helperfuncs.UpdateSummaryInRedis(ctx, KEY, dbSummary)
		if dbErr != nil {
			log.Printf("[AIService] ❌ DB fetch failed proceeding without context")
			summary, messages = "", nil
		} else {
			log.Printf("[AIService] ✅ Loaded context from DB.")
			summary, messages = dbSummary, dbMessages
			helperfuncs.UpdateSummaryInRedis(ctx, KEY, dbSummary)
		}
	} else {
		log.Printf("[AIService] ✅ Loaded context from Redis")
	}

	// 2. Add user message
	userMsg := apimodels.Message{
		MsgID:     primitive.NewObjectID().Hex(),
		Timestamp: time.Now().Format(time.RFC3339),
		Role:      "user",
		Content:   query,
	}
	go helperfuncs.AppendMessageToRedis(ctx, KEY, userMsg)

	//3. Vector search
	vectorQueryResult, err := helperfuncs.TriggerVectorSearch(userId, chatId, query, filesIds)
	if err != nil {
		log.Printf("[AIService] ⚠️ Proceeding without vector results ...")
	}

	//4. Memory search
	memorySearchResult, err := helperfuncs.SearchMemoriesInDB(ctx, userId, chatId, memIds)
	if err != nil {
		log.Printf("[AIService] ⚠️ Proceeding without memories...")
	}
	// 5. Format Prompt
	prompt := fmt.Sprintf(`You are a helpful, friendly, and conversational AI assistant.  

💡 **Style Guidelines**:  
- Use Markdown formatting (**bold, headers, bullet points, code blocks**).  
- Keep answers **spaced out** with short paragraphs (don’t cluster text).  
- Add emojis where natural 😊 (but don’t overdo it).  
- Be more **friendly & approachable** than overly professional.  
- Use **numbered lists** and ✅/❌ for clarity when giving steps, pros/cons, etc.  
- If code is involved, ALWAYS use fenced code blocks, do not use code without fencing

---

### 🗣 Most Recent Conversation (highest priority)
%s  

---

### 📌 Persistent Context (secondary reference)
%s  

---

### ❓ User Query
%s  

---

### 📂 Retrieved Documents
%s  

---

### 🧠 Custom Memories
%s  

---

### ✅ Response Rules
1. Always prioritize the **Most Recent Conversation** over older context.  
2. Give a **clear, conversational, and friendly answer**.  
3. If facts are used from documents, **cite the filename + page**.  
4. For sequential or numerical queries, **continue logically** from the latest messages.  
5. Keep the reply **easy to read, nicely spaced, and polished** (like ChatGPT).  
6. Use emojis naturally to make it feel less robotic.  

---

✨ Now, generate your response in this style:`,
		helperfuncs.GetFormattedLastNMessages(messages, 6),
		summary,
		query,
		vectorQueryResult,
		memorySearchResult,
	)

	// 5. Stream Gemini response
	var aiResponseBuilder strings.Builder
	iter := client.Models.GenerateContentStream(
		ctx,
		"gemini-2.5-flash",
		genai.Text(prompt),
		nil,
	)

	chunkIdx := 0
	for resp, err := range iter {

		if err != nil {
			log.Printf("[AIService] 🔴 Gemini streaming error: %v", err)
			cancel()
			return err
		}
		if resp == nil {
			continue
		}
		chunk := resp.Text()
		aiResponseBuilder.WriteString(chunk)
		sendChunk(chunk, chunkIdx)
		chunkIdx++
	}

	aiReply := aiResponseBuilder.String()
	aiMessage := apimodels.Message{
		MsgID:     primitive.NewObjectID().Hex(),
		Timestamp: time.Now().Format(time.RFC3339),
		Role:      "ai",
		Content:   aiReply,
	}

	// 6. Add AI message
	helperfuncs.AppendMessageToRedis(ctx, KEY, aiMessage)

	// 7. Re-fetch all messages to check for summary update.
	_, updatedMessages, err := helperfuncs.FetchChatsFromRedis(ctx, KEY)
	if err == nil && len(updatedMessages)%6 == 0 {
		newSummary := helperfuncs.GetLatestSummarization(ctx, client, summary, updatedMessages)
		helperfuncs.UpdateSummaryInRedis(ctx, KEY, newSummary)
	}

	// 8. Trigger a flush to flush redis(keep summary though) and update main DB if messages cross 6+ length.
	if err == nil && len(updatedMessages) >= 6 {
		sendSignal("flush")
	}

	return nil

}
