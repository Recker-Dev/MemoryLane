'use client';
import React from 'react';

export type ChatHead = {
  chatId: string;
  name: string;
  preview: string;
};

type SidebarProps = {
  chatHeads: ChatHead[];
  activeChatId: string | null;
  isLoadingMessages: boolean
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  chatHeads,
  activeChatId,
  isLoadingMessages,
  onSelectChat,
  onNewChat,
}) => {
  return (
    <div className="w-72 bg-gray-950 border-r border-gray-800 rounded-xl shadow-lg mr-4 p-4 flex flex-col h-[calc(100vh-2rem)]">
      <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">Chats</h2>
      <div className="flex flex-col space-y-3">

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full text-left p-4 rounded-lg bg-gradient-to-r from-violet-600 to-purple-800 hover:scale-105 transition-ease-in-out duration-200 ease-in-out shadow-md mt-2 border border-violet-500"
          aria-label="Start new chat"
        >
          <p className="font-semibold text-lg text-white">+ New Chat</p>
          <p className="text-sm text-violet-100 truncate mt-1">Start a fresh conversation.</p>
        </button>


        {/* Chat List */}
        {isLoadingMessages
          ? Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="animate-pulse w-full p-4 rounded-lg bg-gray-800 border border-gray-700"
            >
              <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          ))
          : chatHeads.map((chat) => (
            <button
              key={chat.chatId}
              onClick={() => onSelectChat(chat.chatId)}
              className={`w-full text-left p-4 rounded-lg transition-colors duration-200 ease-in-out shadow-md border border-gray-700 ${activeChatId === chat.chatId
                ? 'bg-purple-800 hover:bg-purple-700'
                : 'bg-gray-800 hover:bg-gray-700'
                }`}
              aria-label={`Select chat: ${chat.name}`}
            >
              <p className="font-semibold text-lg text-white">{chat.name}</p>
              <p className="text-sm text-gray-300 truncate mt-1">{chat.preview}</p>
            </button>
          ))}
      </div>
    </div>
  );
};
export default Sidebar;
