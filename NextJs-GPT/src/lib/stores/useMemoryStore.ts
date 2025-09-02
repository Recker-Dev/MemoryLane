import { Memory } from '@/components/widgets/ChatMemoriesDropdown';
import { create } from 'zustand';

export type MemoryStore = {

  chatMemories: Memory[],
  setChatMemories: (memories: Memory[]) => void,
  addChatMemory: (memory: Memory) => void,
  removeMemoryById: (id: string) => void,
  resetChatMemories: () => void


  selectedMemories: Memory[],
  appendToSelectedMemories: (memory: Memory) => void,
  removeFromSelectedMemoriesById: (id: string) => void,
  resetSelectedMemories: () => void
}

export const useMemoryStore = create<MemoryStore>((set) => ({

  chatMemories: [],

  setChatMemories: (memories) => set(({
    chatMemories: memories
  })),

  addChatMemory: (memory) => set((state) => {
    const updated = [...state.chatMemories, memory];
    updated.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return { chatMemories: updated };
  }),

  removeMemoryById: (id) => set((state) => ({
    chatMemories: state.chatMemories.filter((memory) => memory.memid !== id)
  })),

  resetChatMemories: () => set({
    chatMemories: [],
  }),



  selectedMemories: [],

  appendToSelectedMemories: (memory) => set((state) => {
    if (state.selectedMemories.some((mem) => mem.memid === memory.memid)) {
      return state;
    }
    return { selectedMemories: [...state.selectedMemories, memory] }
  }),

  removeFromSelectedMemoriesById: (id) => set((state) => {
    return { // Or use {return {}}
      selectedMemories: state.selectedMemories.filter((mem) => mem.memid !== id)
    }
  }),

  resetSelectedMemories: () => set({
    selectedMemories: []
  })


}));