import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from "next/image";
import Link from 'next/link';

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
            router.push('/');
            router.refresh(); // Ensures all server-side data is cleared and re-fetched
        } catch (error) {
            console.error(error);
            toast.error('Failed to log out.');
        }
    };
    return (
        <header className="bg-gray-900 text-white p-3 flex justify-between items-center border-b border-gray-700 shadow-md relative">
            <h1 className="text-xl font-bold text-gray-200 pl-4">
                <Link href="/" className="no-underline text-gray-200 hover:cursor-pointer" >MemoryLane 🧠</Link>
            </h1>

            <div className="relative group">
                <button
                    onClick={handleLogout}
                    className="text-2xl p-2 rounded-full pr-4 transition-colors duration-200 hover:cursor-pointer"
                    aria-label="Logout"
                >
                    <Image
                        src="/logout.svg"
                        alt="Logout"
                        width={24}
                        height={24}
                        priority
                    />
                </button>

                <div
                    className={`
        absolute right-full top-1/2 -translate-y-1/2 mr-2
        px-3 py-2 text-sm font-medium text-white
        bg-gray-900 rounded-lg shadow-xs
        opacity-0 invisible
        group-hover:visible group-hover:opacity-100
        transition-all duration-300
        whitespace-nowrap
      `}
                >
                    Logout
                </div>
            </div>
        </header>

    );
}