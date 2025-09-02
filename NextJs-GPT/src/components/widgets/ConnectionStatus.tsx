// components/chat/ConnectionStatus.tsx
"use client";
import { useState } from "react";
import { RotateCw } from "lucide-react";
import { useChatWebSocketStore } from "@/lib/stores/useChatWebSocketStore";
import { useUserStateStore } from "@/lib/stores/useUserStateStore";

export const ConnectionStatus = () => {

    const userId = useUserStateStore((s) => s.userId);
    const activeChatId = useUserStateStore((s) => s.activeChatId);

    // ✅ only subscribe to connect fn (doesn't cause rerenders)
    const connect = useChatWebSocketStore((s) => s.connect);

    // ✅ subscribe only to the websocket of *this* activeChatId
    const connectionState = useChatWebSocketStore(
        (s) => activeChatId ? s.wsMap.get(activeChatId)?.readyState : undefined
    );

    const isWebSocketValidAndConnected =
        activeChatId && connectionState === WebSocket.OPEN;


    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async () => {
        if (!activeChatId || !userId) return;
        setIsRetrying(true);
        try {
            // your reconnect logic here
            // e.g. re-initiate websocket connection
            console.log("Retrying connection...");
            // await new Promise((res) => setTimeout(res, 2000)); // fake delay
            if (connectionState !== WebSocket.OPEN) {
                connect(userId, activeChatId);
            }
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <p>Connection Status:</p>

            <span
                className={`font-bold pt-1 ${isWebSocketValidAndConnected ? "text-green-500" : "text-red-500"}`}
            >
                {isWebSocketValidAndConnected ? "🟢" : "🔴"}
            </span>

            {!isWebSocketValidAndConnected && (
                <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className={`p-1 ${isRetrying ? "opacity-70 cursor-not-allowed" : "hover:opacity-80"
                        }`}
                    title="Retry connection"
                >
                    <RotateCw
                        className={`w-5 h-5 ${isRetrying ? "animate-spin" : ""} text-white`}
                    />
                </button>
            )}


        </div>
    );
};

