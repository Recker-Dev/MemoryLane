import { NextResponse } from "next/server";
import { cookies } from "next/headers";

interface AuthError {
    message: string;
}

export async function POST() {
    try {
        // Clear the authentication cookie
        (await cookies()).delete('auth_token');

        return NextResponse.json({ success: true, message: "Logged out successfully." });
    } catch (error) {
        const typedError = error as AuthError;
        console.error("Logout error:", typedError.message);
        return NextResponse.json({ success: false, message: "An error occurred during logout." }, { status: 500 });
    }
}