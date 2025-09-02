import React, { useCallback, useEffect } from "react";
import clsx from "clsx";

import { useChatCRUD } from "@/features/chat/custom-hooks/useChatCRUD";
import toast from "react-hot-toast";
import { useChatStore } from "@/lib/stores/useChatStore";
import { useUserStateStore } from "@/lib/stores/useUserStateStore";



type ConfirmChatDeleteModalProps = {
  isOpen: boolean;
  chatIdToDelete: string| null;
  onClose: () => void;
};

export const ConfirmChatDeleteModal: React.FC<ConfirmChatDeleteModalProps> = ({
  isOpen,
  chatIdToDelete,
  onClose
}) => {

  // Global States -> User States
  const isUserSynced = useUserStateStore((state) => state.isUserSynced);
  const userId = useUserStateStore((state) => state.userId);
  const activeChatId = useUserStateStore((state) => state.activeChatId);
  const setActiveChatId = useUserStateStore((state) => state.setActiveChatId);

  // Gloval States -> Chat States
  const chatHeads = useChatStore((state) => state.chatHeads);
  const removeChatHead = useChatStore((state) => state.removeChatHead);


  // Custom Hook: Handles Deletion of Chat-Head.
  const { deleteChatHead } = useChatCRUD();


  const handleDeleteChatHead = useCallback(async () => {

    if(!chatIdToDelete ||!isUserSynced || !userId || !isUserSynced){
      console.log("Dependencies for chatDelete missing");
      return;
    }

    const response = await deleteChatHead(isUserSynced, userId, chatIdToDelete, activeChatId);

    if (response.success) {
      removeChatHead(chatIdToDelete);
      toast.success('Chat deleted successfully.');
      if (chatIdToDelete === activeChatId) {
        setActiveChatId(null);
      }
    }
    else {
      toast.error(response?.error || 'Failed to delete chat.');
    }
    onClose();
  }, [
    deleteChatHead,
    isUserSynced,
    userId,
    chatIdToDelete,
    activeChatId,
    removeChatHead,
    setActiveChatId,
    onClose,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        setActiveChatId(null);
      }
      if (event.key === "Enter") {
        if (chatIdToDelete) {
          handleDeleteChatHead();
        }
      }
    };


    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown); // return does not run immediately but waits for unmounting of component.
    }
  }, [isOpen, chatIdToDelete, handleDeleteChatHead]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 sm:p-6">
      <div className={clsx(
        "bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center border border-gray-700",
        "transform transition-all duration-300 scale-95 opacity-0 animate-scaleIn"
      )}>
        <h2 className="text-2xl font-bold text-white mb-3">Delete Chat?</h2>
        <p className="text-gray-400 text-base mb-8 leading-relaxed">
          Are you sure you want to delete this chat? This action is irreversible.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              onClose();
              setActiveChatId(null);
            }}
            className="px-6 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteChatHead}
            className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};


