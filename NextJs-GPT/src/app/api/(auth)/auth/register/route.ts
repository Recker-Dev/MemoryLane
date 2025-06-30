import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/authServices";

interface AuthError {
  message: string;
}

export async function POST(request: NextRequest) {
    const {email , password} = await request.json();
    try {
        const data = await registerUser(email, password);
        return NextResponse.json(data);
    }
    catch (error) {
        const typedError = error as AuthError;
        console.error("Registration error:", typedError.message);
        return NextResponse.json({ error: typedError.message || "Registration failed." }, { status: 400 });
    }
}

