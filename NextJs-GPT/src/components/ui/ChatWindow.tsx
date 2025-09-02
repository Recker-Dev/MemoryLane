// ChatWindow.tsx
import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

import { useChatStore } from "@/lib/stores/useChatStore";
import { useUserStateStore } from "@/lib/stores/useUserStateStore";
import { useUIStore } from "@/lib/stores/useUIStore";

interface ChatWindowProps {
}

const ChatWindow: React.FC<ChatWindowProps> = () => {
  const activeChatId = useUserStateStore((state) => state.activeChatId);
  const isProcessingInput = useUIStore((s) => s.isProcessingInput);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  if (!activeChatId) {
    return (
      <div className="flex-grow flex items-center justify-center text-gray-500">
        No chat selected
      </div>
    );
  }

  const relevantChatHistory = useChatStore(
    (state) => state.chatHistory[activeChatId]
  );

  const messages = relevantChatHistory
    ? relevantChatHistory.order.map((msgId) => relevantChatHistory.messages[msgId])
    : [];

  useEffect(() => {
    bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isProcessingInput])

  return (
    <div className="flex-grow overflow-y-auto space-y-8 px-12 py-4 scrollbar-custom">
      {messages.map((msg, index) => (
        <MessageBubble
          key={msg.msgId || index}
          sender={msg.role as "ai" | "user"}
          text={msg.content}
        />
      ))}
      {isProcessingInput && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
};


export default ChatWindow;
