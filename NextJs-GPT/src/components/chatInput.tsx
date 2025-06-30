"use client";
import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";

interface ChatInputProps {
  inputText: string;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmission: (
    event:
      | React.FormEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) => void;
  isProcessingInput: boolean;
}

interface AutoFillPart {
  type: "text" | "placeholder" | "optional";
  value: string;
  colorClass?: string;
}

interface CommandDefinition {
  value: string;
  description: string;
  autoFill?: AutoFillPart[];
  fullAutoFillString?: string;
}

const commands: CommandDefinition[] = [
  {
    value: "/chatmem",
    description: "Store memory context for this chat",
    autoFill: [
      { type: "text", value: "context", colorClass: "text-blue-300" },
      { type: "text", value: "=", colorClass: "text-gray-400" },
      {
        type: "placeholder",
        value: `"e.g. Remember to ask about deadlines"`,
        colorClass: "text-green-300",
      },
      { type: "text", value: " ", colorClass: "" },
      { type: "text", value: "tags", colorClass: "text-blue-300" },
      { type: "optional", value: "(Optional)", colorClass: "text-gray-500" },
      { type: "text", value: "=", colorClass: "text-gray-400" },
      {
        type: "placeholder",
        value: `"e.g. work, priority"`,
        colorClass: "text-green-300",
      },
    ],
    fullAutoFillString: `context = "" tags(Optional) = ""`,
  },
  {
    value: "/fetch",
    description: "Fetch relevant memory for this chat",
    autoFill: [],
    fullAutoFillString: "",
  },
];


