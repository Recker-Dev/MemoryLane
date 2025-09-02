
import { useCallback } from "react";
import { addChatFileApiHelper, getChatFilesApiHelper } from "@/lib/chatServices";
import { useFileStore } from "@/lib/stores/useFileStore";
import { useUserStateStore } from "@/lib/stores/useUserStateStore";

export type AddChatFiles = {
    selectedFiles: File[]
};

export function useAddChatFiles() {
    // Global State
    const userId = useUserStateStore((state) => state.userId);
    const isUserSynced = useUserStateStore((state) => state.isUserSynced);
    const activeChatId = useUserStateStore((state) => state.activeChatId);

    const setChatFiles = useFileStore((state) => state.setChatFiles);

    const addChatFiles = useCallback(
        async ({ selectedFiles }: AddChatFiles): Promise<{ success: boolean; error?: string }> => {
            if (!isUserSynced) return { success: false, error: "userId is not synced!" };
            if (!userId || !activeChatId) return { success: false, error: "userId and chatId is needed!" };

            const addResponse = await addChatFileApiHelper(userId, activeChatId, selectedFiles);
            if (!addResponse.success) {
                return { success: false, error: addResponse.error };
            }

            const fetchResponse = await getChatFilesApiHelper(userId, activeChatId);
            if (fetchResponse.success && Array.isArray(fetchResponse.data)) {
                setChatFiles(
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
        [isUserSynced, userId, activeChatId, setChatFiles]
    );

    return { addChatFiles };
}
