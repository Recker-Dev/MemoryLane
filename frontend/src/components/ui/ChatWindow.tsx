// ChatWindow.tsx
import React, {useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

import { useChatStore } from "@/lib/stores/useChatStore";
import { useUserStateStore } from "@/lib/stores/useUserStateStore";
import { useUIStore } from "@/lib/stores/useUIStore";



const ChatWindow: React.FC = () => {
  const activeChatId = useUserStateStore((state) => state.activeChatId);
  const isProcessingInput = useUIStore((s) => s.isProcessingInput);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const EMPTY_ARRAY: string[] = [];

  const msgOrder = useChatStore(
    (state) => (activeChatId ? state.chatHistory[activeChatId]?.order ?? EMPTY_ARRAY : EMPTY_ARRAY)
  );

  useEffect(() => {
    bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgOrder.length, isProcessingInput])

  return (
    <div className="flex-grow overflow-y-auto space-y-8 px-12 py-4 scrollbar-custom">
      {msgOrder.map((id, index) => (
        <MessageBubble
          key={id || index}
          id={id}
        />
      ))}
      {isProcessingInput && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
};


export default ChatWindow;
