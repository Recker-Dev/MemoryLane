// lib/hooks/useAddChatMemory.ts
import { useCallback } from "react";
import { addChatMemoryApiHelper, getMemoriesApiHelper } from "@/lib/chatServices";
import { useMemoryStore } from "@/lib/stores/useMemoryStore";
import { useUserStateStore } from "@/lib/stores/useUserStateStore";

export type AddChatMemoryArgs = {
  memoryContext: string;
  tags: string;
};


export function useAddChatMemory() {

  // Global State


  const setMemories = useMemoryStore((state) => state.setChatMemories);

  return useCallback(
    async ({
      memoryContext,
    }: AddChatMemoryArgs): Promise<{ success: boolean, error?: string }> => {

      const isUserSynced = useUserStateStore.getState().isUserSynced;
      const userId = useUserStateStore.getState().userId;
      const activeChatId = useUserStateStore.getState().activeChatId;

      if (!userId || !activeChatId || !isUserSynced) return { success: false, error: "userId and chatId is needed!" }

      const addResponse = await addChatMemoryApiHelper(userId, activeChatId, memoryContext);
      if (!addResponse.success) {
        return { success: false, error: addResponse.error };
      }

      const fetchResponse = await getMemoriesApiHelper(userId, activeChatId);
      if (
        fetchResponse.success &&
        Array.isArray(fetchResponse.data)
      ) {
        setMemories(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fetchResponse.data.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          }))
        );
        return { success: true };
      } else {
        return { success: false, error: "Error fetching updated memories." };
      }
    },
    [setMemories]
  );
}
