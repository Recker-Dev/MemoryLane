import { create } from 'zustand'
import { type ChatHead } from '@/components/widgets/Sidebar'
import { type MessageBubbleProps } from '@/components/ui/MessageBubble';

export type ChatStore = {

    chatHeads: ChatHead[];
    setChatHeads: (heads: ChatHead[]) => void;
    addChatHead: (head: ChatHead) => void;
    
    removeChatHead: (id: string) => void;

    allChats: Record<string, MessageBubbleProps[]>;

    setAllChatMessages: (chatId: string, messages: MessageBubbleProps[]) => void; // New: to replace history
    appendChatMessages: (chatId: string, messages: MessageBubbleProps[]) => void; // Renamed: to append new messages

    reset: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({


    chatHeads: [],

    setChatHeads: (heads) => set(() => ({ chatHeads: heads })),

    addChatHead: (head) =>
        set((state) => ({
            chatHeads: [...state.chatHeads, head],
        })),

    removeChatHead: (id) =>
        set((state) => {
            const newAllChats = { ...state.allChats };
            delete newAllChats[id]; // Also remove the messages for the deleted chat
            return {
                chatHeads: state.chatHeads.filter((chatHead) => chatHead.chatId !== id),
                allChats: newAllChats,
            };
        }),

    

    allChats: {},

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
        set((state) => {
            const existingMessages = state.allChats[chatId] || [];

            const newMessages = [...existingMessages, ...messages];

            let updatedChatHeads = state.chatHeads;

            if (existingMessages.length === 0 && messages.length > 0) {
                // Find first USER message (not AI)
                const firstUserMessage = messages.find((msg) => msg.sender === 'user');
                if (firstUserMessage?.text) {
                    updatedChatHeads = state.chatHeads.map((head) => {
                        if (head.chatId === chatId) {
                            return {
                                ...head,
                                preview: firstUserMessage.text,
                            };
                        }
                        return head;
                    });
                }
            }

            return {
                allChats: {
                    ...state.allChats,
                    [chatId]: newMessages,
                },
                chatHeads: updatedChatHeads,
            };
        }),

    reset: () =>
        set({
            chatHeads: [],
            allChats: {},
        }),
}));