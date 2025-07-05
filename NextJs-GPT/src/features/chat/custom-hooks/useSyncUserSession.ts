// CUSTOM HOOK

import { useEffect } from 'react';
import { useUserStateStore } from '@/lib/stores/useUserStateStore';
import { useChatStore } from '@/lib/stores/useChatStore';


/**
 * --------------------------------------------------------
 * useSyncUserSession.ts 
 *
 * Feature logic to synchronize user session data between
 * the current route and the local Zustand store.
 *
 * - Ensures that when the route-based userId changes
 *   (e.g. due to user switching accounts),
 *   the app updates:
 *      - local userId state
 *      - clears chat heads
 *      - resets chat messages in the store
 *
 * Used in chat page initialization flow.
 * --------------------------------------------------------
 */

export function useSyncUserSession(args: {
  userIdFromRoute: string | null;

}) {
  const { userIdFromRoute } = args;

  const setIsUserSynced = useUserStateStore((state) => state.setIsUserSynced);

  const userId = useUserStateStore((state) => state.userId);
  const setUserId = useUserStateStore((state) => state.setUserId);

  const resetUserCreds = useUserStateStore((state) => state.reset);
  const resetChatCreds = useChatStore((state) => state.reset);


  useEffect(() => {
    if (userIdFromRoute && userId !== userIdFromRoute) {
      resetUserCreds();
      resetChatCreds();
      setUserId(userIdFromRoute);
      setIsUserSynced(true); // If diff user, reset stuff and set sync as true.
    } else if (userIdFromRoute && userId === userIdFromRoute) {
      setIsUserSynced(true); // If not diff user, dont reset stuff and set sync true.
    }
  }, [
    userIdFromRoute,
    userId,
    setUserId,
    setIsUserSynced,
    resetUserCreds,
    resetChatCreds
  ]);
}
