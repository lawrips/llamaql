// middleware.js
import { NextResponse } from 'next/server';

// Base64 encode the username:password (for example: user:pass -> dXNlcjpwYXNz)
const basicAuth = Buffer.from(`${process.env.BASIC_USER}:${process.env.BASIC_PASS}`).toString('base64');

// This middleware function will intercept requests
export function middleware(req) {
  // Get the Authorization header
  const authHeader = req.headers.get('authorization');

  // If no Authorization header is provided, return a 401 Unauthorized response
  if (!authHeader) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  // Get the credentials from the Authorization header
  const auth = authHeader.split(' ')[1];

  // If the credentials are incorrect, return a 401 Unauthorized response
  if (auth !== basicAuth) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  // Allow the request to proceed if the credentials are correct
  return NextResponse.next();
}
