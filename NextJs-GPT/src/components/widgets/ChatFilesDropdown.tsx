import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { FileStack } from 'lucide-react';

import { useFileStore } from '@/lib/stores/useFileStore';

// This is a placeholder for a utility function that might be used for conditional classes.
// For this design-only component, it simply returns the classes as is.

// Define the type for a single memory
export type FileUiType = {
    file_id: string;
    fileName: string;
    expiresIn: string;
}

// Dummy data for visual representation
const dummyFiles = [
    {
        file_id: 'file_001',
        fileName: 'Project_Report_Q2.pdf',
        expiresIn: '2 days',
    },
    {
        file_id: 'file_002',
        fileName: 'Meeting_Notes_2025-07-05.docx',
        expiresIn: '5 days', // Example of an expired file
    },
    {
        file_id: 'file_003',
        fileName: 'Team_Photo_Vacation.jpg',
        expiresIn: '1 week',

    },
    {
        file_id: 'file_004',
        fileName: 'Budget_Spreadsheet_FY25.xlsx',
        expiresIn: '3 months',
    },
];

// ChatFilesDropdown Component
const ChatFilesDropdown = () => {

    ////////// GLOBAL states //////////
    const files = useFileStore((state) => state.chatFiles);
    const setChatFiles = useFileStore((state) => state.setChatFiles);
    const selectedFiles = useFileStore((state) => state.selectedFiles);
    const appendToSelectedFiles = useFileStore((state) => state.appendToSelectedFiles);
    const removeFromSelectedFiles = useFileStore((state) => state.removeFromSelectedFiles);


    // For design purposes, always show the dropdown and use dummy data
    useEffect(() => {
        setChatFiles(dummyFiles);
    }, [setChatFiles])


    // const selectedFilesCount = files.filter(file => file.isSelected).length; // For the badge


    const [showFilesDropdown, setShowFilesDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showFilesDropdown
                && dropdownRef.current
                && !dropdownRef.current.contains(event.target as Node)
                && toggleRef.current
                && !toggleRef.current.contains(event.target as Node)
            ) {
                setShowFilesDropdown(false);
            }
        }

        // Add MouseEvent listener
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }

    }, [showFilesDropdown]);

    const handleFileSelection = (file: FileUiType) => {
        if (selectedFiles.some((f) => f.file_id === file.file_id)) {
            removeFromSelectedFiles(file);
        }
        else {
            appendToSelectedFiles(file);
        }
    };

    // Placeholder for delete action
    const handleDeleteFileClick = (fileId: string) => {
        console.log(`Delete clicked for file ID: ${fileId}`);
        // In your actual implementation, this would trigger a state update or API call
    };

    return (
        <>
            {/* Files Toggle Button */}
            <button
                ref={toggleRef}
                onClick={() => setShowFilesDropdown(prev => !prev)}
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
                {selectedFiles.length > 0 && (
                    <span
                        className={clsx(
                            "absolute -top-1 -right-1",
                            "bg-blue-600 text-white text-xs font-semibold", // Different badge color for distinction
                            "px-1.5 py-0.5 rounded-full",
                            "border border-gray-900"
                        )}
                    >
                        {selectedFiles.length}
                    </span>
                )}
            </button>

            {/* Files Dropdown */}
            {showFilesDropdown && (
                <div
                    ref={dropdownRef}
                    className={clsx(
                        "absolute top-full left-0 mt-2 z-40 w-80 max-h-96 overflow-y-auto",
                        "bg-gray-900 border border-gray-700 rounded-lg shadow-xl",
                        "p-4 space-y-3 scrollbar-custom",
                    )}
                >
                    <h3 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">
                        Files
                    </h3>

                    {files.length === 0 ? (
                        <p className="text-gray-400 text-sm">
                            No files found.
                        </p>
                    ) : (
                        files.map((file) => {
                            const isSelected = selectedFiles.some((f) => f.file_id === file.file_id)
                            return (
                                <div
                                    key={file.file_id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileSelection(file);
                                    }}
                                    className={clsx(
                                        "relative p-3 rounded-lg border transition-all duration-150 cursor-pointer",
                                        "hover:shadow-lg",
                                        isSelected
                                            ? "bg-blue-900 border-blue-500 shadow-blue-500/50" // Selected state with blue
                                            : "bg-gray-800 border-gray-700 hover:border-blue-500" // Unselected state with blue hover
                                    )}
                                    aria-label={`File ${file.file_id}: ${file.fileName}`}
                                >
                                    {/* Checkmark icon for selected files */}
                                    {isSelected && (
                                        <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
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
                                    <p className="text-gray-400 text-xs mb-3">ID: {file.file_id}</p>
                                    <p className="text-white text-sm font-medium">
                                        File Name:{" "}
                                        <span className="text-gray-300">{file.fileName}</span>
                                    </p>
                                    <div className="flex justify-between items-end mb-1">
                                        <p className="text-gray-400 text-xs">
                                            Expires In:{" "}
                                            <span className="text-gray-500">{file.expiresIn}</span>
                                        </p>
                                        {/* Delete button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent card selection when deleting
                                                removeFromSelectedFiles(file); // If was selected good and fine, if not, fine either way.
                                                handleDeleteFileClick(file.file_id);
                                            }}
                                            className="text-red-400 hover:text-red-300 text-lg cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-full"
                                            aria-label={`Delete file ${file.file_id}`}
                                        >
                                            ❌
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}
        </>
    );
};

export default ChatFilesDropdown;
