import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

import { useDeleteChatMemory } from '@/features/memory/custom-hooks/useDeleteChatMemory';

import { useMemoryStore } from '@/lib/stores/useMemoryStore';


// Define the type for a single memory
export type Memory = {
  mem_id: string;
  context: string;
  tags: string[];
}


type ChatMemoriesDropdownProps = {}

const ChatMemoriesDropdown: React.FC<ChatMemoriesDropdownProps> = () => {


  ////////// GLOBAL states //////////
  const memories = useMemoryStore((state) => state.chatMemories);
  const selectedMemories = useMemoryStore((state) => state.selectedMemories);
  const appendToSelectedMemories = useMemoryStore((state) => state.appendToSelectedMemories);
  const removeFromSelectedMemories = useMemoryStore((state) => state.removeFromSelectedMemories);

  ////////// CUSTOM HOOK ///////////
  const handleDeleteMemoryClick = useDeleteChatMemory()

  ////////// COMPONENT states //////////
  const [showMemoriesDropdown, setShowMemoriesDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showMemoriesDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target as Node)
      ) {
        setShowMemoriesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMemoriesDropdown]);

  const toggleMemoriesDropdown = () => {
    setShowMemoriesDropdown(prev => !prev);
  };

  const handleMemorySelection = (memory: Memory) => {
    if (selectedMemories.some((mem) => mem.mem_id === memory.mem_id)) {
      removeFromSelectedMemories(memory);
    }
    else {
      appendToSelectedMemories(memory);
    }
  };


  // console.log(selectedMemories);


  return (
    <>
      {/* Memories Toggle Button (same as yours) */}
        <button
          ref={toggleButtonRef}
          onClick={toggleMemoriesDropdown}
          className={clsx(
            "absolute top-4 left-4 z-30 p-2 rounded-full hover:cursor-pointer",
            "bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
          )}
          aria-label="Toggle chat memories"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 19V7.5a2.5 2.5 0 012.5-2.5h9A2.5 2.5 0 0119 7.5V19m-9 0v-4a2 2 0 00-2-2H8a2 2 0 00-2 2v4m3-11H8m6 0h-3"
            />
          </svg>
          {/* A mini-badge showing count of memories selected currently */}
          {selectedMemories.length > 0 && ( 
            <span
              className={clsx(
                "absolute -top-1 -right-1",
                "bg-purple-600 text-white text-xs font-semibold",
                "px-1.5 py-0.5 rounded-full",
                "border border-gray-900"
              )}
            >
              {selectedMemories.length}
            </span>
          )}
        </button>

      {/* Memories Dropdown */}
      {
        showMemoriesDropdown && (
          <div
            ref={dropdownRef}
            className={clsx(
              "absolute top-16 left-4 z-40 w-80 max-h-96 overflow-y-auto",
              "bg-gray-900 border border-gray-700 rounded-lg shadow-xl",
              "p-4 space-y-3 scrollbar-custom"
            )}
          >
            <h3 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">
              Chat Memories
            </h3>

            {memories.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No memories found for this chat yet.
              </p>
            ) : (
              memories.map((memory) => {
                const isSelected = selectedMemories.some((mem) => mem.mem_id === memory.mem_id)
                return (
                  <div
                    key={memory.mem_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMemorySelection(memory);
                    }}
                    className={clsx(
                      "relative p-3 rounded-lg border transition-all duration-150 cursor-pointer",
                      "hover:shadow-lg",
                      isSelected
                        ? "bg-purple-900 border-purple-500 shadow-purple-500/50"
                        : "bg-gray-800 border-gray-700 hover:border-purple-500"
                    )}
                    aria-label={`Memory ${memory.mem_id}: ${memory.context}`}
                  >
                    {/* Checkmark icon for selected memories */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-purple-500 rounded-full p-0.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}


                    <p className="text-gray-400 text-xs">
                      ID: {memory.mem_id}
                    </p>


                    <p className="text-white text-sm font-medium mb-1">
                      Context:{" "}
                      <span className="text-gray-300">
                        {memory.context}
                      </span>
                    </p>
                    <div className="flex justify-between items-start mb-1">
                      {memory.tags && memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-gray-400 text-xs">Tags:</span>
                          {memory.tags.map((tag, tagIndex) => (
                            <span
                              key={`${memory.mem_id}-${tag}-${tagIndex}`}
                              className="bg-purple-800 text-purple-200 px-2 py-0.5 rounded-full text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromSelectedMemories(memory); // If was selected good and fine, if not, fine either way.
                          handleDeleteMemoryClick(memory.mem_id);
                        }}
                        className="text-red-400 hover:text-red-300 text-lg cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-full"
                        aria-label={`Delete memory ${memory.mem_id}`}
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )
      }
    </>
  );
};

export default ChatMemoriesDropdown;