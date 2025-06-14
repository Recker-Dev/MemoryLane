// ChatWindow.tsx
import React from 'react';
import MessageBubble, { type MessageBubbleProps } from '@/components/messageBubble';
import TypingIndicator from './typingIndicator';

interface ChatWindowProps {
  messages: MessageBubbleProps[];
  isProcessingInput: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isProcessingInput }) => {
  return (
    <div className="flex-grow overflow-y-auto space-y-6 px-12 py-4 custom-scrollbar">
      {messages.map((msg, _) => (
        <MessageBubble key={msg.id} sender={msg.sender as 'ai' | 'user'} text={msg.text} />
      ))}
      {isProcessingInput && <TypingIndicator />}
    </div>
  );
};

export default ChatWindow;