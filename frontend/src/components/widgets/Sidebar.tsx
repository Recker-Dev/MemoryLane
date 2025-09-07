import React, { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConfirmChatDeleteModal } from '@/components/widgets/ConfimChatDeleteModal';

import { useChatStore } from '@/lib/stores/useChatStore';
import { useUserStateStore } from '@/lib/stores/useUserStateStore';

export type ChatHead = {
  chatId: string;
  name: string;
  preview: string;
};

type SidebarProps = {
  onNewChat: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  onNewChat,
}) => {

  const router = useRouter();

  //////////// GLOBAL States ///////////

  const userId = useUserStateStore((state) => state.userId);
  const activeChatId = useUserStateStore((state) => state.activeChatId);
  const setActiveChatId = useUserStateStore((state) => state.setActiveChatId);

  const chatHeads = useChatStore((state) => state.chatHeads);

  /////////// COMPONENT States ///////////

  // Tracks which chatId currently has the kebab menu open.
  // null = no menu open
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  // Whether the confirm-delete modal is visible.
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Tracks which chatId is pending deletion (passed into modal).
  const [chatIdToDelete, setChatIdToDelete] = useState<string | null>(null);

  // Ref to the menu element for outside-click detection.
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Ref to the chat list scroll container, for persisting scroll position across reloads.
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    // Check if there’s a previously saved scroll position in session storage
    const savedScroll = sessionStorage.getItem("sidebarScroll");
    if (savedScroll && scrollContainerRef.current) {
      const val = parseInt(savedScroll, 10);
      if (!isNaN(val)) {
        // Restore the scrollTop value so user sees sidebar in same place after page reload
        scrollContainerRef.current.scrollTop = val;
      }
    }
  }, []); // Runs once when mounted.

  const handleScroll = () => {
    // When the user scrolls the sidebar, save the scrollTop value
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    sessionStorage.setItem("sidebarScroll", scrollTop.toString());
  };


  const handleMenuToggle = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    // Toggle open/close of the menu for a specific chat
    setMenuOpenFor(prev => (prev === chatId ? null : chatId));
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        // User clicked outside the dropdown → close it
        setMenuOpenFor(null);
      }
    };

    if (menuOpenFor) {
      //  If Menu is open → listen for outside clicks
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside); // Runs(when unmounting) if listener was mounted.
    }
  }, [menuOpenFor]);

  // Route to selected chatId 
  const handleSelectChat = useCallback((chatId: string) => {
    if (!userId) return;
    if (activeChatId === chatId) return;

    setActiveChatId(chatId);
    router.push(`/chat/${userId}/${chatId}`);
    
  }, [userId, activeChatId, setActiveChatId, router]);



  return (
    <>
      <div className="w-72 h-full flex flex-col bg-gray-950 border-r border-gray-800 rounded-xl shadow-lg mr-4 overflow-hidden">
        {/* Top static content  OF ADDING NEW CHAT */}
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

        {/* Scrollable chat list OF ACTUAL CHAT HEADS*/}
        <div
          ref={scrollContainerRef}
          className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-hidden"
          onScroll={handleScroll}>
          {chatHeads.map((chat) => (
            <div key={chat.chatId} className="relative group">
              <div
                role="button"
                tabIndex={0} // Makes div element tab inter-actable
                onClick={() => handleSelectChat(chat.chatId)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectChat(chat.chatId); }} // Allows Enter and Space to select chat-head.
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

              {/* Chat-head MENU for Delete or Rename */}
              {menuOpenFor === chat.chatId && (
                <div
                  ref={menuRef}
                  className={`absolute right-0 top-0 mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10`}
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
      {/* OverLay Delete Model for Chat-Head */}
      <ConfirmChatDeleteModal
        isOpen={showConfirmModal}
        chatIdToDelete={chatIdToDelete}
        onClose={() => {
          setShowConfirmModal(false);
          setChatIdToDelete(null);
        }}
      />
    </>
  );
};

export default Sidebar;
