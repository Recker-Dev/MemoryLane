import { create } from 'zustand'
import { type ChatHead } from '@/components/sidebar'

interface ChatStore {

    userId: string | null;
    setUserId: (id: string) => void;


    chatHeads: ChatHead[];
    setChatHeads: (heads: ChatHead[]) => void;
    addChatHead: (head: ChatHead) => void;
    resetChatHeads: () => void;
    removeChatHead: (head: ChatHead) => void;


    isInitialChatHeadFetchDone: boolean;
    setInitialChatHeadFetchDone: (val: boolean) => void;
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

    removeChatHead: (head) =>
        set((state) => ({
            chatHeads: state.chatHeads.filter((chatHead) => chatHead.chatId !== head.chatId),
        })),
    
    resetChatHeads: () => set({ chatHeads: [] }),


    isInitialChatHeadFetchDone : false,
    setInitialChatHeadFetchDone: (val) => set(() => ({ isInitialChatHeadFetchDone: val })),
    
}));