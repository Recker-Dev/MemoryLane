// FileCard.tsx
import React from "react";
import clsx from "clsx";
import { Trash } from "lucide-react";
import { FileType } from "../widgets/ChatFilesDropdown";
import { useFileStore } from "@/lib/stores/useFileStore";

interface Props {
    fileId: string;
    selected: boolean;
    onClick: (f: FileType) => void;
    onTogglePersistence: (f: FileType) => void;
    onDelete: (f: FileType) => void;
}

const statusConfig = (file: FileType) => {
    if (file.status === "processing")
        return { dot: "bg-yellow-400", glow: "bg-yellow-400", label: "File undergoing processing" };
    if (file.status === "failed")
        return { dot: "bg-red-500", glow: "bg-red-500", label: file.error || "Processing failed" };

    // success (or fallback)
    const ok = file.isVectorDBCreated;
    return {
        dot: ok ? "bg-green-500" : "bg-slate-400",
        glow: ok ? "bg-green-500" : "bg-slate-400",
        label: ok ? "VectorDB created" : "Processing"
    };
};

export const FileCard: React.FC<Props> = ({
    fileId,
    selected,
    onClick,
    onTogglePersistence,
    onDelete,
}) => {
    const file = useFileStore((s) => s.chatFiles.get(fileId));
    if (!file) return null; // or a fallback UI
    const s = statusConfig(file);

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
                    ? "bg-blue-900 border-blue-500 shadow-blue-500/50"
                    : "bg-gray-800 border-gray-700 hover:border-blue-500"
            )}
            aria-label={`File ${file.fileId}: ${file.fileName}`}
        >
            <div className="flex flex-col gap-3">
                {/* Row 1: File info + status dot */}
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-gray-400 text-xs mb-1 break-all">ID: {file.fileId}</p>
                        <p className="text-white text-sm font-medium">
                            File Name: <span className="text-gray-300">{file.fileName}</span>
                        </p>
                    </div>

                    <div className="relative group ml-3 mt-1">
                        <span className={`relative inline-block h-5 w-5 rounded-full ${s.dot}`}>
                            {/* subtle pulse only when processing */}
                            {file.status === "processing" && (
                                <span className={`absolute inset-0 rounded-full ${s.dot} opacity-40 animate-ping`} />
                            )}
                        </span>

                        <div className="absolute right-0 top-6 translate-y-1 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[11px] text-gray-100 opacity-0 pointer-events-none shadow-lg ring-1 ring-white/10 transition-opacity duration-200 group-hover:opacity-100">
                            {s.label}
                        </div>
                    </div>
                </div>

                {/* Row 2: persistence toggle + delete */}
                <div className="flex justify-between items-center">
                    <label
                        className="flex items-center cursor-pointer"
                        onClick={(e) => e.stopPropagation()} // ✅ prevents bubbling to FileCard
                    >
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
                            e.stopPropagation();
                            onDelete(file);
                        }}
                        className="text-red-400 hover:text-red-300 text-lg hover:animate-[shake-rotate_0.6s_ease-in-out] cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-full"
                        aria-label={`Delete file ${file.fileId}`}
                    >
                        <Trash className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
