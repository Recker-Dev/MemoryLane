import React, { useRef, useState } from "react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { AddButton } from "@/components/ui/AddButton";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { useHandleInputSubmission } from "@/features/chat/custom-hooks/useHandleInputSubmission";

import { useMemoryStore } from '@/lib/stores/useMemoryStore';
import { useFileStore } from "@/lib/stores/useFileStore";
import { useChatWebSocketStore } from "@/lib/stores/useChatWebSocketStore";
import { useUserStateStore } from "@/lib/stores/useUserStateStore";
import { useUIStore } from "@/lib/stores/useUIStore";

export interface ChatInputProps {
  setAddMemoryModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowUploadForm: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatInput: React.FC<ChatInputProps> = ({
  setAddMemoryModal,
  setShowUploadForm
}) => {

  ////////// GLOBAL states //////////
  const selectedMemoriesLength = useMemoryStore((state) => state.selectedMemories.length);
  const chatMemories = useMemoryStore((state) => state.chatMemories);
  const selectedFilesLength = useFileStore((state) => state.selectedFiles.length);
  const chatFiles = useFileStore((state) => state.chatFiles);

  const activeChatId = useUserStateStore((s) => s.activeChatId);
  const setIsProcessingInput = useUIStore((s) => s.setIsProcessingInput);



  ////////// COMPONENT States //////////
  const [inputText, setInputText] = useState('');
  const mainInputRef = useRef<HTMLTextAreaElement>(null);

  /////////// CUSTOM HOOK /////////////
  // Handles business logic of user-chat-submission, ai-response and db updation.
  const { handleSubmission } = useHandleInputSubmission();

  // ✅ minimal re-render: only listens for this chat’s ws status
  const isWebSocketConnected = useChatWebSocketStore(
    (s) => Boolean(activeChatId && s.wsMap.get(activeChatId)?.readyState === WebSocket.OPEN)
  );


  const onInputSubmit = async () => {


    const result = await handleSubmission({ inputText });

    if (!result.success) {
      toast.error(result.message);
    } else {
      setIsProcessingInput(true);
      setInputText("");
    }

    // ⬇️ Reset height after submit
    if (mainInputRef.current) {
      mainInputRef.current.style.height = "auto";
    }

  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
    if (mainInputRef.current) {
      mainInputRef.current.style.height = 'auto';
      mainInputRef.current.style.height = mainInputRef.current.scrollHeight + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // ⛔ stop newline
      if (inputText.trim()) {
        onInputSubmit();
        setInputText("");
      }
    }
    // if Shift+Enter → let it pass (normal newline)
  };


  return (
    <div className="mx-4 mb-4">
      {/* Main container for the input field and buttons */}
      <div className="rounded-2xl bg-gray-800/70 backdrop-blur-lg border border-gray-700 focus-within:border-purple-500 transition-colors mt-2">
        <textarea
          name="user_query_inp_field"
          style={{ minHeight: "3rem", maxHeight: "12rem", resize: "none" }}
          ref={mainInputRef}
          value={inputText}
          disabled={!isWebSocketConnected}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={(() => {
            if (!isWebSocketConnected) {
              return "Refresh page or re-connect with server to proceed...";
            }
            const memoryCount =
              selectedMemoriesLength + chatMemories.filter((m) => m.persist).length;
            const fileCount =
            /* eslint-disable @typescript-eslint/no-unused-vars */
              selectedFilesLength + [...chatFiles.entries()].filter(([_, f]) => f.persist).length;

            if (memoryCount > 0 || fileCount > 0) {
              const memoryLabel =
                memoryCount > 0
                  ? `${memoryCount} memor${memoryCount > 1 ? "ies" : "y"}`
                  : "";
              const fileLabel =
                fileCount > 0
                  ? `${fileCount} file${fileCount > 1 ? "s" : ""}`
                  : "";

              // Join with " + " if both exist
              const combinedLabel = [memoryLabel, fileLabel].filter(Boolean).join(" + ");

              return `${combinedLabel} selected for context...`;
            }

            return "Chat with AI...";
          })()}
          className={clsx(
            "w-full px-5 pt-4  text-white text-lg",
            "bg-transparent focus:outline-none placeholder-gray-400 scrollbar-hidden"
          )}
        />

        {/* BOTTOM ROW → + and send buttons */}
        <div className="flex items-center justify-between px-4 pb-3">
          <AddButton
            showAddMemoryModal={() => setAddMemoryModal(true)}
            showAddFilesModal={() => setShowUploadForm(true)} />
          <SubmitButton
            isWebSocketConnected={isWebSocketConnected}
            onInputSubmit={onInputSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInput;