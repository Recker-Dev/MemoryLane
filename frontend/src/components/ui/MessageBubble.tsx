/* eslint-disable */
import React, { useState } from "react";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import { Clipboard, ClipboardCheck } from "lucide-react";

import { useChatStore } from "@/lib/stores/useChatStore";
import { useUserStateStore } from "@/lib/stores/useUserStateStore";

export type MessageBubbleProps = {
  id: string;
  // sender: "ai" | "user";
  // text: string;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ id }) => {
  const activeChatId = useUserStateStore((state) => state.activeChatId);
  if (!activeChatId) return null;
  const chatMssg = useChatStore((state) => state.getMessage(activeChatId, id));
  if (!chatMssg) return null;
  const text = chatMssg.content;
  const isUser = chatMssg.role === "user";


  // Small inline component for code blocks
  const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(String(children));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };

    return (
      <div className="relative group my-4">
        <pre className="bg-black p-4 rounded-xl overflow-x-auto font-mono text-sm">
          <code>{children}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1"
        >
          {copied ? <ClipboardCheck size={14} /> : <Clipboard size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    );
  };

  return (
    <div
      // ref={messagesEndRef}
      className={clsx("flex pb-2", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={clsx(
          "p-3 rounded-lg text-base shadow-md",
          isUser
            ? "bg-gradient-to-r from-violet-900 to-purple-800 text-white ml-auto max-w-xl"
            : "border border-gray-700 text-gray-300 backdrop-blur-md bg-opacity-0 max-w-3xl w-fit"
        )}
      >
        <p className="font-medium mb-1 text-sm opacity-80">
          {isUser ? "You:" : "AI:"}
        </p>

        <div
          className={clsx(
            "prose prose-invert max-w-none prose-sm",

            // Headings & paragraphs
            "[&>h1]:mt-6 [&>h1]:mb-3",
            "[&>h2]:mt-5 [&>h2]:mb-2",
            "[&>h3]:mt-4 [&>h3]:mb-2",
            "[&>p]:my-3 [&>p]:leading-relaxed",

            // Blockquotes / hr
            "[&>blockquote]:my-4 [&>blockquote]:pl-4 [&>blockquote]:border-l-2 [&>blockquote]:border-gray-700",
            "[&>hr]:my-6",

            // Lists (top-level + nested)
            "[&>ul]:my-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:list-outside",
            "[&>ol]:my-3 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:list-outside",
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2",
            "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2",
            "[&_li]:my-1",

            // Inline code
            "[&>p>code]:bg-gray-800 [&>p>code]:text-purple-300 [&>p>code]:px-1.5 [&>p>code]:py-0.5 [&>p>code]:rounded [&>p>code]:text-sm [&>p>code]:font-mono",
          )}
        >
          <ReactMarkdown
            components={{
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              // @ts-expect-error
              code({
                node,
                inline,
                className,
                children,
                ...props
              }: {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                node?: any;
                inline?: boolean;
                className?: string;
                children: React.ReactNode;
              }) {
                const match = /language-(\w+)/.exec(className || "");

                if (inline) {
                  // ✅ Inline `code`
                  return (
                    <code
                      className="bg-gray-800 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                if (match) {
                  // ✅ Fenced code block with language
                  return <CodeBlock>{children}</CodeBlock>;
                }

                // ✅ Just render normally if it's weird
                return (
                  <code className="font-mono text-sm" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {text}
          </ReactMarkdown>


        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
