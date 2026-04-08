import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// This secret must be the same as used in your backend API to sign JWTs.
// It must be stored as an environment variable in Vercel (e.g., JWT_SECRET).
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'a99f2e1a8b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c');

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Define paths that require authentication
  const protectedPaths = ['/student.html', '/staff.html'];

  // Only run middleware for protected paths
  if (!protectedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session');

  if (!sessionCookie) {
    // No session cookie, redirect to login page
    return NextResponse.redirect(new URL('/index.html', request.url));
  }

  try {
    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET, {
      algorithms: ['HS256'],
    });

    // Check if the role matches the protected path
    if (pathname.startsWith('/student.html') && payload.role !== 'student') {
      return NextResponse.redirect(new URL('/index.html', request.url));
    }
    if (pathname.startsWith('/staff.html') && payload.role !== 'staff') {
      return NextResponse.redirect(new URL('/index.html', request.url));
    }

    // If authenticated and authorized, proceed
    return NextResponse.next();
  } catch (error) {
    console.error('JWT verification failed in middleware:', error);
    // Invalid or expired token, redirect to login page
    return NextResponse.redirect(new URL('/index.html', request.url));
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: ['/student.html', '/staff.html'],
};