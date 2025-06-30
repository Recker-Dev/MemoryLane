import React from "react";
import Header from '@/components/header';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-black text-white">
      {children}
    </div>
  );
}
