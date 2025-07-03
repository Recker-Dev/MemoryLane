'use client';
import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';

export type ChatHead = {
  chatId: string;
  name: string;
  preview: string;
};

type SidebarProps = {
  chatHeads: ChatHead[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDelete: (chatId: string) => void;
  onNewChat: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  chatHeads,
  activeChatId,
  onSelectChat,
  onDelete,
  onNewChat,
}) => {
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const menuPositionClass = 'absolute top-0 right-0 mt-1';
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [chatIdToDelete, setChatIdToDelete] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("sidebarScroll");
    if (savedScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, []);

  const handleScroll = () => {
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    sessionStorage.setItem("sidebarScroll", scrollTop.toString());
  };

  const handleMenuToggle = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setMenuOpenFor(prev => (prev === chatId ? null : chatId));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenFor(null);
      }
    };
    if (menuOpenFor) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpenFor]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpenFor(null);
        setShowConfirmModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      <div className="w-72 h-full flex flex-col bg-gray-950 border-r border-gray-800 rounded-xl shadow-lg mr-4 overflow-hidden">
        {/* Top static content */}
        <div className="flex-shrink-0 p-4">
          <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">
            Chats
          </h2>
          <button
            onClick={onNewChat}
            className="w-full text-left p-4 rounded-lg bg-gradient-to-r from-violet-600 to-purple-800 hover:scale-105 transition duration-200 shadow-md mt-2 border border-violet-500 hover:cursor-pointer"
            aria-label="Start new chat"
          >
            <p className="font-semibold text-lg text-white">+ New Chat</p>
            <p className="text-sm text-violet-100 truncate mt-1">
              Start a fresh conversation.
            </p>
          </button>
        </div>

        {/* Scrollable chat list */}
        <div
          ref={scrollContainerRef}
          className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar"
          onScroll={handleScroll}>
          {chatHeads.map((chat) => (
            <div key={chat.chatId} className="relative group">
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectChat(chat.chatId)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectChat(chat.chatId); }}
                className={clsx(
                  'w-full text-left p-4 rounded-lg transition-colors duration-200 ease-in-out shadow-md border border-gray-700 flex justify-between items-center cursor-pointer',
                  activeChatId === chat.chatId
                    ? 'bg-purple-800 hover:bg-purple-700'
                    : 'bg-gray-800 hover:bg-gray-700'
                )}
              >
                <div className="flex-grow overflow-hidden pr-2">
                  <p className="font-semibold text-lg text-white truncate">{chat.name}</p>
                  <p className="text-sm text-gray-300 truncate mt-1">{chat.preview}</p>
                </div>
                <button
                  onClick={(e) => handleMenuToggle(e, chat.chatId)}
                  className="p-1 rounded-full hover:bg-gray-600/50 transition-opacity flex-shrink-0 opacity-0 group-hover:opacity-100"
                  aria-label="More options"
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {menuOpenFor === chat.chatId && (
                <div
                  ref={menuRef}
                  className={`absolute right-0 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 ${menuPositionClass}`}
                >
                  <ul className="py-1">
                    <li>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Rename not implemented');
                          setMenuOpenFor(null);
                        }}
                      >
                        <Edit size={16} className="mr-2" /> Rename
                      </button>
                    </li>
                    <li>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/50 flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatIdToDelete(chat.chatId);
                          setShowConfirmModal(true);
                          setMenuOpenFor(null);
                        }}
                      >
                        <Trash2 size={16} className="mr-2" /> Delete
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>

      {/* Confirmation Modal */}
      {showConfirmModal && chatIdToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center border border-gray-700
                        transform transition-all duration-300 scale-95 opacity-0 animate-scaleIn">
            <h2 className="text-2xl font-bold text-white mb-3">Delete Chat?</h2>
            <p className="text-gray-400 text-base mb-8 leading-relaxed">
              Are you sure you want to delete this chat? This action is irreversible.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setChatIdToDelete(null);
                }}
                className="px-6 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium
                          transition-all duration-200 ease-in-out
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(chatIdToDelete);
                  setShowConfirmModal(false);
                  setChatIdToDelete(null);
                }}
                className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold
                          transition-all duration-200 ease-in-out
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
