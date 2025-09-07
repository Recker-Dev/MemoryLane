// MemoryCard.tsx
import React, { useState } from "react";
import clsx from "clsx";
import { Copy, Check, Trash } from 'lucide-react';

import { Memory } from "../widgets/ChatMemoriesDropdown";

interface Props {
    memory: Memory;
    selected: boolean;
    onClick: (m: Memory) => void;
    onTogglePersistence: (m: Memory) => void;
    onDelete: (m: Memory) => void;
}

export const MemoryCard: React.FC<Props> = ({
    memory,
    selected,
    onClick,
    onTogglePersistence,
    onDelete,
}) => {
    const [expanded, setExpanded] = useState(false);
    const limit = 100;

    const displayedText =
        !expanded && memory.context.length > limit
            ? memory.context.slice(0, limit) + "..."
            : memory.context;

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(memory.context)
            setCopied(true);
            setTimeout(() => setCopied(false), 1500); // reset after 1.5s
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick(memory);
            }}
            className={clsx(
                "relative p-3 rounded-lg border transition-all duration-150 cursor-pointer",
                "hover:shadow-lg",
                selected
                    ? "bg-purple-900 border-purple-500 shadow-purple-500/50"
                    : "bg-gray-800 border-gray-700 hover:border-purple-500"
            )}
        >
            <div className="flex justify-between">
                <p className="text-gray-400 text-xs">ID: {memory.memid}</p>
                <button
                    aria-label={`Copy memory ${memory.memid}`}
                    onClick={(e) => {
                        e.stopPropagation();   // 🚫 stops parent click
                        handleCopy();
                    }}>
                    <div className="relative w-4 h-4 cursor-pointer">
                        <Copy
                            size={16}
                            className={`absolute inset-0 transform transition-all duration-300 ${copied ? "opacity-0 scale-50" : "opacity-100 scale-100"
                                }`}
                        />
                        <Check
                            size={16}
                            className={`absolute inset-0 transform transition-all duration-300 ${copied ? "opacity-100 scale-100" : "opacity-0 scale-50"
                                }`}
                        />
                    </div>

                </button>
            </div>
            <p className="text-white text-sm font-medium mt-3 mb-1">
                <span className="text-gray-300">{displayedText}</span>
            </p>

            {memory.context.length > limit && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded((prev) => !prev);
                    }}
                    className="text-sm cursor-pointer  text-yellow-400 hover:text-yellow-200 mt-1 focus:outline-none"
                >
                    {expanded ? "Show less" : "...Show more"}
                </button>
            )}

            <div className="flex justify-between mt-3">
                <label className="flex items-center cursor-pointer">
                    <span className="text-gray-400 text-xs mr-1">Persist</span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={memory.persist}
                            onChange={(e) => {
                                e.stopPropagation();
                                onTogglePersistence(memory);
                            }}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer-checked:bg-purple-600 transition-all duration-300"></div>
                        <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-all duration-300 peer-checked:translate-x-4"></div>
                    </div>
                </label>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(memory);
                    }}
                    className="text-red-400 hover:text-red-300 hover:animate-[shake-rotate_0.6s_ease-in-out] cursor-pointer text-lg focus:outline-none focus:ring-1 focus:ring-red-500 rounded-full"
                    aria-label={`Delete memory ${memory.memid}`}
                >
                    <Trash className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


