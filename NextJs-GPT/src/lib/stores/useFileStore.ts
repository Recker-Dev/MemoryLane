import { create } from 'zustand';
import { FileUiType } from '@/components/widgets/ChatFilesDropdown';

export type FileStore = {

    chatFiles: FileUiType[],
    setChatFiles: (files: FileUiType[]) => void,
    removeFileById: (id: string) => void,
    reset: () => void


    selectedFiles: FileUiType[],
    appendToSelectedFiles: (file: FileUiType) => void,
    removeFromSelectedFiles: (file: FileUiType) => void,
    resetSelectedFiles: () => void
}

export const useFileStore = create<FileStore>((set) => ({

    chatFiles: [],

    setChatFiles: (files) => set(({
        chatFiles: files
    })),

    removeFileById: (id) => set((state) => ({
        chatFiles: state.chatFiles.filter((file) => file.file_id !== id)
    })),

    reset: () => set({
        chatFiles: [],
    }),



    selectedFiles: [],

    appendToSelectedFiles: (file) => set((state) => ({ // Either wrap {} in ()
        selectedFiles: [...state.selectedFiles, file] 
    })),

    removeFromSelectedFiles: (file) => set((state) => { return { // Or use {return {}}
        selectedFiles: state.selectedFiles.filter((fl) => fl.file_id !== file.file_id) 
    }}), 

    resetSelectedFiles: () => set({
        selectedFiles: []
    })


}));