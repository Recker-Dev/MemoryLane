// CUSTOM HOOK

import { useEffect } from 'react';
import { UseBoundStore, StoreApi } from "zustand";
import { ChatStore } from "@/lib/stores/chatStore";


/**
 * --------------------------------------------------------
 * useSyncActiveChatId.ts
 *
 * Feature logic to synchronize active chat id. b
 *
 * - Ensures that if chatId is there in route,
 *   it needs to be updated and set or else
 *   keep it null.
 * 
 * Used in chat page initialization flow.
 * --------------------------------------------------------
 */

export function useSyncActiveChatId(args: {
    chatIdFromRoute: string | null;
    setActiveChatId: (id: string | null) => void;

}) {
    const { chatIdFromRoute, setActiveChatId } = args;

    useEffect(() => {
        if (chatIdFromRoute) {
            setActiveChatId(chatIdFromRoute);
        } else {
            setActiveChatId(null);
        }
    }, [chatIdFromRoute, setActiveChatId]);
}

