import { Memory } from '@/components/widgets/ChatMemoriesDropdown';
import { create } from 'zustand';

export type MemoryStore = {

    chatMemories: Memory[],
    setChatMemories: (memories: Memory[]) => void,
    removeMemoryById: (id: string) => void,
    reset: () => void
}

export const useMemoryStore = create<MemoryStore>((set) => ({

    chatMemories: [],

    setChatMemories: (memories) => set(({
        chatMemories: memories
    })),

    removeMemoryById: (id) => set((state) => ({
        chatMemories: state.chatMemories.filter((memory) => memory.mem_id !== id)
    })),

    reset: () => set({
        chatMemories: [],
    })
}));