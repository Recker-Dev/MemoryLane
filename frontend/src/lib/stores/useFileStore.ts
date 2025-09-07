import { create } from 'zustand';
import { FileType } from '@/components/widgets/ChatFilesDropdown';

export type FileStore = {

    chatFiles: Map<string, FileType>,
    setChatFiles: (files: FileType[]) => void,
    addChatFiles: (file: FileType) => void,
    removeChatFileById: (id: string) => void,
    resetFilesData: () => void


    selectedFiles: FileType[],
    appendToSelectedFiles: (file: FileType) => void,
    removeFromSelectedFiles: (file: FileType) => void,
    resetSelectedFiles: () => void
}

export const useFileStore = create<FileStore>((set) => ({

    chatFiles: new Map(),

    setChatFiles: (files) => set(() => {
        const fileMap = new Map();

        files.forEach(f => {
            fileMap.set(f.fileId, { ...f });
        });

        return { chatFiles: fileMap };
    }),

    addChatFiles: (file) => set((state) => {
        const updated = new Map(state.chatFiles);

        // insert or overwrite
        updated.set(file.fileId, { ...file });

        const sortedEntries = [...updated.entries()].sort(
            (a, b) => new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime()
        )
        return { chatFiles: new Map(sortedEntries) };
    }),

    removeChatFileById: (id) => set((state) => {
        const updated = new Map(state.chatFiles);

        updated.delete(id);

        return { chatFiles: updated };
    }),

    resetFilesData: () => set({
        chatFiles: new Map(),
    }),



    selectedFiles: [],

    appendToSelectedFiles: (file) => set((state) => ({ // Either wrap {} in ()
        selectedFiles: [...state.selectedFiles, file]
    })),

    removeFromSelectedFiles: (file) => set((state) => {
        return { // Or use {return {}}
            selectedFiles: state.selectedFiles.filter((fl) => fl.fileId !== file.fileId)
        }
    }),

    resetSelectedFiles: () => set({
        selectedFiles: []
    })


}));