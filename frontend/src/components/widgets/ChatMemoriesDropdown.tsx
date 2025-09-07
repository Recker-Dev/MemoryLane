import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { NotebookPen } from "lucide-react";

import { MemoryCard } from "../ui/MemoryCard";

import { useMemoryStore } from "@/lib/stores/useMemoryStore";
import { useDeleteChatMemory } from "@/features/memory/custom-hooks/useDeleteChatMemory";
import { useToggleChatPersistance } from "@/features/memory/custom-hooks/useToggleChatPersistance";


export type Memory = {
  memid: string;
  context: string;
  persist: boolean;
  createdAt: Date;
};

const ChatMemoriesDropdown: React.FC = () => {
  // -------- GLOBAL STATES --------
  const chatMemories = useMemoryStore((state) => state.chatMemories);

  const selectedMemories = useMemoryStore((state) => state.selectedMemories);
  const addSelectedMemory = useMemoryStore((state) => state.appendToSelectedMemories);
  const removeFromSelectedMemoriesById = useMemoryStore((state) => state.removeFromSelectedMemoriesById);

  const handleDeleteMemoryClick = useDeleteChatMemory();
  const handleToggleMemoryPersistance = useToggleChatPersistance();

  // -------- COMPONENT STATE --------
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);



  // -------- EFFECT: Click Outside --------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  // -------- HELPERS --------
  const isSelected = (memory: Memory): boolean =>
    memory.persist || selectedMemories.some((m) => m.memid === memory.memid);

  const handleMemoryClick = (memory: Memory) => {
    if (memory.persist) return;
    if (selectedMemories.some((m) => m.memid === memory.memid)) {
      removeFromSelectedMemoriesById(memory.memid);
    } else {
      addSelectedMemory(memory);
    }
  };

  // const activeCount = selectedMemories.length + chatMemories.filter((m) => m.persist).length

  const activeCount = useMemoryStore((state) => {
    return state.selectedMemories.length + state.chatMemories.filter((m) => m.persist).length
  });

  // -------- RENDER --------
  return (
    <>
      {/* Toggle Button */}
      <button
        ref={toggleButtonRef}
        onClick={() => setShowDropdown((prev) => !prev)}
        className={clsx(
          "relative p-2 rounded-full hover:cursor-pointer",
          "bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
        )}
        aria-label="Toggle chat memories"
      >
        <NotebookPen />
        {activeCount > 0 && (
          <span
            className={clsx(
              "absolute -top-1 -right-1",
              "bg-purple-600 text-white text-xs font-semibold",
              "px-1.5 py-0.5 rounded-full",
              "border border-gray-900"
            )}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className={clsx(
            "absolute top-full left-0 mt-2 z-40 w-80 max-h-96 overflow-y-auto",
            "bg-gray-900 border border-gray-700 rounded-lg shadow-xl",
            "p-4 space-y-3 scrollbar-custom"
          )}
        >
          <h3 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">
            Chat Memories
          </h3>

          {chatMemories.length === 0 ? (
            <p className="text-gray-400 text-sm">No memories found for this chat yet.</p>
          ) : (
            chatMemories.map((memory) => (
              <MemoryCard
                key={memory.memid}
                memory={memory}
                selected={isSelected(memory)}
                onClick={handleMemoryClick}
                onTogglePersistence={handleToggleMemoryPersistance}
                onDelete={handleDeleteMemoryClick}
              />
            ))
          )}
        </div>
      )}
    </>
  );
};

export default ChatMemoriesDropdown;
