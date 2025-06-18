// ChatInput.tsx
import React from 'react';
import clsx from 'clsx';

interface ChatInputProps {
  inputText: string;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmission: (event: React.FormEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) => void;
  isProcessingInput: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ inputText, handleInputChange, handleSubmission, isProcessingInput }) => {
  return (
    <div className="flex items-center gap-3 mt-4">
      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !isProcessingInput) {
            handleSubmission(event);
          }
        }}
        placeholder={"Chat with AI...."}
        className={`flex-grow px-5 py-3 rounded-full text-white text-lg transition-all duration-200 ease-in-out
          bg-gray-800 backdrop-filter backdrop-blur-lg border border-gray-800
          bg-opacity-70 placeholder-gray-400 hover:bg-opacity-80 focus:bg-opacity-90
          hover:border-gray-600 focus:border-gray-400 focus:shadow-inner-xl`}
      />

      <button
        className={clsx(
          "text-white p-3 rounded-full shadow-lg transform transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75",
          isProcessingInput
            ? "bg-gradient-to-r from-gray-700 to-gray-800 cursor-not-allowed"
            : "bg-gradient-to-r from-violet-900 to-purple-800 hover:from-violet-800 hover:to-purple-700 hover:scale-105",
          "active:scale-95"
        )}
        aria-label="Send message"
        onClick={handleSubmission}
        disabled={isProcessingInput}
      >
        {/* Arrow icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </button>
    </div>
  );
};

export default ChatInput;