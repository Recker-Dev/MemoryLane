"use client";

import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";

export default function AddButton() {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown if clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !buttonRef.current?.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative">
            {/* PLUS button */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center justify-center",
                    "w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-green-700",
                    "hover:from-green-500 hover:to-green-600 hover:scale-105",
                    "transition-all duration-150 ease-in-out",
                    "text-white"
                )}
                aria-label="Add Button"
            >
                {/* Plus SVG */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className={clsx(
                        "flex min-w-0 items-center gap-2 px-2",
                        "absolute left-0 bottom-full mb-2 w-48 rounded-lg shadow-lg z-50",
                        "bg-gray-800 border border-gray-700 -translate-x-6 -translate-y-4 hover:bg-gray-700 hover:shadow-xl"
                    )}
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
                            d="M5 19V7.5a2.5 2.5 0 012.5-2.5h9A2.5 2.5 0 0119 7.5V19m-9 0v-4a2 2 0 00-2-2H8a2 2 0 00-2 2v4m3-11H8m6 0h-3"
                        />
                    </svg>
                    <button
                        className={clsx(
                            "text-left py-2 text-white",
                            "transition-colors duration-150"
                        )}
                        onClick={() => {
                            console.log("Add Memory clicked!");
                            setIsOpen(false);
                        }}
                    >
                        Add Chat Memory
                    </button>
                </div>
            )}
        </div>
    );
}
