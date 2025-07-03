/**
 * --------------------------------------------------------
 * handleInputSubmission.ts
 *
 * Feature logic for handling user input in the chat.
 * - Processes normal messages
 * - Handles special commands:
 *     - /chatmem → add memory
 *     - /fetch   → fetch relevant memories
 *
 * Used in the chat input submission flow.
 * --------------------------------------------------------
 */


import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { pushToPendingMessages, getAiResponse, getMemories, addMemory, fetchRelevantMemories } from "@/lib/chatServices";
import { MessageBubbleProps } from "@/components/messageBubble";
import { Memory } from "@/components/chatMemoriesDropdown";

/* ----------------------------------------------------------------------
 * HELPER: handleChatMem
 *
 * Handles the /chatmem command syntax:
 *    /chatmem context="..." tags(Optional)="..."
 *
 * Parses the user input, extracts context and tags,
 * builds a Memory object, and saves it via addMemory().
 *
 * Returns:
 *   true  → memory added successfully
 *   false → memory creation failed
 * ---------------------------------------------------------------------- */

const handleChatMem = async (userId: string, activeChatId: string, userInput: string) => {

    if (!activeChatId || !userId) return;

    const CHATMEm_REGEX = /^\/chatmem\s+context\s*=\s*"([^"]*)"(?:\s+tags\(Optional\)\s*=\s*"([^"]*)")?$/;

    const match = userInput.match(CHATMEm_REGEX);

    if (!match) {
        // console.log("handleChatMem: No match for /chatmem regex.");
        toast.error("Stick to the boiler-plate text for creating chat memory. Fill the relevant fields only.")
        return false;
    }

    const context = match[1] || "";
    const tagsString = match[2] || "";

    // The user inputs tags as a comma-separated string. We need to split it into an array.
    const tagsArray = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : [];



    // console.log("✅ /chatmem command detected!");
    // console.log("Context:", context);
    // console.log("Tags:", tagsArray);

    const newChatMemory: Memory = {
        mem_id: uuidv4(), context: context, tags: tagsArray
    };

    const response = await addMemory(userId, activeChatId, newChatMemory);

    if (response.success) {
        return true;
    }
    else {
        toast.error("Failed to add memory.");
        return false;
    }


}

/* ----------------------------------------------------------------------
 * HELPER: handleFetchingRelevantMemories
 *
 * Handles the /fetch command syntax:
 *    /fetch mem_id(Optional)="..." tags(Optional)="..." current_context="..."
 *
 * Parses user input and calls fetchRelevantMemories() to fetch memories.
 *
 * Returns:
 *   true  → fetch handled successfully
 *   false → fetch failed
 * ---------------------------------------------------------------------- */

const handleFetchingRelevantMemories = async (userId: string, activeChatId: string, userInput: string) => {

    if (!activeChatId || !userId) return;

    const FETCH_REGEX = /^\/fetch\s*(?:mem_id\(Optional\)\s*=\s*"(.*?)"\s*)?(?:tags\(Optional\)\s*=\s*"(.*?)"\s*)?current_context\s*=\s*"(.*?)"\s*$/;

    const match = userInput.match(FETCH_REGEX);

    if (!match) {
        // console.log("fetch: No match for /fetch regex.");
        toast.error("Stick to the boiler-plate text for fetching relevant memories. Fill the relevant fields only.")
        return false;
    }

    const mem_id = match[1] || "";
    const tags = match[2] || "";
    const current_context = match[3] || "";

    // console.log("✅ /fetch command detected!");
    // console.log("Mem_id:", mem_id);
    // console.log("Tags:", tags);
    // console.log("Context:", current_context);

    const response = await fetchRelevantMemories(userId, activeChatId, mem_id, tags, current_context);

    if (response.success) {
        // console.log(response.message);
        return true;
    }
    else {
        toast.error("Failed to add memory.");
        return false;
    }


}

/* ----------------------------------------------------------------------
 * INTERFACE: HandleSubmissionArgs
 *
 * Parameters passed into handleSubmission().
 * ---------------------------------------------------------------------- */

interface HandleSubmissionArgs {
    inputText: string;
    userId: string;
    activeChatId: string;
    setInputText: (text: string) => void;
    setIsProcessingInput: (bool: boolean) => void;
    setMemories: (memories: any[]) => void;
    appendChatMessages: (chatId: string, messages: MessageBubbleProps[]) => void
}

/* ----------------------------------------------------------------------
 * CORE FUNCTION: handleSubmission
 *
 * The central handler for all user input in the chat input box.
 *
 * Handles:
 *   - normal chat messages
 *   - /chatmem commands
 *   - /fetch commands
 *
 * Called on:
 *   - Enter key press
 *   - Send button click
 *
 * Example usage:
 *   await handleSubmission({...})
 * ---------------------------------------------------------------------- */

export async function handleSubmission({
    inputText,
    userId,
    activeChatId,
    setInputText,
    setIsProcessingInput,
    setMemories,
    appendChatMessages,
}: HandleSubmissionArgs): Promise<void> {

    const trimmedOutput = inputText.trim();

    if (!trimmedOutput) return;

    // -------------------------------
    // Handle /chatmem command
    // -------------------------------

    if (trimmedOutput.startsWith("/chatmem")) {
        const handled = await handleChatMem(userId, activeChatId, trimmedOutput);
        setInputText("");

        if (!handled) return;

        const res = await getMemories(userId, activeChatId);
        if (res.success && Array.isArray(res.message)) {
            setMemories(res.message);
            toast.success("Chat memory added!");
        } else {
            toast.error("Error fetching updated memories.");
        }

        return;
    }

    // -------------------------------
    // Handle /fetch command
    // -------------------------------

    if (trimmedOutput.startsWith("/fetch")) {
        const handled = await handleFetchingRelevantMemories(userId, activeChatId, trimmedOutput);
        setInputText("");
        if (!handled) return;
        return;
    }

    // -------------------------------
    // Handle normal chat message
    // -------------------------------

    const userMessage: MessageBubbleProps = {
        id: uuidv4(),
        sender: "user",
        text: trimmedOutput,
    };

    // Save user message to backend pending storage
    const userSave = await pushToPendingMessages(userId, activeChatId, userMessage);
    if (!userSave.success) {
        toast.error("Could not save message.");
        return;
    }

    // Update chat state immediately for instant UI feedback
    appendChatMessages(activeChatId, [userMessage]);
    setInputText("");
    setIsProcessingInput(true);

    // Call AI to get a reply
    const aiResponse = await getAiResponse(userId, activeChatId, trimmedOutput);
    if (aiResponse.success) {
        const aiMessage = {
            ...aiResponse.message,
            id: uuidv4(),
        };

        // Update UI immediately
        appendChatMessages(activeChatId, [aiMessage]);

        setTimeout(async () => {
            // Save AI message to backend pending storage
            const aiSave = await pushToPendingMessages(userId, activeChatId, aiMessage);
            if (!aiSave.success) toast.error("AI response not saved.");
            setIsProcessingInput(false);
        }, 200);
    } else {
        toast.error(`AI error: ${aiResponse.message}`);
        setIsProcessingInput(false);
    }
}
