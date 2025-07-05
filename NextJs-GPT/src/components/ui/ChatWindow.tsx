// ChatWindow.tsx
import React from 'react';
import MessageBubble, { type MessageBubbleProps } from '@/components/ui/MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ChatWindowProps {
  messages: MessageBubbleProps[] | null;
  isProcessingInput: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isProcessingInput }) => {
  
  return (
    <div className="flex-grow overflow-y-auto space-y-6 px-12 py-4 scrollbar-custom">
      {messages &&
      messages.map((msg, index) => (
        <MessageBubble key={msg.id || index}  sender={msg.sender as 'ai' | 'user'} text={msg.text} />
      ))}
      {isProcessingInput && <TypingIndicator />}

    </div>
  );
};

export default ChatWindow;