import { Memory } from '@/components/widgets/ChatMemoriesDropdown';
import { create } from 'zustand';

export type MemoryStore = {

    chatMemories: Memory[],
    setChatMemories: (memories: Memory[]) => void,
    removeMemoryById: (id: string) => void,
    reset: () => void


    selectedMemories: Memory[],
    appendToSelectedMemories: (memory: Memory) => void,
    removeFromSelectedMemories: (memory: Memory) => void,
    resetSelectedMemories: () => void
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
    }),



    selectedMemories: [],

    appendToSelectedMemories: (memory) => set((state) => ({ // Either wrap {} in ()
        selectedMemories: [...state.selectedMemories, memory] 
    })),

    removeFromSelectedMemories: (memory) => set((state) => { return { // Or use {return {}}
        selectedMemories: state.selectedMemories.filter((mem) => mem.mem_id !== memory.mem_id) 
    }}), 

    resetSelectedMemories: () => set({
        selectedMemories: []
    })


}));