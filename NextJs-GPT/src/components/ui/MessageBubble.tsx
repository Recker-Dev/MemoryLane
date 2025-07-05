import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

export type MessageBubbleProps = {
  id?: string;
  sender: 'ai' | 'user';
  text: string;
};

const MessageBubble: React.FC<MessageBubbleProps> =({sender, text }) => {
  const isUser = sender === 'user'; //Checks if sender is user or ai.

  const messagesEndRef = useRef<HTMLDivElement|null>(null);

  useEffect(() =>{
    if (messagesEndRef.current)
    {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  },[text]) // Only runs when new text arrives, or else it will scroll even if we start typing.

  return (
    <div ref={messagesEndRef} className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "p-3 rounded-lg max-w-xl text-xl shadow-md",
          isUser
            ? "bg-gradient-to-r from-violet-900 to-purple-800 text-white ml-auto"
            : "border border-gray-700 text-gray-300 backdrop-blur-md bg-opacity-0"
        )}
      >
        <p className="font-medium text-white">
          {isUser ? 'You:' : 'AI:'}
        </p>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default MessageBubble;