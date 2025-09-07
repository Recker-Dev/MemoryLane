// CUSTOM HOOK

import { useCallback } from 'react';
import { Memory } from '@/components/widgets/ChatMemoriesDropdown';
import toast from "react-hot-toast";
import { toggleMemoryPersistanceApiHelper } from "@/lib/chatServices";
import { useMemoryStore } from '@/lib/stores/useMemoryStore';
import { useUserStateStore } from '@/lib/stores/useUserStateStore';

export function useToggleChatPersistance() {

    ////// GLOBAL STATES ///////
    const userId = useUserStateStore((state) => state.userId);
    const activeChatId = useUserStateStore((state) => state.activeChatId);
    const removeFromSelectedMemoriesById = useMemoryStore((state) => state.removeFromSelectedMemoriesById);
    const setChatMemories = useMemoryStore((state) => state.setChatMemories);


    const handleToggleMemoryPersistance = useCallback(
        async (memory: Memory) => {

            if (!userId || !activeChatId || !memory.memid) return;

            const {selectedMemories} = useMemoryStore.getState()

            if (selectedMemories.some((m) => m.memid === memory.memid)) { // selectedMemories accessed directly to get freshdata and not stale.
                removeFromSelectedMemoriesById(memory.memid);
            }

            const { chatMemories } = useMemoryStore.getState(); // chatMemories got using getState() is fixed in time and not gonna autoupdate.
            // Inside the fuction because  to ✅ get freshest snapshot at click time

            //Optimistic UI update
            const updatedMemories = chatMemories.map((m) => m.memid == memory.memid ? { ...m, persist: !m.persist } : m);
            setChatMemories(updatedMemories)

            try {
                const response = await toggleMemoryPersistanceApiHelper(userId, activeChatId, memory.memid, !memory.persist);
                if (!response.success) {
                    // Rollback logic
                    toast.error(response.error || "Failed to toggle memory");
                    setChatMemories(chatMemories);
                    return;
                }
            } catch (err) {
                console.error("Failed to toggle persistence:", err);
                // Rollback on error
                setChatMemories(chatMemories);
            }

        }, [userId, activeChatId, setChatMemories, removeFromSelectedMemoriesById]);

    return handleToggleMemoryPersistance
}

