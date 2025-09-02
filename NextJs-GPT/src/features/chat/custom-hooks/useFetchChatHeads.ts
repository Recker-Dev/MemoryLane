import { useEffect, useRef } from "react";
import { fetchChatHeadsApiHelper } from "@/lib/chatServices";
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

        (async () => {
            try {
                const response = await fetchChatHeadsApiHelper(userId);

                if (response.success) {
                    if (Array.isArray(response.data)) {
                        setChatHeads(response.data);
                    }
                } else {
                    if (response.error !== "user not found") {
                        toast.error("Error fetching chat-heads!");
                    }
                }
            } catch (err) {
                console.error("Unexpected error fetching chat-heads:", err);
                toast.error("Unexpected error fetching chat-heads!");
            }
        })();
    }, [isUserSynced, userId, chatHeads, setChatHeads]);
}