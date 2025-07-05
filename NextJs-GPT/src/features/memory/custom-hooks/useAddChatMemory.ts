// lib/hooks/useAddChatMemory.ts
import { useCallback } from "react";
import { v4 as uuid } from "uuid";
import { addMemory, getMemories } from "@/lib/chatServices";
import { Memory } from "@/components/widgets/ChatMemoriesDropdown";
import { useMemoryStore } from "@/lib/stores/useMemoryStore";

export type AddChatMemoryArgs = {
  userId: string;
  activeChatId: string;
  memoryContext: string;
  tags: string;
};


export function useAddChatMemory() {
  
  // Global State
  const setMemories = useMemoryStore((state) => state.setChatMemories);

  return useCallback(
    async ({
      userId,
      activeChatId,
      memoryContext,
      tags,
    }: AddChatMemoryArgs): Promise<{success:boolean, error?:string}> => {
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const chatMem: Memory = {
        mem_id: uuid(),
        context: memoryContext,
        tags: tagsArray,
      };

      const addResponse = await addMemory(userId, activeChatId, chatMem);
      if (!addResponse.success) {
        return { success: false, error: addResponse.message };
      }

      const fetchResponse = await getMemories(userId, activeChatId);
      if (
        fetchResponse.success &&
        Array.isArray(fetchResponse.message)
      ) {
        setMemories(fetchResponse.message);
        return { success: true };
      } else {
        return { success: false, error: "Error fetching updated memories." };
      }
    },
    [setMemories]
  );
}
