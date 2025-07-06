
/**
 * --------------------------------------------------------
 * handleInputSubmission.ts
 *
 * Feature logic for handling user input in the chat.
 * - Processes messages
 *
 * Used in the chat input submission flow.
 * --------------------------------------------------------
 */


import { v4 as uuidv4 } from "uuid";
import { pushToPendingMessages, getAiResponse } from "@/lib/chatServices";
import { MessageBubbleProps } from "@/components/ui/MessageBubble";
import { useUserStateStore } from "@/lib/stores/useUserStateStore";
import { useChatStore } from "@/lib/stores/useChatStore";
import { useMemoryStore } from "@/lib/stores/useMemoryStore";

// /* ----------------------------------------------------------------------
//  * HELPER: handleFetchingRelevantMemories
//  *
//  * Handles the /fetch command syntax:
//  *    /fetch mem_id(Optional)="..." tags(Optional)="..." current_context="..."
//  *
//  * Parses user input and calls fetchRelevantMemories() to fetch memories.
//  *
//  * Returns:
//  *   true  → fetch handled successfully
//  *   false → fetch failed
//  * ---------------------------------------------------------------------- */

// const handleFetchingRelevantMemories = async (userId: string, activeChatId: string, userInput: string) => {

//     if (!activeChatId || !userId) return;

//     const FETCH_REGEX = /^\/fetch\s*(?:mem_id\(Optional\)\s*=\s*"(.*?)"\s*)?(?:tags\(Optional\)\s*=\s*"(.*?)"\s*)?current_context\s*=\s*"(.*?)"\s*$/;

//     const match = userInput.match(FETCH_REGEX);

//     if (!match) {
//         // console.log("fetch: No match for /fetch regex.");
//         toast.error("Stick to the boiler-plate text for fetching relevant memories. Fill the relevant fields only.")
//         return false;
//     }

//     const mem_id = match[1] || "";
//     const tags = match[2] || "";
//     const current_context = match[3] || "";

//     // console.log("✅ /fetch command detected!");
//     // console.log("Mem_id:", mem_id);
//     // console.log("Tags:", tags);
//     // console.log("Context:", current_context);

//     const response = await fetchRelevantMemories(userId, activeChatId, mem_id, tags, current_context);

//     if (response.success) {
//         // console.log(response.message);
//         return true;
//     }
//     else {
//         toast.error("Failed to add memory.");
//         return false;
//     }


// }


/* ----------------------------------------------------------------------
 * CORE FUNCTION: Custom Hook to handle user Submission, ai response
 * and DB updation.
 *
 * The central handler for all user input in the chat input box.
 *
 * Handles:
 *   - normal chat messages
 *
 * Called on:
 *   - Enter key press
 *   - Send button click
 *
 * ---------------------------------------------------------------------- */


export function useHandleInputSubmission() {

    ///////// GLOBAL STATES //////////
    const userId = useUserStateStore((state) => state.userId);
    const isUserSynced = useUserStateStore((state) => state.isUserSynced);
    const activeChatId = useUserStateStore((state) => state.activeChatId);
    const appendChatMessages = useChatStore((state) => state.appendChatMessages);

    const selectedMemories = useMemoryStore((state) => state.selectedMemories);

    /**
     * Submits a user message and fetches AI response.
     */

    const handleSubmission = async ({
        inputText
    }: {
        inputText: string;
    }): Promise<{
        success: boolean;
        message: string;
        aiMessage?: MessageBubbleProps;
        userMessage?: MessageBubbleProps;
    }> => {
        if (!userId || !isUserSynced || !activeChatId) {
            return {
                success: false,
                message: "User not synced or missing userId or  missing activeChatId.",
            };
        }

        const trimmedOutput = inputText.trim();
        if (!trimmedOutput) {
            return {
                success: false,
                message: "No input user message to process.",
            };
        }

        const userMessage: MessageBubbleProps = {
            id: uuidv4(),
            sender: "user",
            text: trimmedOutput,
        };

        const userMssgSave = await pushToPendingMessages(userId, activeChatId, userMessage);
        if (!userMssgSave.success) {
            return {
                success: false,
                message: "Error saving user message in redundancy DB.",
            };
        }

        // Immediately update chat with user's message
        appendChatMessages(activeChatId, [userMessage]);


        // Call AI
        const aiResponse = await getAiResponse(userId, activeChatId, trimmedOutput, selectedMemories);
        if (aiResponse.success) {
            const aiMessage: MessageBubbleProps = {
                ...aiResponse.message,
                id: uuidv4(),
            };

            // Immediately update chat with AI message
            appendChatMessages(activeChatId, [aiMessage]);

            // Save AI message to backend
            const aiMssgSave = await pushToPendingMessages(userId, activeChatId, aiMessage);
            if (!aiMssgSave.success) {
                return {
                    success: false,
                    message: "Error saving AI message in redundancy DB.",
                };
            }

            return {
                success: true,
                message: "Input handled successfully.",
                userMessage,
                aiMessage,
            };
        } else {
            return {
                success: false,
                message: `AI error: ${aiResponse.message}`,
            };
        }
    };

    return { handleSubmission };
}
