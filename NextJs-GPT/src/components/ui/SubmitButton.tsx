import clsx from "clsx";
import { Send } from 'lucide-react';

interface SubmitButtonProps {
    isProcessingInput: boolean;
    onInputSubmit: (event: React.FormEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) => Promise<void>
}
export const SubmitButton: React.FC<SubmitButtonProps> = ({ isProcessingInput, onInputSubmit }) => {
    return (
        <button
            className={clsx(
                "flex items-center justify-center",
                "w-12 h-12 rounded-full shadow-lg transform transition-all duration-150 ease-in-out",
                isProcessingInput
                    ? "bg-gradient-to-r from-gray-700 to-gray-800 cursor-not-allowed"
                    : "bg-gradient-to-r from-violet-900 to-purple-800 hover:from-violet-800 hover:to-purple-700 hover:scale-105 hover:cursor-pointer",
                "active:scale-95"
            )}
            aria-label="Send message"
            onClick={onInputSubmit}
            disabled={isProcessingInput}
        >
            <Send />
        </button>
    );
};