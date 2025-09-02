import clsx from "clsx";
import { Send } from 'lucide-react';
import { useUIStore } from "@/lib/stores/useUIStore";

interface SubmitButtonProps {
    isWebSocketConnected: boolean;
    onInputSubmit: (event: React.FormEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) => Promise<void>
}
export const SubmitButton: React.FC<SubmitButtonProps> = ({ isWebSocketConnected, onInputSubmit }) => {
    const isProcessingInput = useUIStore((s) => s.isProcessingInput);
    // const isProcessingInput = false;
    return (
        <button
            className={clsx(
                "flex items-center justify-center",
                "w-12 h-12 rounded-full shadow-lg transform transition-all duration-150 ease-in-out",
                (isProcessingInput || !isWebSocketConnected)
                    ? "bg-gradient-to-r from-gray-700 to-gray-800 cursor-not-allowed"
                    : "bg-gradient-to-r from-violet-900 to-purple-800 hover:from-violet-800 hover:to-purple-700 hover:scale-105 hover:cursor-pointer",
                "active:scale-95"
            )}
            aria-label="Send message"
            onClick={onInputSubmit}
            disabled={isProcessingInput || !isWebSocketConnected}
        >
            <Send />
        </button>
    );
};