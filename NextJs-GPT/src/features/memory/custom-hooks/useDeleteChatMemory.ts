// CUSTOM HOOK

import { useCallback } from 'react';
import { Memory } from '@/components/chatMemoriesDropdown';
import toast from "react-hot-toast";
import { deleteMemory } from '@/lib/chatServices';


export function useDeleteChatMemory(args: {
    userId: string | null;
    activeChatId: string | null;
    setMemories: (value: React.SetStateAction<Memory[]>) => void;

}) {
    const { userId, activeChatId, setMemories } = args;

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
                setMemories((prevMemories) =>
                    prevMemories.filter((memory) => memory.mem_id !== memoryId));

            };
        }, [userId, activeChatId, setMemories]);

    return handleDeleteMemoryClick
}

