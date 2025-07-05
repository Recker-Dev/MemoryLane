import React, { useState, useEffect, useCallback } from 'react';
import { useChatCRUD } from '@/features/chat/custom-hooks/useChatCRUD';
import toast from 'react-hot-toast';

import { useUserStateStore } from '@/lib/stores/useUserStateStore';
import { useChatStore } from '@/lib/stores/useChatStore';

// --- CreateNewChatModal Component ---
interface CreateNewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateNewChatModal: React.FC<CreateNewChatModalProps> = ({ isOpen, onClose }) => {

  // Global States
  const userId = useUserStateStore((state) => state.userId);
  const isUserSynced = useUserStateStore((state) => state.isUserSynced);
  const addChatHead = useChatStore((state) => state.addChatHead);

  // Custom Hook: Handles Logic of creation of chat-heads.
  const { createChatHead } = useChatCRUD();

  // Component State
  const [chatName, setChatName] = useState('');


  const handleCreateChatHead = useCallback(async (newChatName: string) => {

    const result = await createChatHead(isUserSynced, userId, newChatName);

    if (result?.success) {
      addChatHead(result.chatHead);
      toast.success("Chat created!");
    } else {
      toast.error(result?.error || "Could not create chat.");
    }

  }, [userId, addChatHead]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        setChatName('');
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (chatName) {
          handleCreateChatHead(chatName.trim());
          onClose();
          setChatName('');
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [isOpen, onClose, handleCreateChatHead, chatName, setChatName]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatName.trim()) {
      handleCreateChatHead(chatName.trim());
      onClose();
      setChatName('');
    }
  };

  if (!isOpen) return null; // Don't render if not open


  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Create New Chat</h3>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Enter chat name"
            value={chatName}
            autoFocus
            onChange={(e) => setChatName(e.target.value)}
            className="px-4 py-2 bg-gray-800 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            required
            maxLength={50}
          />
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => { setChatName(''); onClose(); }}
              className="px-5 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-700 to-purple-600 text-white hover:from-violet-600 hover:to-purple-500 transition-colors shadow-md"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
