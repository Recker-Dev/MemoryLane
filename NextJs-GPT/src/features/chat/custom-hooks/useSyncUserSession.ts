// CUSTOM HOOK

import { useEffect } from 'react';
import { UseBoundStore, StoreApi } from "zustand";
import { ChatStore } from "@/lib/stores/chatStore";


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
  userId: string | null; 
  setUserId: (id: string) => void;
  setIsUserSynced: (value: boolean) => void;
  reset: () => void;
}) {
  const { userIdFromRoute, userId, setUserId,setIsUserSynced,reset} = args;


  useEffect(() => {
    if (userIdFromRoute && (userId !== userIdFromRoute)) {
      reset();
      setUserId(userIdFromRoute);
    }

    setIsUserSynced(true); // User either gets sync post store reset or if same user, without reset.
  }, [setIsUserSynced,userIdFromRoute, userId, setUserId, reset ]);
}
