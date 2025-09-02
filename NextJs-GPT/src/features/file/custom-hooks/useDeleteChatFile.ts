// CUSTOM HOOK

import { useCallback } from 'react';
import { FileType } from '@/components/widgets/ChatFilesDropdown';
import toast from "react-hot-toast";
import { deleteChatFilesApiHelper } from '@/lib/chatServices';

import { useFileStore } from '@/lib/stores/useFileStore';
import { useUserStateStore } from '@/lib/stores/useUserStateStore';

export function useDeleteChatFile() {

    ////// GLOBAL STATES ///////
    const isUserSynced = useUserStateStore((state) => state.isUserSynced);
    const userId = useUserStateStore((state) => state.userId);
    const activeChatId = useUserStateStore((state) => state.activeChatId);
    const removeChatFileById = useFileStore((state) => state.removeChatFileById);
    const addChatFiles = useFileStore((state) => state.addChatFiles);

    const handleDeleteFileClick = useCallback(
        async (file: FileType) => {

            if (!isUserSynced || !userId || !activeChatId) return;

            // Perform Optimistic UI update
            removeChatFileById(file.fileId);

            try {
                const response = await deleteChatFilesApiHelper(userId, activeChatId, [file.fileId]);

                if (!response.success) {
                    toast.error(response.error || "Failed to delete file");
                    // Rollback
                    addChatFiles(file);
                    return;
                }

                toast.success(response.message || "Successfully deleted file");
            } catch (err) {
                console.error("Delete file failed:", err);
                toast.error("An unexpected error occurred while deleting file");
                // Rollback
                addChatFiles(file);
            }
        }, [userId, activeChatId, removeChatFileById, addChatFiles]);

    return handleDeleteFileClick
}

