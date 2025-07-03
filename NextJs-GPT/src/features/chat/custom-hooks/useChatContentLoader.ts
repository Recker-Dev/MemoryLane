import { useEffect } from "react";
import toast from "react-hot-toast";
import { fetchMessages, getMemories } from "@/lib/chatServices";
import { useRouter } from "next/navigation";
import { Memory } from "@/components/chatMemoriesDropdown";
import { MessageBubbleProps } from "@/components/messageBubble";

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
    isUserSynced: boolean;
    userId: string | null;
    activeChatId: string | null;
    setMemories: (value: React.SetStateAction<Memory[]>) => void;
    setIsLoadingMessages: (value: React.SetStateAction<boolean>) => void;
    setAllChatMessages: (chatId: string, messages: MessageBubbleProps[]) => void;
}) {
    const {
        userId,
        activeChatId,
        isUserSynced,
        setMemories,
        setIsLoadingMessages,
        setAllChatMessages,
    } = args;

    const router = useRouter();

    useEffect(() => {
        if (!isUserSynced) return;
        if (!activeChatId || !userId) return;

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
