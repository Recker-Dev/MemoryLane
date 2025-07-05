// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth/jwt";


export async function middleware(request: NextRequest) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Match /chat/:userId or deeper paths like /chat/:userId/something
    const chatRouteRegex = /^\/chat\/([^/]+)(\/.*)?$/;
    const match = pathname.match(chatRouteRegex);

    // If not a match, not a protected route, let em through
    if (!match) {
        return NextResponse.next();
    }

    // Extract userId from the matched route
    const urlUserId = match[1];
    console.log(`Middleware: User ID from URL is ${urlUserId}`);
 
    // Get JWT Token from cookies
    const token = request.cookies.get('auth_token')?.value;

    // If no Token, redirect to /
    if (!token) {
        console.log("No auth token found, redirecting to /");
        return NextResponse.redirect(new URL('/', request.url));
    }


    try {
        const { payload } = await verifyJWT(token);

        // Extract userId from token payload
        const userIdFromToken = payload.userId;
        console.log(`Middleware: User ID from JWT is ${userIdFromToken}`);

        if (!userIdFromToken) {
            console.log("JWT missing userId payload.");
            return NextResponse.redirect(new URL('/', request.url));
        }

        if (urlUserId != userIdFromToken) {
            console.log(`User tried accessing another user's chat. Redirecting to user's id.`);
            return NextResponse.redirect(
                new URL(`/chat/${userIdFromToken}`, request.url)
            );
        }

        // ✅ Optionally, you can pass user info along via headers
        const res = NextResponse.next();
        return res;
        // res.headers.set('x-user-id', userIdFromToken.toString());

    }
    catch (error) {
        console.error("JWT verification error:", error);
        return NextResponse.redirect(new URL("/", request.url));
    }

}

export const config = {
    matcher: ["/chat/:path*"],
};