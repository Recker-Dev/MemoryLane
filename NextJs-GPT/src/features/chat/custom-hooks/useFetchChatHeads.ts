import { useEffect, useRef } from "react";
import { fetchChatHeads } from "@/lib/chatServices";
import { toast } from "react-hot-toast";
import { ChatHead } from "@/components/sidebar";



export function useFetchChatHeads(args: {
    userId: string | null;
    isUserSynced: boolean,
    chatHeads: ChatHead[];
    setChatHeads: (heads: any[]) => void;
}) {
    const { userId, isUserSynced, chatHeads,setChatHeads } = args;

    const hasFetched = useRef(false);


    useEffect(() => {
        if (!isUserSynced) return;
        if (!userId || chatHeads.length > 0) return;

        if(hasFetched.current) return;

        hasFetched.current = true;

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