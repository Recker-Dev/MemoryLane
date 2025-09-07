import { v4 as uuidv4 } from "uuid";
import { useChatStore } from "@/lib/stores/useChatStore";
import { useUserStateStore } from "@/lib/stores/useUserStateStore";
import { useMemoryStore } from "@/lib/stores/useMemoryStore";
import { useFileStore } from "@/lib/stores/useFileStore";

import { useChatWebSocketStore } from "@/lib/stores/useChatWebSocketStore";


export function useHandleInputSubmission() {
    ///////// GLOBAL STATES //////////
    const userId = useUserStateStore((state) => state.userId);
    const isUserSynced = useUserStateStore((state) => state.isUserSynced);
    const activeChatId = useUserStateStore((state) => state.activeChatId);
    const { appendChatMessage } = useChatStore()


    const handleSubmission = async ({
        inputText,
    }: {
        inputText: string;
    }): Promise<{ success: boolean; message: string }> => {
        if (!userId || !isUserSynced || !activeChatId) {
            return {
                success: false,
                message: "❌ User not synced or missing userId or chatId.",
            };
        }
        

        const trimmedOutput = inputText.trim();
        if (!trimmedOutput) {

            return {
                success: false,
                message: "⚠️ Empty message",
            };
        }

        if (!useChatWebSocketStore.getState().wsMap.has(activeChatId)) {

            return {
                success: false,
                message: "⚠️ WebSocket not connected",
            };
        }

        const msgId = uuidv4();

        const userMessage = {
            msgId,
            role: "user" as const,
            content: trimmedOutput,
            timestamp: Date.now(),
        };

        // immediately show in chat UI
        appendChatMessage(userMessage, activeChatId);


        // ✅ grab fresh store state
        const freshFiles = useFileStore.getState().selectedFiles;
        const freshMems = useMemoryStore.getState().selectedMemories;

        useChatWebSocketStore.getState().sendMessage(
            userId,
            activeChatId,
            msgId,
            trimmedOutput,
            freshFiles.map((f) => f.fileId),
            freshMems.map((m) => m.memid)
        );



        return {
            success: true,
            message: "✅ Sent via WebSocket",
        };
    };

    return { handleSubmission };
}
