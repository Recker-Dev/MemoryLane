'use client'; // This directive ensures the component is rendered on the client-side

import React, { useEffect, useState, useCallback, useLayoutEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';
import { useParams, notFound, useRouter } from 'next/navigation';


// Correctly import the component and its type
import MessageBubble, { type MessageBubbleProps } from '@/components/messageBubble';
import ChatWindow from '@/components/chatWindow';
import ChatInput from '@/components/chatInput';
import Sidebar, { type ChatHead } from '@/components/sidebar';
import { NewChatModal } from '@/components/newChat';

import { useChatStore } from '@/lib/stores/chatStore';

import toast from 'react-hot-toast';



// This component provides the basic UI framework for a chat screen,
// now with a full-width background, a wider and centered inner content area,
// improved message spacing, and a visually "pushed right" scrollbar.
export default function ChatPage() {

  const params = useParams();
  const router = useRouter();

  const path = Array.isArray(params.slug) ? params.slug : [];
  const userIdFromRoute = path[0];
  const chatId = path[1];



  // 404 if no userId (i.e., visiting /chats)
  if (!path[0]) return notFound();

  const userId = useChatStore((state) => state.userId);
  const setUserId = useChatStore((state) => state.setUserId);

  useEffect(() => {
    if (userIdFromRoute && userId !== userIdFromRoute)
      // console.log("I am supposed to run only once!")
      setUserId(userIdFromRoute);

  }, [userIdFromRoute]);

  // console.log('🧠 userId:', userId);
  // console.log('💬 chatId:', chatId);

  const chatHeads = useChatStore((state) => state.chatHeads);
  const setChatHeads = useChatStore((state) => state.setChatHeads);
  const addChatHead = useChatStore((state) => state.addChatHead);
  const removeChatHead = useChatStore((state) => state.removeChatHead);


  // const [chatHeads, setChatHeads] = useState<ChatHead[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // State for the new chat modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Runs only when chatHeads component changes, possible if newChatHead made or newUserID.

  const isInitialChatHeadFetchDone = useChatStore((state) => state.isInitialChatHeadFetchDone);
  const setInitialChatHeadFetchDone = useChatStore((state) => state.setInitialChatHeadFetchDone);

  useEffect(() => {
    if (!userId || isInitialChatHeadFetchDone) return;

    const fetchChatHeads = async () => {
      console.log("✅ FETCH CALLED with userId:", userId);
      try {
        const res = await fetch(`http://localhost:3001/chatHeads/${userId}`);
        const data = await res.json();
        setChatHeads(data);
        setInitialChatHeadFetchDone(true);
      } catch (err) {
        console.error("❌ Failed to fetch chat heads:", err);
      }
    };

    fetchChatHeads();
  }, [userId, isInitialChatHeadFetchDone]);
  // empty array = run once when component mounts, but we gonna run it whenever userId changes

  // useEffect(() => {
  //   console.log(chatHeads);
  // }, [chatHeads]);

  // Set activeChatId if there is a chatId or else let it be null
  useEffect(() => {
    // Set activeChatId if there is a chatId or else let it be null
    if (chatId) {
      setActiveChatId(chatId);
    } else {
      setActiveChatId(null);
    }
  }, [chatId]); // Only re-run this effect if chatId changes


  const [allChats, setAllChats] = useState<Record<string, MessageBubbleProps[]>>({});

  // Varible to control blinking of message bubbles during chatUpdation
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Runs on when activeChatId changes and populates the messages array.

  // const [loadingOverlayVisible, setLoadingOverlayVisible] = useState(false);


  // Fetch messages when activeChatId changes, but ONLY if activeChatId is valid
  // useLayoutEffect(() => {
  //   const fetchMessages = async () => {
  //     if (!activeChatId || !userId) return;

  //     if (allChats[activeChatId]) return;

  //     try {
  //       setIsLoadingMessages(true);  // Begin loading
  //       // setMessages([]); // Clears stale messages from previous chat before new ones come
  //       const res = await fetch(`http://localhost:3001/chats/${userId}/${activeChatId}`);
  //       const data = await res.json();
  //       setAllChats(prev => ({
  //         ...prev,
  //         [activeChatId]: data,
  //       }));
  //     }
  //     catch (err) {  
  //       console.error('Failed to fetch messages:', err);
  //     }
  //     finally {
  //       // ✅ Add 0.5s buffer to loading fade-out
  //       setTimeout(() => {
  //         setIsLoadingMessages(false);
  //       }, 1000);
  //     }
  //   };
  //   fetchMessages();
  // }, [activeChatId, userId]); // Re-run when activeChatId changes

  const currentMessages = allChats[activeChatId ?? ''] || [];


  const [inputText, setInputText] = useState('');

  // Diables user input and does UI stuff when AI is processing user input
  const [isProcessingInput, setIsProcessingInput] = useState(false);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInputText(event.currentTarget.value);
  }


  function handleSubmission(event: React.FormEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) {
    const trimmed_output = inputText.trim();

    // Do nothing if no valid string is given.
    if (trimmed_output === '')
      return

    const newUserMessage: MessageBubbleProps = { id: uuidv4(), sender: 'user', text: trimmed_output };

    // Update Messages array
    // setMessages(prevMessages => [...prevMessages, newUserMessage]); FIX IT
    setInputText("");

    // log the user mssg
    console.log(trimmed_output)

    setIsProcessingInput(true); // Ai processing time intiated.


    // Simulate AI response after 2 seconds
    setTimeout(() => {
      const fakeAiResponse: MessageBubbleProps = {
        id: uuidv4(),
        sender: "ai",
        text: "This is a simulated AI response. Processing complete."
      };

      // setMessages(prevMessages => [...prevMessages, fakeAiResponse]); FIX IT
      setIsProcessingInput(false);
    }, 2000);

  }

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
    // Simulate router navigation for local environment
    router.push(`/chat/${userId}/${chatId}`);
  }, [userId, router]);



  const handleNewChat = useCallback(() => {
    console.log("New Chat clicked!");
    setShowNewChatModal(true);
    // Create logic later
  }, []);

  useEffect(() => {
    console.log("chatHeads updated:", chatHeads);
  }, [chatHeads]);

  const handleCreateNewChat = useCallback((newchatName: string) => {
    const newChatId = uuidv4();
    const newChatHead: ChatHead = { chatId: newChatId, name: newchatName, preview: 'No messages yet.' }; // Use provided name

    // 1. Optimistic UI update
    addChatHead(newChatHead);
    setActiveChatId(newChatId); // Activate the new chat
    setInputText(''); // Clear input for the new chat
    router.push(`/chat/${userId}/${newChatId}`); // Redirect to the particular new chat.
    console.log("New Chat created! ID:", newChatId, "Name:", newchatName);
    setShowNewChatModal(false); // Close the new chat modal.

    // 2. Background sync
    (async () => {
      const response = await fetch(`http://localhost:3001/createChat/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId: newChatHead.chatId, name: newChatHead.name }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("❌ Backend error:", err);
        removeChatHead(newChatHead);
        // toast.error(err?.error || "Failed to sync chat with server.");
        toast.error("Failed to sync chat head with server.");

      }
    })();


  }, [userId, router]);

  return (
    <div className="min-h-screen bg-black text-white flex p-4 font-geist-sans">
      {/* Sidebar Component */}
      <Sidebar
        chatHeads={chatHeads}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        isLoadingMessages={isLoadingMessages}
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
            isLoadingMessages={isLoadingMessages}
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
