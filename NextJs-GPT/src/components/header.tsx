'use client';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function Header() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }

            toast.success('Logged out successfully!');
            router.push('/home');
            router.refresh(); // Ensures all server-side data is cleared and re-fetched
        } catch (error) {
            console.error(error);
            toast.error('Failed to log out.');
        }
    };
    return (
        <header className="bg-gray-900 text-white p-3 flex justify-between items-center border-b border-gray-700 shadow-md ">
            <h1 className="text-xl font-bold text-gray-200">Chat</h1>
            <button
                onClick={handleLogout}
                className="text-2xl p-2 rounded-full hover:bg-gray-700 transition-colors duration-200 hover:cursor-pointer"
                aria-label="Logout"
            >
                <span role="img" aria-label="logout emoji">🚪➡️</span>
            </button>
        </header>
    );
}