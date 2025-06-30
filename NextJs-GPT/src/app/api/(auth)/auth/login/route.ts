import { NextRequest, NextResponse,  } from "next/server";
import { validateUser } from "@/lib/authServices";
import { createJWT } from "@/lib/jwt";
import { cookies } from "next/headers";

interface AuthError {
  message: string;
}


export async function POST(request: NextRequest) {
    const { email, password } = await request.json();
    try {
        const data = await validateUser(email, password);

        // Create JWT payload
        const token = await createJWT(data.userId, data.email);


        // Set the JWT in cookies on the response object
        (await cookies()).set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            path: "/",
            maxAge: 60 * 60 * 24 * 3, // 3 days
        });

        // Create the response object first
        const response = NextResponse.json({
            success: true,
            userId: data.userId,
            email: data.email,
        });

        return response;
    }
    catch (error) {
        const typedError = error as AuthError;
        console.error("Login error:", typedError.message);
        return NextResponse.json({ error: typedError.message || "Login failed." }, { status: 400 });
    }
}
