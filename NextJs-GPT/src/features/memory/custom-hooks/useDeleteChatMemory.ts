// CUSTOM HOOK

import { useCallback } from 'react';
import { Memory } from '@/components/widgets/ChatMemoriesDropdown';
import toast from "react-hot-toast";
import { deleteMemory } from '@/lib/chatServices';

import { useMemoryStore } from '@/lib/stores/useMemoryStore';
import { useUserStateStore } from '@/lib/stores/useUserStateStore';

export function useDeleteChatMemory() {

    ////// GLOBAL STATES ///////
    const userId = useUserStateStore((state)=> state.userId);
    const activeChatId = useUserStateStore((state)=> state.activeChatId);

    const removeMemoryById = useMemoryStore((state) => state.removeMemoryById);

    const handleDeleteMemoryClick = useCallback(
        async (memoryId: string) => {

            if (!userId || !activeChatId) return;

            const response = await deleteMemory(userId, activeChatId, memoryId);

            if (!response.success) {
                toast.error(response.message || "Failed to delete memory");
                return;
            }

            if (response.success) {
                toast.success(response.message || "Succesfully deleted memory");

                // Perform Optimistic UI update
                removeMemoryById(memoryId);
            }
        }, [userId, activeChatId, removeMemoryById]);

    return handleDeleteMemoryClick
}

