import { useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { ChatHead } from "@/components/widgets/Sidebar";
import { createNewChatHeadAPI, deleteChatHeadAPI } from "@/lib/chatServices";
import { useRouter } from "next/navigation";


export function useChatCRUD() {

    const router = useRouter();

    const createChatHead = useCallback(
        async (isUserSynced: boolean, userId: string | null, newChatName: string): Promise<void | { success: false; error: string; } | { success: true; chatHead: ChatHead; }> => {

            if (!isUserSynced || !userId)
                return { success: false, error: "User not synced or missing ID." };

            const newChatId = uuidv4();
            const newChatHead: ChatHead = {
                chatId: newChatId,
                name: newChatName,
                preview: 'No messages yet.',
            };

            const response = await createNewChatHeadAPI(userId, newChatHead);

            if (!response.success) {
                return { success: false, error: response.message };
            }

            router.push(`/chat/${userId}/${newChatId}`);

            return { success: true, chatHead: newChatHead };

        }, [router]
    );

    const deleteChatHead = useCallback(
        async (isUserSynced: boolean, userId: string | null, chatId: string | null, activeChatId: string | null): Promise<{ success: true; chatId: string; } | { success: false; error: string; }> => {

            if (!isUserSynced || !userId || !chatId)
                return { success: false, error: "User not synced or missing userID or chatID missing." };

            const response = await deleteChatHeadAPI(userId, chatId);

            if (!response.success) {
                return { success: false, error: response.message };

            }

            if (response.success) {
                if (chatId === activeChatId) {
                    router.push(`/chat/${userId}`); // Push Back to base homepage
                }
            }
            return { success: true, chatId: chatId };
        }, [router]);

    return {
        createChatHead,
        deleteChatHead
    };
}


