// CUSTOM HOOK

import { useCallback } from 'react';
import toast from "react-hot-toast";
import { toggleFilePersistanceApiHelper } from "@/lib/chatServices";
import { useFileStore } from '@/lib/stores/useFileStore';
import { useUserStateStore } from '@/lib/stores/useUserStateStore';
import { FileType } from '@/components/widgets/ChatFilesDropdown';

export function useToggleFilePersistance() {

    ////// GLOBAL STATES ///////
    const userId = useUserStateStore((state) => state.userId);
    const activeChatId = useUserStateStore((state) => state.activeChatId);
    const removeFromSelectedFiles = useFileStore((state) => state.removeFromSelectedFiles);
    const setChatFiles = useFileStore((state) => state.setChatFiles);


    const handleToggleFilePersistance = useCallback(
        async (file: FileType) => {

            if (!userId || !activeChatId || !file.fileId) return;
            if (file.status === "processing") {
                toast.error(`File is in the oven ⏲️! Standby!`)
                return;
            }
            if (file.isVectorDBCreated === false && file.error != "" && file.status === "failed") {
                toast.error(`${file.fileName} failed vectorization in backend. Cannot use the file, kindly delete the upload and reupload a valid file.`);
                return;
            }

            const selectedFiles = useFileStore.getState().selectedFiles;

            if (selectedFiles.some((f) => f.fileId === file.fileId)) { // selectedFiles accessed directly to get freshdata and not stale.
                removeFromSelectedFiles(file);
            }

            const chatFilesMap = useFileStore.getState().chatFiles; // chatFilesMap got using getState() is fixed in time and not gonna autoupdate.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const chatFiles = [...chatFilesMap.entries()].map(([_, f]) => f);
            // Inside the fuction because  to ✅ get freshest snapshot at click time

            //Optimistic UI update
            
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const updatedFiles = [...chatFilesMap.entries()].map(([_, f]) => f.fileId == file.fileId ? { ...f, persist: !f.persist } : f);
            setChatFiles(updatedFiles)

            try {
                const response = await toggleFilePersistanceApiHelper(userId, activeChatId, file.fileId, !file.persist);
                if (!response.success) {
                    // Rollback logic
                    toast.error(response.error || "Failed to toggle memory");
                    setChatFiles(chatFiles);
                    return;
                }
            } catch (err) {
                console.error("Failed to toggle persistence:", err);
                // Rollback on error
                setChatFiles(chatFiles);
            }

        }, [userId, activeChatId, setChatFiles, removeFromSelectedFiles]);

    return handleToggleFilePersistance
}

