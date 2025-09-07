import { create } from 'zustand';

export type UserState = {
    isUserSynced: boolean,
    setIsUserSynced: (val: boolean) => void,

    userId: string | null,
    setUserId: (uid: string | null) => void,

    activeChatId: string | null,
    setActiveChatId: (cid: string | null) => void

    reset: () => void
}

export const useUserStateStore = create<UserState>((set) => ({
    isUserSynced: false,
    setIsUserSynced: (val) => set({ isUserSynced: val }),

    userId: null,
    setUserId: (uid) => set({ userId: uid }),

    activeChatId: null,
    setActiveChatId: (cid) => set({ activeChatId: cid }),

    reset: () => set({
        isUserSynced: false,
        userId: null,
        activeChatId: null
    })
}));