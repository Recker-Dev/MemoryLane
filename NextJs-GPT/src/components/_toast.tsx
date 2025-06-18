// components/_toast.jsx
'use client'; // Important if using in Next.js App Router

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return <Toaster position="top-right" toastOptions={{ duration: 3000 }} />;
}