const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  handleInputChange,
  handleSubmission,
  isProcessingInput,
}) => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isTypingCommandParameters, setIsTypingCommandParameters] = useState(false);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Unified useEffect for controlling palette visibility and focus
  useEffect(() => {
    const shouldOpenPalette = inputText.startsWith("/") && !isTypingCommandParameters;

    // Update commandPaletteOpen state
    setCommandPaletteOpen(shouldOpenPalette);

    // Manage focus based on palette state
    if (shouldOpenPalette) {
      setTimeout(() => {
        if (commandInputRef.current) {
          commandInputRef.current.focus();
        }
      }, 50);
    } else {
      // If palette is closed, ensure main input gets focus if it's not already
      // And reset isTypingCommandParameters if / is gone
      if (!inputText.startsWith("/")) {
        setIsTypingCommandParameters(false);
      }
      if (mainInputRef.current && document.activeElement !== mainInputRef.current) {
        mainInputRef.current.focus();
      }
    }
  }, [inputText, isTypingCommandParameters]); // Depend on both for robust control

  // Adapter function for CommandInput's onValueChange (expects a string)
  const handleCommandInputValueChange = (searchString: string) => {
    const syntheticEvent = {
      target: { value: searchString },
      currentTarget: { value: searchString },
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
  };

  // Main input's onChange handler (just updates inputText state via prop)
  const handleMainInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e); // This updates inputText, which triggers the useEffect above
    // No direct state changes for commandPaletteOpen or isTypingCommandParameters here.
  };

  const handleSelectCommand = (command: CommandDefinition) => {
    const fullCommand = command.value + (command.fullAutoFillString ? ` ${command.fullAutoFillString}` : '');
    const syntheticEvent = {
      target: { value: fullCommand },
      currentTarget: { value: fullCommand },
    } as React.ChangeEvent<HTMLInputElement>;

    handleInputChange(syntheticEvent);
    setIsTypingCommandParameters(true); // Indicate we are now filling parameters
    // The useEffect will see inputText updated and isTypingCommandParameters true, and close the palette.

    // Focus main input and set cursor position after selection
    setTimeout(() => {
      if (mainInputRef.current) {
        const firstQuoteIndex = fullCommand.indexOf('""');
        if (firstQuoteIndex !== -1) {
          mainInputRef.current.focus();
          mainInputRef.current.setSelectionRange(firstQuoteIndex + 1, firstQuoteIndex + 1);
        } else {
          mainInputRef.current.focus();
          mainInputRef.current.setSelectionRange(fullCommand.length, fullCommand.length);
        }
      }
    }, 0);
  };

  const handleMainInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (commandPaletteOpen) {
        event.preventDefault(); // Let CommandInput handle Enter for selection
      } else if (!isProcessingInput) {
        handleSubmission(event);
      }
    } else if (event.key === "Tab" && mainInputRef.current) {
      if (!commandPaletteOpen) { // Only custom tab if palette not active
        const cursorPosition = mainInputRef.current.selectionStart || 0;
        const currentText = mainInputRef.current.value;
        const placeholderPattern = /""/g;

        let match;
        let nextPlaceholderIndex = -1;

        placeholderPattern.lastIndex = 0;
        while ((match = placeholderPattern.exec(currentText)) !== null) {
          if (match.index > cursorPosition) {
            nextPlaceholderIndex = match.index;
            break;
          }
        }

        if (nextPlaceholderIndex !== -1) {
          event.preventDefault();
          mainInputRef.current.setSelectionRange(nextPlaceholderIndex + 1, nextPlaceholderIndex + 1);
        } else {
          placeholderPattern.lastIndex = 0;
          match = placeholderPattern.exec(currentText);
          if (match !== null) {
            event.preventDefault();
            mainInputRef.current.setSelectionRange(match.index + 1, match.index + 1);
          }
        }
      }
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3 mt-4 mb-4">
        <input
          ref={mainInputRef}
          type="text"
          value={inputText}
          onChange={handleMainInputChange}
          onKeyDown={handleMainInputKeyDown}
          placeholder={"Chat with AI...."}
          className={clsx(
            "flex-grow px-5 py-3 rounded-full text-white text-lg transition-all duration-200 ease-in-out",
            "bg-gray-800 backdrop-filter backdrop-blur-lg border border-gray-800",
            "bg-opacity-70 placeholder-gray-400 hover:bg-opacity-80 focus:bg-opacity-90",
            "hover:border-gray-600 focus:border-gray-400 focus:shadow-inner-xl"
          )}
        />
        <button
          className={clsx(
            "text-white p-3 rounded-full shadow-lg transform transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75",
            isProcessingInput
              ? "bg-gradient-to-r from-gray-700 to-gray-800 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-900 to-purple-800 hover:from-violet-800 hover:to-purple-700 hover:scale-105",
            "active:scale-95"
          )}
          aria-label="Send message"
          onClick={handleSubmission}
          disabled={isProcessingInput}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </div>

      {/* Slash Command Palette */}
      {commandPaletteOpen && (
        <div className="absolute bottom-16 left-0 w-full z-50">
          <Command className="rounded-lg border border-gray-800 shadow-md bg-gray-900">
            <CommandInput
              ref={commandInputRef}
              value={inputText}
              onValueChange={handleCommandInputValueChange}
              placeholder="Type a command or search..."
              className="px-4 py-2 bg-transparent text-gray-300 placeholder-gray-500 focus:ring-0 focus:outline-none border-0"
            />
            <CommandList className="max-h-60 overflow-y-auto bg-transparent p-2">
              <CommandGroup heading="Suggestions">
                {commands.map((cmd) => (
                  <CommandItem
                    key={cmd.value}
                    value={cmd.value}
                    onSelect={() => {
                      handleSelectCommand(cmd);
                    }}
                    className={clsx(
                      "flex flex-col items-start text-gray-200 px-4 py-2 rounded cursor-pointer transition-colors duration-200",
                      "data-[selected=true]:bg-gray-800 data-[selected=true]:text-white",
                      "hover:bg-gray-800 focus:bg-gray-800"
                    )}
                  >
                    <span className="font-semibold text-purple-300">
                      {cmd.value}
                    </span>
                    <span className="text-gray-300 text-sm mt-1">
                      {cmd.description}
                    </span>
                    {cmd.autoFill && cmd.autoFill.length > 0 && (
                      <div className="flex flex-wrap items-center text-xs mt-1 text-gray-500">
                        {cmd.autoFill.map((part, index) => (
                          <span
                            key={index}
                            className={clsx(
                              part.colorClass,
                              {
                                "mr-1": part.value !== "=",
                                "ml-1": part.type === "text" && index > 0 && cmd.autoFill![index - 1]?.type !== "text",
                              }
                            )}
                          >
                            {part.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandEmpty className="text-gray-400 p-2 text-center">
                No commands found
              </CommandEmpty>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

export default ChatInput;