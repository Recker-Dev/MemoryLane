// ChatWindow.tsx
import React from 'react';
import MessageBubble, { type MessageBubbleProps } from '@/components/messageBubble';
import TypingIndicator from './typingIndicator';

interface ChatWindowProps {
  messages: MessageBubbleProps[] | null;
  isProcessingInput: boolean;
  isLoadingMessages: boolean
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isProcessingInput, isLoadingMessages }) => {
  return (
    <div className="flex-grow overflow-y-auto space-y-6 px-12 py-4 custom-scrollbar">
      {messages &&
      messages.map((msg, index) => (
        <MessageBubble key={msg.id || index}  sender={msg.sender as 'ai' | 'user'} text={msg.text} />
      ))}
      {isProcessingInput && <TypingIndicator />}
      {/* Custom Scrollbar Styles - Now using a standard <style> tag */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px; /* Even tinier scrollbar width */
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #2d3748; /* gray-800 */
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #6b7280; /* gray-500, a bit lighter to stand out on dark track */
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a0aec0; /* gray-400 on hover */
          }
        `}</style>
    </div>
  );
};

export default ChatWindow;