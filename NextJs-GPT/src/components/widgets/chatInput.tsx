"use client";

import React, { useRef } from "react";
import clsx from "clsx";
import AddButton from "@/components/widgets/addButton";
import {SubmitButton} from "@/components/ui/submitButton";


export interface ChatInputProps {
  inputText: string;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmission: (
    event:
      | React.FormEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) => void;
  isProcessingInput: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  handleInputChange,
  handleSubmission,
  isProcessingInput,
}) => {
  const mainInputRef = useRef<HTMLInputElement>(null);

  const handleMainInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && !isProcessingInput) {
      handleSubmission(event);
    }
  };

  return (
    <div className="mx-4 mb-4">
      {/* Main container for the input field and buttons */}
      <div className="rounded-2xl bg-gray-800/70 backdrop-blur-lg border border-gray-700 focus-within:border-purple-500 transition-colors">
        <input
          ref={mainInputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleMainInputKeyDown}
          placeholder="Chat with AI..."
          className={clsx(
            "w-full px-5 pt-4 pb-2 text-white text-lg",
            "bg-transparent focus:outline-none placeholder-gray-400"
          )}
        />

        {/* BOTTOM ROW → + and send buttons */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <AddButton />
          <SubmitButton
            isProcessingInput={isProcessingInput}
            handleSubmission={handleSubmission}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInput;