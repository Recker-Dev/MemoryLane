import React, { useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';

// This component provides a UI for file uploading with drag-and-drop.
// It includes an overlay, file type validation (PDF, images),
// and conditional enabling of the upload button.
// Props:
// - isOpen: Boolean to control the visibility of the form.
// - onClose: Function to call when the form is cancelled or files are uploaded.

type FileUploadFormProps = {
    isOpen: boolean;
    onClose: () => void;
}

// Define allowed file types for validation
const ALLOWED_FILE_TYPES = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'application/pdf': true,
};

const MAX_FILE_SIZE_MB = 50; // Example max file size

export const FileUploadForm: React.FC<FileUploadFormProps> = ({
    isOpen,
    onClose,
}) => {
    // Component States
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Callback to validate files
    const validateFiles = useCallback((files: FileList | File[]) => {
        const newFiles: File[] = [];
        const newErrors: string[] = [];

        Array.from(files).forEach(file => {
            if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
                newErrors.push(`File "${file.name}" has an unsupported type: ${file.type}. Only PDFs and images are allowed.`);
            } else if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                newErrors.push(`File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB} MB.`);
            } else if (selectedFiles.some(f => f.name === file.name)) {
                newErrors.push(`File "${file.name}" has already been selected.`);
            }
            else {
                newFiles.push(file);
            }
        });

        setSelectedFiles(prev => [...prev, ...newFiles]);
        setErrors(prev => [...prev, ...newErrors]);
    }, []);

    // Handle file selection via input click
    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            validateFiles(event.target.files);
            // Clear the input value to allow selecting the same file again if needed
            event.target.value = '';
        }
    }, [validateFiles]);


    // Handle drop event
    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (event.dataTransfer.files) {
            validateFiles(event.dataTransfer.files);
        }
    }, [validateFiles]);


    // Handle "Cancel" button click or Escape key press
    const handleCancelClick = useCallback(() => {
        setSelectedFiles([]); // Clear selected files
        setErrors([]);        // Clear errors
        onClose();            // Close the form
    }, [onClose]);

    // Handle "Upload" button click (conceptual)
    const handleUploadClick = useCallback(() => {
        if (selectedFiles.length === 0) {
            return; // Should be disabled by the button's disabled prop
        }
        console.log('Uploading files:', selectedFiles.map(file => file.name));
        // Simulate upload process
        // In a real app, you'd send files to a server here
        setTimeout(() => {
            alert('Files uploaded successfully (simulated)!'); // Using alert for demo, replace with toast
            handleCancelClick(); // Close form after simulated upload
        }, 1000);
    }, [selectedFiles, errors, handleCancelClick]);

    // Effect for Escape key press to close the form
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleCancelClick();
            }
            if (event.key === 'Enter' && isUploadButtonEnabled) {
                handleUploadClick();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleCancelClick]);

    // Display Errors if there is errors and then clean them after 5 sec.
    useEffect(() => {
        if (errors.length === 0) return;
        const timer = setTimeout(() => {
            setErrors([])
        }, 4500);
        return () => clearTimeout(timer);
    }, [errors])

    // If the form is not open, don't render anything
    if (!isOpen) {
        return null;
    }

    // console.log(selectedFiles);

    const isUploadButtonEnabled = selectedFiles.length > 0;

    return (
        // Overlay container for the form
        <div
            className={clsx(
                "fixed inset-0 z-50 flex items-center justify-center p-4",
                " bg-opacity-90 backdrop-filter backdrop-blur-xl", // Darker overlay
                "font-sans text-white antialiased"
            )}
        >
            {/* Form content container */}
            <div
                className={clsx(
                    "flex flex-col items-center p-6 md:p-8",
                    "bg-gray-900 bg-opacity-90 backdrop-filter backdrop-blur-lg",
                    "rounded-2xl shadow-custom-strong border border-gray-800",
                    "max-w-xl w-full text-center space-y-6 transform transition-all duration-300 ease-in-out",
                    "scale-100 opacity-100"
                )}
            >
                <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Upload Files
                </h2>

                {/* Drag and Drop Area */}
                <div
                    className={clsx(
                        "w-full p-8 border-2 border-dashed rounded-xl cursor-pointer",
                        "transition-colors duration-200 ease-in-out",
                        isDragging ? "border-purple-500 bg-purple-900 bg-opacity-20" : "border-gray-700 hover:border-purple-500 hover:bg-gray-800",
                        "flex flex-col items-center justify-center space-y-3"
                    )}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                    }}
                    onDrop={handleDrop}
                    onClick={() => {
                        fileInputRef.current?.click(); // Simulate click for input field, allowing OS interactivity.
                    }}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        accept="image/*,application/pdf" // Restrict file types at OS level
                        className="hidden"
                    />
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-pink-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                    <p className="text-lg text-gray-300 font-medium">Drag & Drop files here</p>
                    <p className="text-sm text-gray-400 ">or <span className=" bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent font-semibold">Click to browse</span></p>
                    <p className="text-xs text-gray-500">Only PDF and Image files (JPEG, PNG, GIF, WebP) are allowed, max {MAX_FILE_SIZE_MB}MB per file.</p>
                </div>

                {/* Display selected files */}
                {selectedFiles.length > 0 && (
                    <div className="w-full text-left space-y-2 max-h-40 overflow-y-auto scrollbar-custom">
                        <p className="text-sm font-medium text-gray-400">Selected Files:</p>
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded-lg text-sm">
                                <span className="text-gray-300 truncate">{file.name}</span>
                                <button
                                    onClick={() => {
                                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    className="text-red-400 hover:text-red-300 ml-2 hover:cursor-pointer"
                                    aria-label={`Remove file ${file.name}`}
                                >
                                    ❌
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Display errors */}
                {errors.length > 0 && (
                    <div className="w-full text-left space-y-2 text-red-400 text-sm">
                        {errors.map((error, index) => (
                            <p key={index} className="bg-red-900 bg-opacity-30 p-2 rounded-lg border border-red-700 animate-slide-in-stay-out">
                                {error}
                            </p>
                        ))}
                    </div>
                )}

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

                    {/* Upload Button */}
                    <button
                        onClick={handleUploadClick}
                        disabled={!isUploadButtonEnabled}
                        className={clsx(
                            "flex-1 px-6 py-3 rounded-xl text-lg font-semibold",
                            "bg-gradient-to-r from-purple-700 to-pink-700",
                            "text-white shadow-lg transform transition-all duration-300 ease-in-out",
                            "hover:from-purple-600 hover:to-pink-600 hover:scale-105",
                            "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75",
                            "active:scale-95",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        )}
                    >
                        Upload Files
                    </button>
                </div>
            </div>
        </div>
    );
};
