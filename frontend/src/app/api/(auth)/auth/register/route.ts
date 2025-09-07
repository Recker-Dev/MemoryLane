import { NextRequest, NextResponse } from "next/server";
import { createJWT } from "@/lib/auth/jwt";
import { cookies } from "next/headers";


export async function POST(request: NextRequest) {
    const { email, password } = await request.json();
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ENDPOINT}/registerUser`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Registration failed");
        }

        const data = await response.json();

        // Create JWT payload
        const token = await createJWT(data.userId, data.email);

        // Set the JWT in cookies
        (await cookies()).set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            path: "/",
            maxAge: 60 * 60 * 24 * 3, // 3 days
        });

        return NextResponse.json(data);
    } catch (error) {
        const typedError = error as Error;
        console.error("Registration error:", typedError.message);
        return NextResponse.json(
            { error: typedError.message || "Registration failed" },
            { status: 400 }
        );
    }
}

