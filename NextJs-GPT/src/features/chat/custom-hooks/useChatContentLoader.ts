import { useEffect } from "react";
import toast from "react-hot-toast";
import { fetchMessages, getMemories } from "@/lib/chatServices";
import { useRouter } from "next/navigation";

import { useUserStateStore } from "@/lib/stores/useUserStateStore";
import { useChatStore } from "@/lib/stores/useChatStore";
import { useMemoryStore } from "@/lib/stores/useMemoryStore";

/**
 * Custom hook that fetches chat messages and memory data
 * whenever the `activeChatId` or `userId` changes.
 *
 * - Triggers loading state
 * - Populates Zustand chat store with message history
 * - Sets current chat memory into state
 * - Handles failure cases with toast notifications and route fallback
 *
 * @param userId - Currently active user ID
 * @param activeChatId - Currently selected chat ID
 * @param setMemories - Setter function to update current chat memories
 * @param setIsLoadingMessages - Setter function to manage loading animation
 */

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

    const setAllChatMessages = useChatStore((state) => state.setAllChatMessages);
    
    const setMemories = useMemoryStore((state) => state.setChatMemories);
    const resetSelectedMemories = useMemoryStore((state) => state.resetSelectedMemories);



    useEffect(() => {
        if (!isUserSynced) return;
        if (!activeChatId || !userId) return;

        // Wipe out any previously selected memory context from other chatId.
        resetSelectedMemories();

        // --- messages fetch ---
        const fetchChatMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const response = await fetchMessages(userId, activeChatId);
                if (response.success && Array.isArray(response.message)) {
                    setAllChatMessages(activeChatId, response.message);
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
        };

        fetchChatMessages();

        // --- memories fetch ---
        const fetchChatMemories = async () => {
            try {
                const response = await getMemories(userId, activeChatId);
                if (response.success && Array.isArray(response.message)) {
                    console.log(response.message);
                    setMemories(response.message);
                } else {
                    toast.error("Error fetching chat memories.");
                }
            } catch (err) {
                toast.error("Unexpected error fetching chat memories.");
            }
        };

        fetchChatMemories();

    }, [
        isUserSynced,
        activeChatId,
        userId,
        setAllChatMessages,
        setIsLoadingMessages,
        router,
        setMemories,
    ]);
}
