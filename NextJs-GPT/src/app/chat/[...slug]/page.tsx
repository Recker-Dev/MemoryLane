'use client'; // This directive ensures the component is rendered on the client-side

import React, { useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';
import { useParams, notFound, useRouter } from 'next/navigation';

// Correctly import the component and its type
import { type MessageBubbleProps } from '@/components/messageBubble';
import ChatWindow from '@/components/chatWindow';
import ChatInput from '@/components/chatInput';
import Sidebar, { type ChatHead } from '@/components/sidebar';
import { NewChatModal } from '@/components/newChat';

import { useChatStore } from '@/lib/stores/chatStore';
import { fetchChatHeads, fetchMessages, getAiResponse, updatePendingMessages, createNewChatHead, pushToPendingMessages, deleteChatHead } from '@/lib/chatServices';

import toast from 'react-hot-toast';



// This component provides the basic UI framework for a chat screen,
// now with a full-width background, a wider and centered inner content area,
// improved message spacing, and a visually "pushed right" scrollbar.
export default function ChatPage() {

  // =================================================================================
  // Hooks must be called at the top level, before any early returns.
  // =================================================================================
  const params = useParams();
  const router = useRouter();

  const userId = useChatStore((state) => state.userId);
  const setUserId = useChatStore((state) => state.setUserId);

  const chatHeads = useChatStore((state) => state.chatHeads);
  const setChatHeads = useChatStore((state) => state.setChatHeads);
  const addChatHead = useChatStore((state) => state.addChatHead);
  const removeChatHead = useChatStore((state) => state.removeChatHead);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const allChats = useChatStore((state) => state.allChats);

  // const pendingMessages = useChatStore((state) => state.pendingMessages);
  const [inputText, setInputText] = useState('');
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  // =================================================================================

  const path = Array.isArray(params.slug) ? params.slug : [];
  const userIdFromRoute = path[0];
  const chatId = path[1];

  useEffect(() => {
    if (userIdFromRoute && userId !== userIdFromRoute)
      setUserId(userIdFromRoute);
  }, [userIdFromRoute, userId, setUserId]);


  // Do a 1 time initial api call, to grab the chatHeads.
  useEffect(() => {
    if (!userId || useChatStore.getState().chatHeads.length > 0) return;
    fetchChatHeads(userId).then(response => {

      if (response.success) {
        if (Array.isArray(response.message))
          setChatHeads(response.message);
      }
      else {
        toast.error("Error Fetching chats-heads!");
      }
    });
  }, [userId, setChatHeads]);



  // Set activeChatId if there is a chatId or else let it be null
  useEffect(() => {
    // Set activeChatId if there is a chatId or else let it be null
    if (chatId) {
      setActiveChatId(chatId);
    } else {
      setActiveChatId(null);
    }
  }, [chatId]); // Only re-run this effect if chatId changes


  // Fetch messages when activeChatId changes, but ONLY if activeChatId is valid

  useEffect(() => {

    if (!activeChatId || !userId) return;

    setIsLoadingMessages(true);  // Begin loading animation

    fetchMessages(userId, activeChatId).then(response => {
      if (response.success) {
        if (Array.isArray(response.message)) {
          useChatStore.getState().setAllChatMessages(activeChatId, response.message); // Use setAllChatMessages to replace history
        }
      }
      else {
        toast.error("Error Fetching chat-history for the current chat!!");
      }
    }).finally(() => {
      setTimeout(() => {
        setIsLoadingMessages(false);
      }, 500);
    });

  }, [activeChatId, userId]); // 🔁 Always fetch on route change


  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInputText(event.currentTarget.value);
  }


  const handleSubmission = async (event: React.FormEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const trimmedOutput = inputText.trim();

    if (!trimmedOutput || !activeChatId || !userId) return;

    const newUserMessage: MessageBubbleProps = {
      id: uuidv4(), sender: 'user', text: trimmedOutput
    };

    // Add user message to redundacy DB
    const userMssgPendingResponse = await pushToPendingMessages(userId, activeChatId, newUserMessage)
    if (!userMssgPendingResponse.success) {
      toast.error("Failed to save user message to server.");
      return;
    }

    // Handle chat updation of UI
    useChatStore.getState().appendChatMessages(activeChatId, [newUserMessage]); // Use appendChatMessages for new user message


    // useChatStore.getState().appendPendingMessage(activeChatId, newUserMessage);
    setInputText('');
    setIsProcessingInput(true);

    const aiMssgResponse = await getAiResponse(userId, activeChatId, trimmedOutput)

    if (aiMssgResponse.success) {
      const aiMessage = aiMssgResponse.message;
      const aiMessageId = uuidv4();
      aiMessage.id = aiMessageId;

      // Handle chat updation of UI
      useChatStore.getState().appendChatMessages(activeChatId, [aiMessage]); // Use appendChatMessages for new AI message

      setTimeout(async () => { // Simulate a network delay.
        // useChatStore.getState().appendPendingMessage(activeChatId, { ...aiMessage, id: aiMessageId });

        // Add ai message to redundacy DB
        const aiMssgPendingResponse = await pushToPendingMessages(userId, activeChatId, aiMessage)
        if (!aiMssgPendingResponse.success) {
          toast.error("Failed to save AI message to server.");
        }

        setIsProcessingInput(false);
      }, 200);

    } else {
      toast.error(`Failed to get AI response: ${aiMssgResponse.message}`);
      setIsProcessingInput(false); // Stop processing on API error
    }


  };


  const handleSelectChat = useCallback(async (chatId: string) => {

    if (!userId) return;

    // Return if clicked chat is having same id as activeChatId
    if (activeChatId === chatId) return;

    // // Take care of pending Messages before switching to a another chat.
    // if (activeChatId) {
    //   const pendingMessages = useChatStore.getState().pendingMessages[activeChatId] || [];

    //   updatePendingMessages(userId, activeChatId, pendingMessages).then(data => {
    //     if (data.success) {
    //       useChatStore.getState().clearPendingMessages(activeChatId);
    //     } else {
    //       toast.error("Failed to sync pending messages.");
    //     }
    //   });
    // }

    setActiveChatId(chatId);
    // Simulate router navigation for local environment
    router.push(`/chat/${userId}/${chatId}`);
  }, [userId, router, activeChatId]);



  const handleNewChat = useCallback(() =>
    setShowNewChatModal(true), [setShowNewChatModal]);



  useEffect(() => {
    console.log("chatHeads updated:", chatHeads);
  }, [chatHeads]);

  const handleCreateNewChat = useCallback(async (newchatName: string) => {
    if (!userId) return;

    // // 1. Sync pending messages from the current chat, given we have activeChatId valid.
    // if (activeChatId) {
    //   const pendingMessages = useChatStore.getState().pendingMessages[activeChatId] || [];
    //   const data = await updatePendingMessages(userId, activeChatId, pendingMessages);

    //   if (data.success) {
    //     useChatStore.getState().clearPendingMessages(activeChatId);
    //   } else {
    //     toast.error("Failed to sync messages from the previous chat.");
    //   }
    // }

    const newChatId = uuidv4();
    const newChatHead: ChatHead = {
      chatId: newChatId,
      name: newchatName,
      preview: 'No messages yet.',
    };

    // 2. Optimistic UI update
    addChatHead(newChatHead);
    setInputText('');
    setShowNewChatModal(false); // ✅ Close the modal now to feel instant

    // 3. Wait for DB sync before navigating
    const response = await createNewChatHead(userId, newChatHead);

    if (!response.success) {
      removeChatHead(newChatHead.chatId);
      toast.error(response.message || "Failed to sync chat head with server.");
      return;
    }

    // 4. Route after chat creation is confirmed
    setActiveChatId(newChatId);
    router.push(`/chat/${userId}/${newChatId}`);
    console.log("✅ New Chat created:", newChatId, newchatName);

  }, [userId, router, activeChatId, addChatHead, removeChatHead]);


  const handleChatHeadDelete = useCallback(async (chatId: string) => {

    if (!userId) return;

    const response = await deleteChatHead(userId, chatId);

    if (!response.success) {
      toast.error(response.message || "Failed to delete chat-head");
      return;
    }

    if (response.success) {
      removeChatHead(chatId);
      toast.success(response.message);
      router.push(`/chat/${userId}`); // Push Back to base homepage
    }

  }, [userId, chatId, router]);



  const currentMessages = [
    ...(allChats[activeChatId || ''] || []),
    // ...(pendingMessages[activeChatId || ''] || []),
  ];


  // useEffect(() => {
  //   console.log("Updated Pending Messages, to be synced : ", useChatStore.getState().pendingMessages);
  // }, [pendingMessages]);


  // ✅ Do this check AFTER all hooks
  if (!userIdFromRoute) {
    notFound(); // still works here in Next.js
    // return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex p-4 font-geist-sans">
      {/* Sidebar Component */}
      <Sidebar
        chatHeads={chatHeads}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDelete={handleChatHeadDelete}
      />

      {/* Main chat container */}
      <div
        className={clsx(
          "flex flex-col flex-grow h-[calc(100vh-2rem)] bg-gray-900 rounded-xl shadow-2xl p-4",
          "border border-gray-700 relative overflow-hidden"
        )}
      >
        {/* 🔲 Optional gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 to-gray-800 opacity-70 rounded-xl pointer-events-none" />

        {/* 🔳 Overlay blanket shown only during loading */}
        <div
          className={clsx(
            "absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-xl transition-all duration-300",
            isLoadingMessages &&
            "bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.08),transparent_40%)] bg-black/30 backdrop-blur-sm animate-pulse"
          )}
        />

        {/* Main content */}
        <div className="flex flex-col w-full max-w-5xl mx-auto h-full z-10">
          <ChatWindow
            messages={isLoadingMessages ? null : currentMessages}
            isProcessingInput={isProcessingInput}
          />
          <ChatInput
            inputText={inputText}
            handleInputChange={handleInputChange}
            handleSubmission={handleSubmission}
            isProcessingInput={isProcessingInput}
          />
        </div>
      </div>
      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSubmit={handleCreateNewChat}
      />
    </div>
  );
}
