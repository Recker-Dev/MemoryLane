// CUSTOM HOOK

import { useEffect } from 'react';
import { useUserStateStore } from '@/lib/stores/useUserStateStore';


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

}) {
    const { chatIdFromRoute } = args;

    const setActiveChatId = useUserStateStore((state) => state.setActiveChatId);

    useEffect(() => {
        if (chatIdFromRoute) {
            setActiveChatId(chatIdFromRoute);
        } else {
            setActiveChatId(null);
        }
    }, [chatIdFromRoute, setActiveChatId]);
}

