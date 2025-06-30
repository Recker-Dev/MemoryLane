'use client'; // Client-side directive for Next.js

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx'; // For conditional Tailwind classes
import toast from 'react-hot-toast';

// Main App component for the homepage
export default function SignUpPage() {
    const [email, setEmail] = useState(''); // State for email
    const [password, setPassword] = useState(''); // State for password
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRegistration = async (event: React.FormEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setIsLoading(true);

        if (!email || !password) {
            toast.error("Email and password are required.");
            setIsLoading(false);
            return;
        }

        // Entry User stats in db
        try {
            const response = await fetch('api/auth/register', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),

            });


            if (!response.ok) {
                const data = await response.json();
                toast.error(data.error || "Registration failed.");
                return;
            }
            toast.success('Registration successful! Please log in.');
            router.push('/home');
        }
        catch (error) {
            console.error(error);
            toast.error("Something went wrong.");
        }
        finally {
            setIsLoading(false);
            setEmail('');
            setPassword('');
        }
    };



    const handleLogin = async (event: React.FormEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setIsLoading(true);

        if (!email || !password) {
            toast.error("Email and password are required.");
            setIsLoading(false);
            return;
        }

        //Proceed with validating user
        try {
            const response = await fetch('api/auth/login', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                const data = await response.json();
                toast.error(data.error || "Login failed.");
                return;
            }
            const userData = await response.json();
            console.log("User ID:", userData.userId);
            router.push(`/chat/${userData.userId}`);
        }
        catch (err) {
            console.error(err);
            toast.error("Something went wrong.");
        }
        finally {
            setIsLoading(false);
            setEmail('');
            setPassword('');
        }
    }

    // const handleLogin = async (event: React.FormEvent<HTMLButtonElement>) => {
    //     event.preventDefault();

    //     const res = await signIn("credentials", {
    //         email,
    //         password,
    //         redirect: false,
    //     });

    //     if (res?.error) {
    //         console.log("Login error:", res.error);
    //         toast.error(res.error);
    //         router.push("/home"); // Redirect to home
    //         return;
    //     }

    //     // ✅ Now get the session info
    //     const session = await getSession();

    //     console.log("Session:", session);

    //     // @ts-ignore
    //     if (session?.userId) {
    //         // @ts-ignore
    //         router.push(`/chat/${session.userId}`);
    //     } else {
    //         toast.error("Something went wrong. Could not load user info.");
    //         router.push("/home"); // Redirect to home
    //     }
    // };





    return (
        // Outer container for the whole page
        <div
            className={clsx(
                "min-h-screen flex items-center justify-center p-4",
                "bg-gradient-to-br from-gray-950 via-black to-gray-900", // Deep, dark gradient background
                "font-sans text-white antialiased" // Using a sans-serif font and white text
            )}
        >
            {/* Central content container */}
            <div
                className={clsx(
                    "flex flex-col items-center justify-center p-8 md:p-12",
                    "bg-gray-900 bg-opacity-70 backdrop-filter backdrop-blur-lg", // Semi-transparent, blurred background
                    "rounded-2xl shadow-custom-strong border border-gray-800", // Rounded corners, strong shadow, subtle border
                    "max-w-md w-full text-center space-y-6" // Max width, full width on small screens, spacing
                )}
            >
                {/* Auth Section */}
                <div className="w-full space-y-4">
                    {/* Email Field */}
                    <input
                        type="email"
                        placeholder="Email"
                        className={clsx(
                            "w-full px-5 py-3 rounded-xl text-white text-base",
                            "bg-gray-800 border border-gray-700",
                            "placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500",
                            "transition-colors duration-200 ease-in-out"
                        )}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {/* Password Field */}
                    <input
                        type="password"
                        placeholder="Password"
                        className={clsx(
                            "w-full px-5 py-3 rounded-xl text-white text-base",
                            "bg-gray-800 border border-gray-700",
                            "placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500",
                            "transition-colors duration-200 ease-in-out"
                        )}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {/* Buttons container: side-by-side */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-4"> {/* Added flex-col for small screens, flex-row for sm+ */}
                        {/* Register Button */}
                        <button
                            onClick={handleRegistration}
                            disabled={isLoading}
                            className={clsx(
                                "flex-1 px-6 py-3 rounded-xl text-lg font-semibold", // flex-1 makes buttons take equal width
                                "bg-gradient-to-r from-purple-700 to-indigo-700",
                                "text-white shadow-lg transform transition-all duration-300 ease-in-out",
                                "hover:from-purple-600 hover:to-indigo-600 hover:scale-105",
                                "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75",
                                "active:scale-95",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                            )}
                        >
                            {isLoading ? 'Registering...' : 'Register'}
                        </button>

                        {/* Login Button */}
                        <button
                            onClick={handleLogin}
                            disabled={isLoading}
                            className={clsx(
                                "flex-1 px-6 py-3 rounded-xl text-lg font-semibold", // flex-1 makes buttons take equal width
                                "bg-gradient-to-r from-violet-700 to-purple-700",
                                "text-white shadow-lg transform transition-all duration-300 ease-in-out",
                                "hover:from-violet-600 hover:to-purple-600 hover:scale-105",
                                "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75",
                                "active:scale-95"
                            )}
                        >
                            {isLoading ? 'Logging-in...' : 'Login'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
