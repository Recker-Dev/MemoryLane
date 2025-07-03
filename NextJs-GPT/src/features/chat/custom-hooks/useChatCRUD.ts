import { useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import toast from "react-hot-toast";
import { ChatHead } from "@/components/sidebar";
import { createNewChatHeadAPI, deleteChatHeadAPI } from "@/lib/chatServices";
import { useRouter } from "next/navigation";


export function useChatCRUD(args: {
    isUserSynced: boolean,
    userId: string | null,
    activeChatId: string | null,
    setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>,
    addChatHead: (head: ChatHead) => void,
    removeChatHead: (id: string) => void,
    setInputText: React.Dispatch<React.SetStateAction<string>>,
    setShowNewChatModal: React.Dispatch<React.SetStateAction<boolean>>,

}) {

    const { isUserSynced, userId, activeChatId, setActiveChatId, addChatHead, removeChatHead, setInputText, setShowNewChatModal } = args;
    const router = useRouter();

    const createChatHead = useCallback(
        async (newChatName: string) => {

            if (!isUserSynced) return;
            if (!userId) return;

            const newChatId = uuidv4();
            const newChatHead: ChatHead = {
                chatId: newChatId,
                name: newChatName,
                preview: 'No messages yet.',
            };

            // 2. Optimistic UI update
            addChatHead(newChatHead);
            setInputText('');
            setShowNewChatModal(false); // Closing Modal


            // 3. Wait for DB sync before navigating
            const response = await createNewChatHeadAPI(userId, newChatHead);

            if (!response.success) {
                removeChatHead(newChatHead.chatId);
                toast.error(response.message || "Failed to sync chat head with server.");
                return;
            }

            // 4. Route after chat creation is confirmed
            setActiveChatId(newChatId);
            router.push(`/chat/${userId}/${newChatId}`);

        }, [isUserSynced,userId, router, addChatHead, removeChatHead, setInputText, setShowNewChatModal, setActiveChatId]
    );

    const deleteChatHead = useCallback(
        async (chatId: string) => {

            if (!isUserSynced) return;
            if (!userId) return;

            const response = await deleteChatHeadAPI(userId, chatId);

            if (!response.success) {
                toast.error(response.message || "Failed to delete chat-head");
                return;
            }

            if (response.success) {
                removeChatHead(chatId);
                toast.success(response.message);
                if (chatId === activeChatId) {
                    setActiveChatId(null);
                    router.push(`/chat/${userId}`); // Push Back to base homepage
                }
            }
        }, [isUserSynced,userId, router, setActiveChatId, removeChatHead]);
    
        return {
            createChatHead,
            deleteChatHead
        };
}


