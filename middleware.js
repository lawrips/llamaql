// middleware.js

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Define the secret for NextAuth JWT
const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req) {
  // Get the token from the request using the secret
  const token = await getToken({ req, secret });

  // Get the requested path from the URL
  const { pathname } = req.nextUrl;

  // Allow the request if the token exists or it's a request to certain public paths
  if (token || pathname.startsWith("/api/public")) {
    return NextResponse.next(); // Allow access to the route
  }

  // If no token is found, block the request and return an error or redirect to login
  if (!token && pathname.startsWith("/api")) {
    return NextResponse.json(
      { error: "You must be logged in to access this API route" },
      { status: 401 }
    );
  }

  // Redirect unauthenticated requests to the sign-in page for non-API routes
  if (!token) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }
}

export const config = {
  matcher: [
    "/api/protected/:path*", // Protect all API routes under /api/protected/*
  ],
};
