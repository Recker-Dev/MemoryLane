import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { FileStack } from 'lucide-react';

import { FileCard } from '../ui/FileCard';

import { useFileStore } from '@/lib/stores/useFileStore';

import { useDeleteChatFile } from '@/features/file/custom-hooks/useDeleteChatFile';
import { useToggleFilePersistance } from '@/features/file/custom-hooks/useToggleFilePersistance';


// Define the type for a single memory
export type FileType = {
    fileId: string;
    fileName: string;
    createdAt: Date;
    persist: boolean;
}


// ChatFilesDropdown Component
const ChatFilesDropdown: React.FC = () => {

    // -------- GLOBAL STATES --------
    const files = useFileStore((state) => state.chatFiles);

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
        if (selectedFiles.some((f) => f.fileId === file.fileId)) {
            removeFromSelectedFiles(file);
        }
        else {
            appendToSelectedFiles(file);
        }
    };

    const activeCount = selectedFiles.length + files.filter((f) => f.persist).length;


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

                    {files.length === 0 ? (
                        <p className="text-gray-400 text-sm">
                            No files found for this chat yet.
                        </p>
                    ) : (
                        files.map((file) =>
                        //     {
                        //     const selectedOrPersistent = isSelected(file)
                        //     return (
                        //         <div
                        //             key={file.fileId}
                        //             onClick={(e) => {
                        //                 e.stopPropagation();
                        //                 handleFileClick(file);
                        //             }}
                        //             className={clsx(
                        //                 "relative p-3 rounded-lg border transition-all duration-150 cursor-pointer",
                        //                 "hover:shadow-lg",
                        //                 selectedOrPersistent
                        //                     ? "bg-blue-900 border-blue-500 shadow-blue-500/50" // Selected state with blue
                        //                     : "bg-gray-800 border-gray-700 hover:border-blue-500" // Unselected state with blue hover
                        //             )}
                        //             aria-label={`File ${file.fileId}: ${file.fileName}`}
                        //         >
                        //             <p className="text-gray-400 text-xs mb-3">ID: {file.fileId}</p>
                        //             <p className="text-white text-sm font-medium">
                        //                 File Name:{" "}
                        //                 <span className="text-gray-300">{file.fileName}</span>
                        //             </p>
                        //             <div className="flex justify-between mt-3">
                        //                 <label className="flex items-center cursor-pointer">
                        //                     <span className="text-gray-400 text-xs mr-1">Persistent</span>
                        //                     <div className="relative">
                        //                         <input
                        //                             type="checkbox"
                        //                             checked={file.persist}
                        //                             onChange={(e) => {
                        //                                 e.stopPropagation();
                        //                                 handleToggleFilePersistance(file);
                        //                             }}
                        //                             className="sr-only peer"
                        //                         />
                        //                         <div className="w-9 h-5 bg-gray-700 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer-checked:bg-purple-600 transition-all duration-300"></div>
                        //                         <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-all duration-300 peer-checked:translate-x-4"></div>
                        //                     </div>
                        //                 </label>
                        //                 <button
                        //                     onClick={(e) => {
                        //                         e.stopPropagation(); // Prevent card selection when deleting
                        //                         removeFromSelectedFiles(file); // If was selected good and fine, if not, fine either way.
                        //                         handleDeleteFileClick(file);
                        //                     }}
                        //                     className="text-red-400 hover:text-red-300 text-lg cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-full"
                        //                     aria-label={`Delete file ${file.fileId}`}
                        //                 >
                        //                     ❌
                        //                 </button>
                        //             </div>
                        //         </div>
                        //     )
                        // }
                        (<FileCard
                            key={file.fileId}
                            file={file}
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
