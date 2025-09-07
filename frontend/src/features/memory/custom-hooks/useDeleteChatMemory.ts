// CUSTOM HOOK

import { useCallback } from 'react';
import { Memory } from '@/components/widgets/ChatMemoriesDropdown';
import toast from "react-hot-toast";
import { deleteMemoryApiHelper } from '@/lib/chatServices';

import { useMemoryStore } from '@/lib/stores/useMemoryStore';
import { useUserStateStore } from '@/lib/stores/useUserStateStore';

export function useDeleteChatMemory() {

    ////// GLOBAL STATES ///////
    const userId = useUserStateStore((state) => state.userId);
    const activeChatId = useUserStateStore((state) => state.activeChatId);
    const removeMemoryById = useMemoryStore((state) => state.removeMemoryById);
    const removeFromSelectedMemoriesById = useMemoryStore((state) => state.removeFromSelectedMemoriesById)
    const addChatMemory = useMemoryStore((state) => state.addChatMemory);

    const handleDeleteMemoryClick = useCallback(
        async (memory: Memory) => {

            if (!userId || !activeChatId) return;

            // Perform Optimistic UI update
            removeMemoryById(memory.memid);

            // Check if file in selectedFiles
            if (useMemoryStore.getState().selectedMemories.some((s) => s.memid === memory.memid)) {
                removeFromSelectedMemoriesById(memory.memid); // No need to rollback
            }

            try {
                const response = await deleteMemoryApiHelper(userId, activeChatId, memory.memid);

                if (!response.success) {
                    toast.error(response.error || "Failed to delete memory");
                    // Rollback
                    addChatMemory(memory);
                    return;
                }

                toast.success(response.message || "Successfully deleted memory");
            } catch (err) {
                console.error("Delete memory failed:", err);
                toast.error("An unexpected error occurred while deleting memory");
                // Rollback
                addChatMemory(memory);
            }
        }, [userId, activeChatId, removeMemoryById, addChatMemory, removeFromSelectedMemoriesById]);

    return handleDeleteMemoryClick
}

