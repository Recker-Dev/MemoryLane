import { create } from 'zustand';
import { FileType } from '@/components/widgets/ChatFilesDropdown';

export type FileStore = {

    chatFiles: FileType[],
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

    chatFiles: [],

    setChatFiles: (files) => set(({
        chatFiles: files
    })),

    addChatFiles: (file) => set((state) => {
    const updated = [...state.chatFiles, file];
    updated.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return { chatFiles: updated };
  }),

    removeChatFileById: (id) => set((state) => ({
        chatFiles: state.chatFiles.filter((file) => file.fileId !== id)
    })),

    resetFilesData: () => set({
        chatFiles: [],
    }),



    selectedFiles: [],

    appendToSelectedFiles: (file) => set((state) => ({ // Either wrap {} in ()
        selectedFiles: [...state.selectedFiles, file] 
    })),

    removeFromSelectedFiles: (file) => set((state) => { return { // Or use {return {}}
        selectedFiles: state.selectedFiles.filter((fl) => fl.fileId !== file.fileId) 
    }}), 

    resetSelectedFiles: () => set({
        selectedFiles: []
    })


}));