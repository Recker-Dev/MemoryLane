'use client'; // This directive ensures the component is rendered on the client-side

import Header from '@/components/header'; // Import the Header

import React, { useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';
import { useParams, notFound, useRouter } from 'next/navigation';

// Correctly import the component and its type
import { type MessageBubbleProps } from '@/components/messageBubble';
import ChatWindow from '@/components/chatWindow';
import ChatMemoriesDropdown, { Memory } from '@/components/chatMemoriesDropdown'; // Import the new component
import ChatInput from '@/components/widgets/chatInput';
import Sidebar, { type ChatHead } from '@/components/sidebar';
import { NewChatModal } from '@/components/newChat';

import { useChatStore } from '@/lib/stores/chatStore';


import { addMemory, getMemories, deleteMemory, fetchRelevantMemories } from '@/lib/chatServices';

import toast from 'react-hot-toast';

import { handleSubmission } from '@/features/chat/hardcore-business-logic/handleInputSubmission';
import { useSyncUserSession } from '@/features/chat/custom-hooks/useSyncUserSession';
import { useSyncActiveChatId } from '@/features/chat/custom-hooks/useSyncActiveChatId';
import { useFetchChatHeads } from '@/features/chat/custom-hooks/useFetchChatHeads';
import { useChatContentLoader } from '@/features/chat/custom-hooks/useChatContentLoader';
import { useChatCRUD } from '@/features/chat/custom-hooks/useChatCRUD';

import { useDeleteChatMemory } from '@/features/memory/custom-hooks/useDeleteChatMemory';

// This component provides the basic UI framework for a chat screen,
// now with a full-width background, a wider and centered inner content area,
// improved message spacing, and a visually "pushed right" scrollbar.
export default function ChatPage() {

  // =================================================================================
  // Hooks must be called at the top level, before any early returns.
  // =================================================================================
  const params = useParams();
  const router = useRouter();


  // Zustand Store Values
  const userId = useChatStore((state) => state.userId);
  const setUserId = useChatStore((state) => state.setUserId);
  const chatHeads = useChatStore((state) => state.chatHeads);
  const setChatHeads = useChatStore((state) => state.setChatHeads);
  const addChatHead = useChatStore((state) => state.addChatHead);
  const removeChatHead = useChatStore((state) => state.removeChatHead);
  const allChats = useChatStore((state) => state.allChats);
  const appendChatMessages = useChatStore((state) => state.appendChatMessages);
  const setAllChatMessages = useChatStore((state) => state.setAllChatMessages);
  const reset = useChatStore((state) => state.reset);
  

  const [isUserSynced, setIsUserSynced] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isProcessingInput, setIsProcessingInput] = useState(false);

  

  
  // =================================================================================

  const path = Array.isArray(params.slug) ? params.slug : [];
  const userIdFromRoute = path[0];
  const chatIdFromRoute = path[1];


  const [memories, setMemories] = useState<Memory[]>([]);


  // Syncing User
  useSyncUserSession({
    userIdFromRoute,
    userId,
    setUserId,
    setIsUserSynced,
    reset
  });

  // Syncing ChatId
  useSyncActiveChatId({
    chatIdFromRoute,
    setActiveChatId
  });


  // Fetch Chat Heads for current userId and store it.
  useFetchChatHeads({
    userId,
    isUserSynced,
    chatHeads,
    setChatHeads,
  });

  // Load Chat Content for selected userId/chatId 
  useChatContentLoader(
    {
      isUserSynced,
      userId,
      activeChatId,
      setMemories,
      setIsLoadingMessages,
      setAllChatMessages,
    });


  // Diverting business logic of user-chat-submission, ai-response and db updation.
  const onInputSubmit = async (
    event: React.FormEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (!userId || !activeChatId) return;
    event.preventDefault()
    await handleSubmission({
      inputText,
      userId,
      activeChatId,
      setInputText,
      setIsProcessingInput,
      setMemories,
      appendChatMessages,
    });
  };


  // Route to selected chatId 
  const handleSelectChat = useCallback((chatId: string) => {
    if (!userId) return;
    if (activeChatId === chatId) return;

    setActiveChatId(chatId);
    router.push(`/chat/${userId}/${chatId}`);
  }, [userId, activeChatId, setActiveChatId, router]);


  // Handles Logic of creation and deletion of chat-heads and subsequent chat-history.
  const { createChatHead, deleteChatHead } = useChatCRUD({
    isUserSynced,
    userId,
    activeChatId,
    setActiveChatId,
    addChatHead,
    removeChatHead,
    setInputText,
    setShowNewChatModal,
  });



  const handleDeleteMemoryClick = useDeleteChatMemory({
    userId,
    activeChatId,
    setMemories,
  })

  const currentMessages = [
    ...(allChats[activeChatId || ''] || []),
  ];



  // // ✅ Do this check AFTER all hooks
  // if (!userIdFromRoute) {
  //   notFound(); // still works here in Next.js
  //   // return null;
  // }

  return (
    <div className="flex flex-col h-full w-full">
      <Header />

      <div className="flex flex-grow overflow-hidden p-4">
        <Sidebar
          chatHeads={chatHeads}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={() => { setShowNewChatModal(true); }}
          onDelete={deleteChatHead}
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
              <ChatMemoriesDropdown
                memories={memories}
                handleDeleteMemoryClick={handleDeleteMemoryClick}
              />
              <div className="flex flex-col w-full max-w-5xl mx-auto flex-grow min-h-0 z-10">
                <ChatWindow
                  messages={currentMessages}
                  isProcessingInput={isProcessingInput}
                />
                <ChatInput
                  inputText={inputText}
                  handleInputChange={(event) => { setInputText(event.target.value); }}
                  handleSubmission={onInputSubmit}
                  isProcessingInput={isProcessingInput}
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

        <NewChatModal
          isOpen={showNewChatModal}
          onClose={() => setShowNewChatModal(false)}
          onSubmit={createChatHead}
        />
      </div>
    </div>
  );
}
