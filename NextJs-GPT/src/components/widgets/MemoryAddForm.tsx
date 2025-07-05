"use client";
import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx'; // Assuming clsx is available or can be added
import { useAddChatMemory } from '@/features/memory/custom-hooks/useAddChatMemory';
import { useUserStateStore } from "@/lib/stores/useUserStateStore";
import toast from 'react-hot-toast';

// This component represents the "Add Chat Memory" form as an overlay.
// It includes inputs for Memory Context and Tags, and Add/Cancel buttons.
// Props:
// - isOpen: Boolean to control the visibility of the form.
// - onClose: Function to call when the form is cancelled or successfully added.
// - onAddMemory: Function to call when the "Add" button is clicked,
//                passing the memoryContext and tags as arguments.

type MemoryAddFormProps = {
    isOpen: boolean;
    onClose: () => void;
}


export const MemoryAddForm: React.FC<MemoryAddFormProps> = ({
    isOpen,
    onClose,

}) => {
    // Global States
    const isUserSynced = useUserStateStore((state) => state.isUserSynced);
    const userId = useUserStateStore((state) => state.userId);
    const activeChatId = useUserStateStore((state) => state.activeChatId);


    // Component States
    const [memoryContext, setMemoryContext] = useState('');
    const [tags, setTags] = useState('');
    const [isAdding, setIsAdding] = useState(false); // State for loading indicator on Add button

    // Custom Hook: 
    const addChatMemory = useAddChatMemory();

    // Handle the "Cancel" button click or Escape key press
    const handleCancelClick = useCallback(() => {
        setMemoryContext(''); // Clear form fields
        setTags('');
        onClose(); // Close the form
    }, [onClose]);

    // Handle the "Add" button click
    const handleAddClick = useCallback(async () => {
        if (!isUserSynced || !userId || !activeChatId || !memoryContext) return;

        setIsAdding(true);

        const result = await addChatMemory({
            userId,
            activeChatId,
            memoryContext,
            tags,
        });

        setIsAdding(false);

        if (result.success) {
            toast.success("Memory added!");
            setMemoryContext("");
            setTags("");
            onClose();
        } else {
            toast.error(result.error || "Failed to add memory.");
        }
    }, [userId, activeChatId, memoryContext, tags, addChatMemory, onClose]);


    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleCancelClick();
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                handleAddClick();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleCancelClick, handleAddClick]);

    // If the form is not open, don't render anything
    if (!isOpen) {
        return null;
    }

    return (
        // Overlay container for the form
        <div
            className={clsx(
                "fixed inset-0 z-50 flex items-center justify-center p-4",
                " bg-opacity-90 backdrop-filter backdrop-blur-xl",
                "font-sans text-white antialiased"
            )}
        >
            {/* Form content container */}
            <div
                className={clsx(
                    "flex flex-col items-center p-6 md:p-8",
                    "bg-gray-900 bg-opacity-90 backdrop-filter backdrop-blur-lg",
                    "rounded-2xl shadow-custom-strong border border-gray-800",
                    "max-w-lg w-full text-center space-y-6 transform transition-all duration-300 ease-in-out",
                    "scale-100 opacity-100" // Initial state for entry animation if desired
                )}
            >
                <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Add Chat Memory
                </h2>

                {/* Memory Context Field */}
                <div className="w-full">
                    <label htmlFor="memoryContext" className="block text-left text-sm font-medium text-gray-400 mb-2">
                        Memory Context
                    </label>
                    <textarea
                        id="memoryContext"
                        placeholder="Describe the memory context..."
                        className={clsx(
                            "w-full px-5 py-3 rounded-xl text-white text-base",
                            "bg-gray-800 border border-gray-700",
                            "placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500",
                            "transition-colors duration-200 ease-in-out",
                            "min-h-[100px] resize-y" // Allow vertical resizing
                        )}
                        value={memoryContext}
                        onChange={(e) => setMemoryContext(e.target.value)}
                        rows={4} // Initial number of rows
                    />
                </div>

                {/* Tags Field (Optional) */}
                <div className="w-full">
                    <label htmlFor="tags" className="block text-left text-sm font-medium text-gray-400 mb-2">
                        Tags (Optional, comma-separated)
                    </label>
                    <input
                        type="text"
                        id="tags"
                        placeholder="e.g., project, meeting, idea"
                        className={clsx(
                            "w-full px-5 py-3 rounded-xl text-white text-base",
                            "bg-gray-800 border border-gray-700",
                            "placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500",
                            "transition-colors duration-200 ease-in-out"
                        )}
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                </div>

                {/* Buttons container */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full">
                    {/* Cancel Button */}
                    <button
                        onClick={handleCancelClick}
                        className={clsx(
                            "flex-1 px-6 py-3 rounded-xl text-lg font-semibold",
                            "bg-gray-700 text-white shadow-lg transform transition-all duration-300 ease-in-out",
                            "hover:bg-gray-600 hover:scale-105",
                            "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75",
                            "active:scale-95"
                        )}
                    >
                        Cancel
                    </button>

                    {/* Add Button */}
                    <button
                        onClick={handleAddClick}
                        disabled={isAdding || memoryContext.trim() === ''} // Disable if adding or context is empty
                        className={clsx(
                            "flex-1 px-6 py-3 rounded-xl text-lg font-semibold",
                            "bg-gradient-to-r from-purple-700 to-indigo-700",
                            "text-white shadow-lg transform transition-all duration-300 ease-in-out",
                            "hover:from-purple-600 hover:to-indigo-600 hover:scale-105",
                            "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75",
                            "active:scale-95",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        )}
                    >
                        {isAdding ? 'Adding...' : 'Add Memory'}
                    </button>
                </div>
            </div>
        </div>
    );
};
