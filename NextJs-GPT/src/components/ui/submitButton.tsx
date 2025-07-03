import clsx from "clsx";

interface SubmitButtonProps {
    isProcessingInput: boolean;
    handleSubmission: (event: React.FormEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>)  => void;
}
export const SubmitButton: React.FC<SubmitButtonProps> = ({ isProcessingInput, handleSubmission }) => {
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
            onClick={handleSubmission}
            disabled={isProcessingInput}
        >
            {/* Arrow up SVG */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 10l7-7 7 7M12 3v18"
                />
            </svg>
        </button>
    );
};