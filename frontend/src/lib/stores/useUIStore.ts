import { create } from "zustand";

interface UIState {
  isProcessingInput: boolean;
  setIsProcessingInput: (val: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isProcessingInput: false,
  setIsProcessingInput: (val) => set({ isProcessingInput: val }),
}));
