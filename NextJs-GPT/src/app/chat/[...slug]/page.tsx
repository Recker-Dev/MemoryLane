'use client'; // This directive ensures the component is rendered on the client-side

import Header from '@/components/Header'; // Import the Header

import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useParams, notFound } from 'next/navigation';



import ChatWindow from '@/components/ui/ChatWindow';
import ChatMemoriesDropdown, { Memory } from '@/components/widgets/ChatMemoriesDropdown';
import ChatFilesDropdown from '@/components/widgets/ChatFilesDropdown';
import ChatInput from '@/components/widgets/ChatInput';
import Sidebar from '@/components/widgets/Sidebar';
import { CreateNewChatModal } from '@/components/widgets/CreateNewChatModal';
import { MemoryAddForm } from '@/components/widgets/MemoryAddForm';
import { FileUploadForm } from '@/components/widgets/FileAddForm';
import { ConnectionStatus } from '@/components/widgets/ConnectionStatus';

import { useChatStore } from '@/lib/stores/useChatStore';
import { useUserStateStore } from '@/lib/stores/useUserStateStore';

import { useSyncUserSession } from '@/features/chat/custom-hooks/useSyncUserSession';
import { useSyncActiveChatId } from '@/features/chat/custom-hooks/useSyncActiveChatId';
import { useFetchChatHeads } from '@/features/chat/custom-hooks/useFetchChatHeads';
import { useChatContentLoader } from '@/features/chat/custom-hooks/useChatContentLoader';

import { useChatWebSocketStore } from '@/lib/stores/useChatWebSocketStore';

import { createChatWebSocket } from '@/lib/chatServices';

// This component provides the basic UI framework for a chat screen,
// now with a full-width background, a wider and centered inner content area,
// improved message spacing, and a visually "pushed right" scrollbar.
export default function ChatPage() {

  // =================================================================================
  // Hooks must be called at the top level, before any early returns.
  // =================================================================================
  const params = useParams();



  ///////// GLOBAL state ///////////

  // Zustand User State Store Values
  const userId = useUserStateStore((state) => state.userId);
  const isUserSynced = useUserStateStore((state) => state.isUserSynced);
  const activeChatId = useUserStateStore((state) => state.activeChatId);




  ///////// COMPONENT state //////////
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showAddMemoryModal, setAddMemoryModal] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false); // Set to true to make it visible by default

  const [isLoadingMessages, setIsLoadingMessages] = useState(false);






  // =================================================================================

  const path = Array.isArray(params.slug) ? params.slug : [];
  const userIdFromRoute = path[0];
  const chatIdFromRoute = path[1];



  // Syncing User
  useSyncUserSession({
    userIdFromRoute,
  });

  // Syncing ChatId
  useSyncActiveChatId({
    chatIdFromRoute,
  });


  // Fetch Chat Heads for current userId and store it.
  useFetchChatHeads();

  // Load Chat Content for selected userId/chatId 
  useChatContentLoader({
    setIsLoadingMessages,
  });

  // useEffect(() => {
  //   const prevChatIdRef = { current: null as string | null };

  //   if (userId && activeChatId && isUserSynced) {
  //     useChatWebSocketStore.getState().connect(userId, activeChatId);
  //   }

  //   return () => {
  //     const prevChatId = prevChatIdRef.current;
  //     if (prevChatId && prevChatId !== activeChatId) {
  //       console.log("🧹 disconnecting old chat", prevChatId);
  //       useChatWebSocketStore.getState().disconnect(prevChatId);
  //     }
  //     prevChatIdRef.current = activeChatId;
  //   };
  // }, [userId, activeChatId, isUserSynced]);

  // console.log(useChatWebSocketStore.getState().queue)

  useEffect(() => {
    if (userId && activeChatId && isUserSynced) {
      // Connect without closing old ones
      useChatWebSocketStore.getState().connect(userId, activeChatId);
    }

    return () => {
      // Optionally disconnect a chat when unmounting
      // useChatWebSocketStore.getState().disconnect(activeChatId);
    };
  }, [userId, activeChatId, isUserSynced]);




  // ✅ Do this check AFTER all hooks
  if (!userIdFromRoute) {
    notFound(); // still works here in Next.js
    // return null;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <Header />

      <div className="flex flex-grow overflow-hidden p-4">
        <Sidebar
          onNewChat={() => { setShowNewChatModal(true); }}
        />

        <div
          className={clsx(
            "flex flex-col flex-grow bg-gray-900 rounded-xl shadow-2xl",
            "border border-gray-700 relative overflow-hidden"
          )}
        >
          {/* overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950 to-gray-800 opacity-70 rounded-xl pointer-events-none" />
          <div
            className={clsx(
              "absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-xl transition-all duration-300",
              isLoadingMessages && activeChatId &&
              "opacity-100 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.08),transparent_40%)] bg-black/30 backdrop-blur-sm animate-pulse"
            )}
          />

          {activeChatId && !isLoadingMessages ? (
            <>
              <div className="flex flex-row items-center justify-between p-4">
                <div className="flex flex-row gap-4">
                  {/* Wrap ChatMemoriesDropdown in a relative div */}
                  <div className="relative">
                    <ChatMemoriesDropdown />
                  </div>
                  {/* Wrap ChatFilesDropdown in a relative div */}
                  <div className="relative">
                    <ChatFilesDropdown />
                  </div>
                </div>
                <ConnectionStatus />
              </div>
              <div className="flex flex-col w-full max-w-5xl mx-auto flex-grow min-h-0 z-10">
                <ChatWindow />
                <ChatInput
                  setAddMemoryModal={setAddMemoryModal}
                  setShowUploadForm={setShowUploadForm}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-grow text-center z-10">
              <div className="text-5xl mb-4">👋</div>
              <h2 className="text-2xl font-bold text-white">
                Welcome to Your AI Chat
              </h2>
              <p className="text-gray-400 mt-2 max-w-md">
                Select a conversation from the sidebar to continue, or create a
                new one to get started. 😉
              </p>
            </div>
          )}

        </div>

        <CreateNewChatModal
          isOpen={showNewChatModal}
          onClose={() => setShowNewChatModal(false)}
        />
        <MemoryAddForm
          isOpen={showAddMemoryModal}
          onClose={() => setAddMemoryModal(false)}
        />
        <FileUploadForm
          isOpen={showUploadForm}
          onClose={() => setShowUploadForm(false)}
        />
      </div>
    </div>
  );
}
