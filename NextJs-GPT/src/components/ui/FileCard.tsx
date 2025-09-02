// FileCard.tsx
import React, { useState } from "react";
import clsx from "clsx";
import { Trash } from 'lucide-react';

import { FileType } from "../widgets/ChatFilesDropdown";

interface Props {
    file: FileType;
    selected: boolean;
    onClick: (f: FileType) => void;
    onTogglePersistence: (f: FileType) => void;
    onDelete: (f: FileType) => void;
}

export const FileCard: React.FC<Props> = ({
    file,
    selected,
    onClick,
    onTogglePersistence,
    onDelete,
}) => {

    return (
        <div
            key={file.fileId}
            onClick={(e) => {
                e.stopPropagation();
                onClick(file);
            }}
            className={clsx(
                "relative p-3 rounded-lg border transition-all duration-150 cursor-pointer",
                "hover:shadow-lg",
                selected
                    ? "bg-blue-900 border-blue-500 shadow-blue-500/50" // Selected state with blue
                    : "bg-gray-800 border-gray-700 hover:border-blue-500" // Unselected state with blue hover
            )}
            aria-label={`File ${file.fileId}: ${file.fileName}`}
        >
            <p className="text-gray-400 text-xs mb-3">ID: {file.fileId}</p>
            <p className="text-white text-sm font-medium">
                File Name:{" "}
                <span className="text-gray-300">{file.fileName}</span>
            </p>
            <div className="flex justify-between mt-3">
                <label className="flex items-center cursor-pointer">
                    <span className="text-gray-400 text-xs mr-1">Persistent</span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={file.persist}
                            onChange={(e) => {
                                e.stopPropagation();
                                onTogglePersistence(file);
                            }}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer-checked:bg-purple-600 transition-all duration-300"></div>
                        <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-all duration-300 peer-checked:translate-x-4"></div>
                    </div>
                </label>
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent card selection when deleting
                        onDelete(file);
                    }}
                    className="text-red-400 hover:text-red-300 text-lg hover:animate-[shake-rotate_0.6s_ease-in-out] cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-full"
                    aria-label={`Delete file ${file.fileId}`}
                >
                   <Trash className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


