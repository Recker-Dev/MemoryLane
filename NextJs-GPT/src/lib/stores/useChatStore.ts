import { create } from "zustand";
import { ChatHead } from "@/components/widgets/Sidebar";
import { useUserStateStore } from "./useUserStateStore";

export type ChatMessage = { // Type for frontend
    msgId: string,
    role: string,
    content: string,
    timestamp: number,
};

type ChatHistory = {
    messages: Record<string, ChatMessage>; // type from backend
    order: string[];
    userId: string;
    chatId: string;
};


export type ChatStore = {
    chatHeads: ChatHead[];
    setChatHeads: (heads: ChatHead[]) => void;
    addChatHead: (head: ChatHead) => void;
    removeChatHead: (id: string) => void;

    chatHistory: Record<string, ChatHistory>;

    setChatMessagesFromBackend: (backend: ChatHistory) => void;
    appendChatMessage: (message: ChatMessage, chatId: string) => void;
    updateChatMessage: (chatId: string, msgId: string, content: string) => void;
    removeChatHistoryByChatId: (chatId: string) => void;

    reset: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
    chatHeads: [],
    setChatHeads: (heads) => set({ chatHeads: heads }),
    addChatHead: (head) =>
        set((state) => ({ chatHeads: [...state.chatHeads, head] })),
    removeChatHead: (id) =>
        set((state) => ({
            chatHeads: state.chatHeads.filter((h) => h.chatId !== id),
        })),



    chatHistory: {},

    setChatMessagesFromBackend: (backend) =>
        set((state) => {
            return {
                chatHistory: {
                    ...state.chatHistory,
                    [backend.chatId]: backend,
                },
            };
        }),

    appendChatMessage: (message, chatId) =>
        set((state) => {
            const concernedChatHistory = state.chatHistory[chatId] || {
                messages: {},
                order: [],
                userId: useUserStateStore.getState().userId,
                chatId: chatId,
            };

            return {
                chatHistory: {
                    ...state.chatHistory,
                    [chatId]: {
                        ...concernedChatHistory,
                        messages: {
                            ...concernedChatHistory.messages,
                            [message.msgId]: message,
                        },
                        order: [...concernedChatHistory.order, message.msgId]
                    }
                },
            };
        }),

    updateChatMessage: (chatId, msgId, chunkContent) =>
        set((state) => {
            const concernedChatHistory = state.chatHistory[chatId];
            const oldMsg = concernedChatHistory.messages[msgId];
            if (!oldMsg) return state; // nothing to update

            return {
                chatHistory: {
                    ...state.chatHistory,
                    [chatId]: {
                        ...concernedChatHistory,
                        messages: {
                            ...concernedChatHistory.messages,
                            [msgId]: {
                                ...oldMsg,
                                content: oldMsg.content + chunkContent, // chunk append
                            },
                        },
                    },

                },
            };
        }),


    removeChatHistoryByChatId: (chatId) =>
        set((state) => {
            const { [chatId]: _, ...rest } = state.chatHistory;
            return {
                chatHistory: rest,
            };
        }),


    reset: () => set({
        chatHeads: [],
        chatHistory: {},
    }),
}));
