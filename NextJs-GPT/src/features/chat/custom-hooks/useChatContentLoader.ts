import { act, useEffect } from "react";
import toast from "react-hot-toast";
import { fetchChatHistoryApiHelper, getMemoriesApiHelper, getChatFilesApiHelper } from "@/lib/chatServices";
import { useRouter } from "next/navigation";

import { useUserStateStore } from "@/lib/stores/useUserStateStore";
import { useChatStore } from "@/lib/stores/useChatStore";
import { useMemoryStore } from "@/lib/stores/useMemoryStore";
import { useFileStore } from "@/lib/stores/useFileStore";
import { useChatWebSocketStore } from "@/lib/stores/useChatWebSocketStore";


export function useChatContentLoader(args: {
    setIsLoadingMessages: (value: React.SetStateAction<boolean>) => void;
}) {
    const {
        setIsLoadingMessages,
    } = args;

    const router = useRouter();

    const userId = useUserStateStore((state) => state.userId);
    const isUserSynced = useUserStateStore((state) => state.isUserSynced);
    const activeChatId = useUserStateStore((state) => state.activeChatId);

    const setChatMessagesFromBackend = useChatStore((s) => s.setChatMessagesFromBackend);
    // const removeChatHistoryByChatId = useChatStore((s) => s.removeChatHistoryByChatId);

    const setChatMemories = useMemoryStore((s) => s.setChatMemories);
    const resetSelectedMemories = useMemoryStore((s) => s.resetSelectedMemories);

    const setChatFiles = useFileStore((s) => s.setChatFiles);

    // Check if valid ws open signal present (1) or fallback to closed (3)
    const readyState = useChatWebSocketStore((s) => {
        const ws = s.wsMap.get(activeChatId!);
        return ws ? ws.readyState : WebSocket.CLOSED;
    });



    useEffect(() => {
        if (!isUserSynced || !activeChatId || !userId) return;

        // Wipe out any previously selected memory context from other chatId.
        resetSelectedMemories();

        // Skip fetching if a valid ws open signal found (1)
        // --- messages fetch ---
        if (readyState !== WebSocket.OPEN) {
            (async () => {
                setIsLoadingMessages(true);
                try {
                    const response = await fetchChatHistoryApiHelper(userId, activeChatId);
                    if (response.success) {
                        // removeChatHistoryByChatId(activeChatId); // Makes no sense cuz its an over-write anyways
                        setChatMessagesFromBackend(response.data);
                    } else {
                        toast.error("Error fetching chat-history.");
                        router.push(`/chat/${userId}`);
                    }
                } catch (err) {
                    toast.error("Unexpected error fetching chat history.");
                    router.push(`/chat/${userId}`);
                } finally {
                    setTimeout(() => {
                        setIsLoadingMessages(false);
                    }, 500);
                }
            })();
        }


        // --- memories fetch ---
        (async () => {
            try {
                const response = await getMemoriesApiHelper(userId, activeChatId);
                if (response.success && Array.isArray(response.data)) {
                    setChatMemories(
                        response.data.map((m: any) => ({
                            ...m,
                            createdAt: new Date(m.createdAt), // convert from string to Date
                        }))
                    );
                } else {
                    toast.error("Error fetching chat memories.");
                }
            } catch (err) {
                toast.error("Unexpected error fetching chat memories.");
            }
        })();


        // files fetch
        (async () => {
            try {
                const fetchResponse = await getChatFilesApiHelper(userId, activeChatId);
                if (
                    fetchResponse.success &&
                    Array.isArray(fetchResponse.data)
                ) {

                    setChatFiles(
                        fetchResponse.data.map((m: any) => ({
                            ...m,
                            createdAt: new Date(m.createdAt),
                        }))
                    );
                } else {
                    toast.error("Error fetching chat files.");
                }
            } catch (err) {
                toast.error("Unexpected error fetching chat files.");
            }

        })();



    }, [
        isUserSynced,
        activeChatId,
        userId,
        setChatMessagesFromBackend,
        setIsLoadingMessages,
        router,
        setChatMemories,
        setChatFiles,
        readyState,
    ]);
}
