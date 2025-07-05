import React, { useRef, useState } from "react";
import clsx from "clsx";
import { AddButton } from "@/components/ui/AddButton";
import { SubmitButton } from "@/components/ui/SubmitButton";


import { useHandleInputSubmission } from "@/features/chat/custom-hooks/useHandleInputSubmission";
import toast from "react-hot-toast";


export interface ChatInputProps {
  isProcessingInput: boolean;
  setIsProcessingInput: React.Dispatch<React.SetStateAction<boolean>>;
  setAddMemoryModal: React.Dispatch<React.SetStateAction<boolean>>
}

const ChatInput: React.FC<ChatInputProps> = ({
  isProcessingInput,
  setIsProcessingInput,
  setAddMemoryModal
}) => {

  ////////// COMPONENT States //////////
  const [inputText, setInputText] = useState('');
  const mainInputRef = useRef<HTMLInputElement>(null);


  /////////// CUSTOM HOOK /////////////
  // Handles business logic of user-chat-submission, ai-response and db updation.
  const {handleSubmission} = useHandleInputSubmission();

  const onInputSubmit = async () => {

    setIsProcessingInput(true);

    const result = await handleSubmission({ inputText });

    if (!result.success) {
      toast.error(result.message);
    } else {
      setInputText("");
    }

    setIsProcessingInput(false);
  };


  return (
    <div className="mx-4 mb-4">
      {/* Main container for the input field and buttons */}
      <div className="rounded-2xl bg-gray-800/70 backdrop-blur-lg border border-gray-700 focus-within:border-purple-500 transition-colors mt-2">
        <input
          ref={mainInputRef}
          type="text"
          value={inputText}
          onChange={(event) => { setInputText(event.target.value); }}
          onKeyDown={(event)=>{if(event.key === 'Enter') {onInputSubmit();}}}
          placeholder="Chat with AI..."
          className={clsx(
            "w-full px-5 pt-4 pb-2 text-white text-lg",
            "bg-transparent focus:outline-none placeholder-gray-400"
          )}
        />

        {/* BOTTOM ROW → + and send buttons */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <AddButton showAddMemoryModal={() => { setAddMemoryModal(true); }} />
          <SubmitButton
            isProcessingInput={isProcessingInput}
            onInputSubmit={onInputSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInput;