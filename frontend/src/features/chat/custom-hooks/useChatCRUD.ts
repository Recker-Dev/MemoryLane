import { useCallback } from "react";
import { ChatHead } from "@/components/widgets/Sidebar";
import { createNewChatApiHelper, deleteChatApiHelper } from "@/lib/chatServices";
import { useRouter } from "next/navigation";


export function useChatCRUD() {

    const router = useRouter();

    const createChatHead = useCallback(
        async (isUserSynced: boolean, userId: string | null, newChatName: string): Promise<{ success: false; error: string; } | { success: true; chatHead: ChatHead; }> => {

            if (!isUserSynced || !userId)
                return { success: false, error: "User not synced or missing ID." };


            const response = await createNewChatApiHelper(userId, newChatName);

            if (!response.success) {
                return { success: false, error: response.error };
            }

            const newChatId = response.chatId
            const newChatHead: ChatHead = {
                chatId: newChatId,
                name: newChatName,
                preview: "No messages yet",
            }

            router.push(`/chat/${userId}/${newChatId}`);

            return { success: true, chatHead: newChatHead };

        }, [router]
    );

    const deleteChatHead = useCallback(
        async (isUserSynced: boolean, userId: string | null, chatId: string | null, activeChatId: string | null): Promise<{ success: true; message: string; } | { success: false; error: string; }> => {

            if (!isUserSynced || !userId || !chatId)
                return { success: false, error: "User not synced or missing userID or chatID missing." };

            const response = await deleteChatApiHelper(userId, chatId);

            if (!response.success) {
                return { success: false, error: response.error };

            }

            if (response.success) {
                if (chatId === activeChatId) {
                    router.push(`/chat/${userId}`); // Push Back to base homepage
                }
            }
            return { success: true, message: response.message };
        }, [router]);

    return {
        createChatHead,
        deleteChatHead
    };
}


