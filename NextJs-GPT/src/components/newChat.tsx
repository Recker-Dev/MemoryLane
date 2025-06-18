import React, { useState, } from 'react';
// --- NewChatModal Component ---
interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (chatName: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [chatName, setChatName] = useState('');

  if (!isOpen) return null; // Don't render if not open

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatName.trim()) {
      onSubmit(chatName.trim());
      setChatName(''); // Clear input after submission
    }
  };

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
              onClick={onClose}
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
