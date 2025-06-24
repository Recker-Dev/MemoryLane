import { create } from 'zustand'
import { type ChatHead } from '@/components/sidebar'
import { type MessageBubbleProps } from '@/components/messageBubble';

interface ChatStore {

    userId: string | null;
    setUserId: (id: string) => void;


    chatHeads: ChatHead[];
    setChatHeads: (heads: ChatHead[]) => void;
    addChatHead: (head: ChatHead) => void;
    resetChatHeads: () => void;
    removeChatHead: (id: String) => void;


    allChats: Record<string, MessageBubbleProps[]>;

    setAllChatMessages: (chatId: string, messages: MessageBubbleProps[]) => void; // New: to replace history
    appendChatMessages: (chatId: string, messages: MessageBubbleProps[]) => void; // Renamed: to append new messages


}

export const useChatStore = create<ChatStore>((set) => ({


    userId: null,
    setUserId: (id) => set(() => ({ userId: id })),

    chatHeads: [],

    setChatHeads: (heads) => set(() => ({ chatHeads: heads })),

    addChatHead: (head) =>
        set((state) => ({
            chatHeads: [...state.chatHeads, head],
        })),

    removeChatHead: (id) =>
        set((state) => ({
            chatHeads: state.chatHeads.filter((chatHead) => chatHead.chatId !== id),
        })),

    resetChatHeads: () => set({ chatHeads: [] }),


    allChats: {},
    pendingMessages: {},

    // Action to completely replace the messages for a given chatId (e.g., when fetching history)
    setAllChatMessages: (chatId, messages) =>
        set((state) => ({
            allChats: {
                ...state.allChats,
                [chatId]: messages, // Directly assign the new array
            },
        })),

    // Action to append new messages to an existing chat (e.g., user input, AI response)
    appendChatMessages: (chatId, messages) =>
        set((state) => ({
            allChats: {
                ...state.allChats,
                [chatId]: [...(state.allChats[chatId] || []), ...messages], // Append to existing
            },
        })),


}));