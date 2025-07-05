import { useEffect, useRef } from "react";
import { fetchChatHeads } from "@/lib/chatServices";
import { toast } from "react-hot-toast";

import { useUserStateStore } from "@/lib/stores/useUserStateStore";
import { useChatStore } from "@/lib/stores/useChatStore";



export function useFetchChatHeads() {

    const isUserSynced = useUserStateStore((state) => state.isUserSynced);
    const userId = useUserStateStore((state) => state.userId);


    const chatHeads = useChatStore((state) => state.chatHeads);
    const setChatHeads = useChatStore((state) => state.setChatHeads);


    const hasFetched = useRef(false); // Checker for 1 time fetch until re-needed.


    useEffect(() => {
        if (!isUserSynced) return;
        if (!userId || chatHeads.length > 0) return;

        if (hasFetched.current) return;

        hasFetched.current = true; // Once set true, effect won't run api call again.

        fetchChatHeads(userId).then(response => {
            if (response.success) {
                if (Array.isArray(response.message)) {
                    setChatHeads(response.message);
                }
            } else {
                toast.error("Error Fetching chats-heads!");
            }
        });
    }, [isUserSynced, userId, chatHeads, setChatHeads]);
}