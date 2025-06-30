// This file provides a function to create a JWT for user authentication
// It uses the 'jose' library to sign the JWT with a secret key
// The JWT includes the user's ID and email, and is set to expire in 3 days

import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.SECRET);


export async function createJWT(userId: string, email: string) {

    const jwt = await new SignJWT({
        userId: userId,
        email: email
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('3d')
        .sign(secret);

    return jwt;
}

export async function verifyJWT(token: string) {
    return await jwtVerify(token,secret);
}