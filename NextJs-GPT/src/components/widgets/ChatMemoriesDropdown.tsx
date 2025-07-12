import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { NotebookPen } from 'lucide-react';

import { useDeleteChatMemory } from '@/features/memory/custom-hooks/useDeleteChatMemory';

import { useMemoryStore } from '@/lib/stores/useMemoryStore';


// Define the type for a single memory
export type Memory = {
  mem_id: string;
  context: string;
  tags: string[];
}

interface MemoryUI extends Memory {
  is_persistent: boolean;
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
  const [persistentMap, setPersistentMap] = useState<Record<string, boolean>>({});




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


  const handleMemorySelection = (memory: Memory) => {
    if (selectedMemories.some((mem) => mem.mem_id === memory.mem_id)) {
      removeFromSelectedMemories(memory);
    }
    else {
      appendToSelectedMemories(memory);
    }
  };
 
  const handleTogglePersistent = (memory:Memory) => {
  setPersistentMap(prev => ({
    ...prev,
    [memory.mem_id]: !prev[memory.mem_id],
  }));
  appendToSelectedMemories(memory);
};


  // console.log(selectedMemories);


  return (
    <>
      {/* Memories Toggle Button (same as yours) */}
      <button
        ref={toggleButtonRef}
        onClick={() => { setShowMemoriesDropdown(prev => !prev); }}
        className={clsx(
          "relative p-2 rounded-full hover:cursor-pointer",
          "bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
        )}
        aria-label="Toggle chat memories"
      >
        <NotebookPen />
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
              "absolute top-full left-0 mt-2 z-40 w-80 max-h-96 overflow-y-auto",
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
                    {/* {isSelected && (
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
                    )} */}


                    <p className="text-gray-400 text-xs">
                      ID: {memory.mem_id}
                    </p>
                    {/* <label className="flex items-center cursor-pointer">
                      <span className="mr-2 text-gray-400 text-sm">Persistent</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isPersistent}
                          onChange={() => setIsPersistent((prev) => !prev)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:bg-purple-600 transition-all duration-300"></div>
                        <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-all duration-300 peer-checked:translate-x-5"></div>
                      </div>
                    </label> */}


                    <p className="text-white text-sm font-medium mb-1">
                      Context:{" "}
                      <span className="text-gray-300">
                        {memory.context}
                      </span>
                    </p>
                    {/* tags block */}
                    {memory.tags && memory.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
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
                    <div className="flex justify-between mt-3">
                      {/* action block */}
                      {/* <div className="flex items-center gap-3"> */}
                        <label className="flex items-center cursor-pointer">
                          <span className="text-gray-400 text-xs mr-1">Persistent</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={!!persistentMap[memory.mem_id]}
                              onChange={() => handleTogglePersistent(memory)}
                              // onChange={() => handleTogglePersistent(memory.mem_id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:bg-purple-600 transition-all duration-300"></div>
                            <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-all duration-300 peer-checked:translate-x-4"></div>
                          </div>
                        </label>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromSelectedMemories(memory);
                            handleDeleteMemoryClick(memory.mem_id);
                          }}
                          className="text-red-400 hover:text-red-300 text-lg cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-full"
                          aria-label={`Delete memory ${memory.mem_id}`}
                        >
                          ❌
                        </button>
                      </div>
                    </div>

                  // </div>
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