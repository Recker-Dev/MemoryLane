import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { FileStack } from 'lucide-react';

import { FileCard } from '../ui/FileCard';

import { useFileStore } from '@/lib/stores/useFileStore';

import { useDeleteChatFile } from '@/features/file/custom-hooks/useDeleteChatFile';
import { useToggleFilePersistance } from '@/features/file/custom-hooks/useToggleFilePersistance';
import toast from 'react-hot-toast';


// Define the type for a single memory
export type FileType = {
    fileId: string;
    fileName: string;
    createdAt: Date;
    persist: boolean;
    isVectorDBCreated: boolean,
    status: string,
    error: string,
}


// ChatFilesDropdown Component
const ChatFilesDropdown: React.FC = () => {

    // -------- GLOBAL STATES --------
    const filesMap = useFileStore((state) => state.chatFiles);

    const selectedFiles = useFileStore((state) => state.selectedFiles);
    const appendToSelectedFiles = useFileStore((state) => state.appendToSelectedFiles);
    const removeFromSelectedFiles = useFileStore((state) => state.removeFromSelectedFiles);

    const handleDeleteFileClick = useDeleteChatFile()
    const handleToggleFilePersistance = useToggleFilePersistance();

    // -------- COMPONENT STATE --------
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);

    // -------- EFFECT: Click Outside --------
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showDropdown
                && dropdownRef.current
                && !dropdownRef.current.contains(event.target as Node)
                && toggleRef.current
                && !toggleRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        }

        // Add MouseEvent listener
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }

    }, [showDropdown]);

    // -------- HELPERS --------
    const isSelected = (file: FileType): boolean =>
        file.persist || selectedFiles.some((f) => f.fileId === file.fileId);

    const handleFileClick = (file: FileType) => {
        if (file.persist) return;
        if (file.status === "processing" && file.isVectorDBCreated === false) {
            toast.error(`File is in the oven ⏲️! Standby!`)
            return;
        }
        if (file.error != "") {
            toast.error(`${file.fileName} cannot be used for context; error: ${file.error}`)
            return;
        }
        if (selectedFiles.some((f) => f.fileId === file.fileId)) {
            removeFromSelectedFiles(file);
        }
        else {
            appendToSelectedFiles(file);
        }
    };

    const files = [...filesMap.entries()] // (id,file) tuple

    const activeCount = useFileStore((state) => {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        return state.selectedFiles.length + [...state.chatFiles.entries()].filter(([_, file]) => file.persist).length;
    }); // Zustand, whenever you’re computing a value that depends on multiple pieces of state, do it inside the selector


    return (
        <>
            {/* Files Toggle Button */}
            <button
                ref={toggleRef}
                onClick={() => setShowDropdown(prev => !prev)}
                className={clsx(
                    "relative p-2 rounded-full hover:cursor-pointer",
                    "bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75" // Different ring color for distinction
                )}
                aria-label="Toggle files dropdown"
            >
                {/* File Icon (using SVG for a simple file symbol) */}
                <FileStack />
                {/* A mini-badge showing count of files selected currently */}
                {activeCount > 0 && (
                    <span
                        className={clsx(
                            "absolute -top-1 -right-1",
                            "bg-blue-600 text-white text-xs font-semibold", // Different badge color for distinction
                            "px-1.5 py-0.5 rounded-full",
                            "border border-gray-900"
                        )}
                    >
                        {activeCount}
                    </span>
                )}
            </button>

            {/* Files Dropdown */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className={clsx(
                        "absolute top-full left-0 mt-2 z-40 w-80 max-h-96 overflow-y-auto",
                        "bg-gray-900 border border-gray-700 rounded-lg shadow-xl",
                        "p-4 space-y-3 scrollbar-custom",
                    )}
                >
                    <h3 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">
                        Chat Files
                    </h3>

                    {files && files.length === 0 ? (
                        <p className="text-gray-400 text-sm">
                            No files found for this chat yet.
                        </p>
                    ) : (
                        files.map(([id, file]) =>
                        (<FileCard
                            key={id}
                            fileId={id}
                            selected={isSelected(file)}
                            onClick={handleFileClick}
                            onTogglePersistence={handleToggleFilePersistance}
                            onDelete={handleDeleteFileClick}
                        />))
                    )}
                </div>
            )}
        </>
    );
};

export default ChatFilesDropdown;
