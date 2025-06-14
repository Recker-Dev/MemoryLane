'use client'; // This directive ensures the component is rendered on the client-side

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';


// Correctly import the component and its type
import MessageBubble, { type MessageBubbleProps } from '@/components/messageBubble';
import ChatWindow from '@/components/chatWindow';
import ChatInput from '@/components/chatInput';


// This component provides the basic UI framework for a chat screen,
// now with a full-width background, a wider and centered inner content area,
// improved message spacing, and a visually "pushed right" scrollbar.
export default function ChatPage() {

  const [messages, setMessages] = useState<MessageBubbleProps[]>([
    { id: '1', sender: 'ai', text: "Hello! I'm your AI assistant. How can I help you today?" },
    { id: '2', sender: 'user', text: "Hi there! I'm trying to understand how to optimize performance in React applications. Could you give me some pointers?" },
    { id: '3', sender: 'ai', text: "That's a great topic! React performance optimization often involves several strategies. Common techniques include using `React.memo`, `useCallback`, `useMemo`, virtualizing lists, and lazy loading with `React.lazy`." },
    { id: '4', sender: 'user', text: "Interesting. Can you elaborate on `React.memo`? When is it most effective to use it and what are its limitations?" },
    { id: '5', sender: 'ai', text: "`React.memo` prevents a component from re-rendering if props haven't changed. It’s best for pure functional components with stable props. But shallow comparison can fail on complex props unless you use a custom comparison." },
    { id: '6', sender: 'user', text: "Got it. So for complex objects as props, `useMemo` might be more suitable or a custom `memo` comparison." },
    { id: '7', sender: 'ai', text: "Precisely! `useMemo` helps preserve referential equality of expensive values across renders." },
    { id: '8', sender: 'user', text: "What about optimizing image loading in React applications? Any tips there?" },
    { id: '9', sender: 'ai', text: "Use lazy loading (`loading='lazy'`), optimize formats like WebP, compress sizes, and serve via CDN. Also look at `next/image` if using Next.js." },
    { id: '10', sender: 'user', text: "This is super helpful! Thanks for all the advice on performance optimization. I feel much more confident now." },
    { id: '11', sender: 'ai', text: "You're most welcome! I'm here if you need anything else." },
    // Filler messages to make scrollbar show up
    ...Array(5).fill(0).flatMap((_, i) => ([
      { id: `filler-user-${i + 1}`, sender: 'user' as const, text: `Just adding more messages to test scrolling ${i + 1}.` },
      { id: `filler-ai-${i + 1}`, sender: 'ai' as const, text: `Understood! The more content, the shorter the scrollbar thumb appears.` },
    ])),
  ]);

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
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
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

      setMessages(prevMessages => [...prevMessages, fakeAiResponse]);
      setIsProcessingInput(false);
    }, 2000);

  }

  return (
    // Main page container: uses full width, black background, and centers its primary content (the chat box frame)
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4 font-geist-sans">
      {/* Main chat container (the 'frame' for the chat): Now takes full width of its parent */}
      <div className="flex flex-col w-full h-[calc(100vh-2rem)] bg-gray-900 rounded-xl shadow-2xl p-4
                    border border-gray-700 relative overflow-hidden">
        {/* Subtle background overlay for depth within the main chat container */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 to-gray-800 opacity-70 rounded-xl pointer-events-none"></div>

        {/* NEW SUB-CONTAINER: This holds the actual chat messages and input, and is centered */}
        {/* max-w-5xl for even more room, mx-auto for centering */}
        <div className="flex flex-col w-full max-w-5xl mx-auto h-full z-10">
          <ChatWindow messages={messages} isProcessingInput={isProcessingInput} />
          <ChatInput
            inputText={inputText}
            handleInputChange={handleInputChange}
            handleSubmission={handleSubmission}
            isProcessingInput={isProcessingInput}
          />
        </div>

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
    </div>
  );
}

