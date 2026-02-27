import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect the RSVP route
  if (pathname.startsWith('/rsvp')) {
    // Check if user is authenticated by looking for the Firebase auth token
    const token = request.cookies.get('firebase-auth-token');

    if (!token) {
      // The AuthGuard component will handle showing the sign-in UI
      return NextResponse.next();
    }
  }

  // Protect admin routes (skip API routes so the verify endpoint remains accessible)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/api')) {
    const token = request.cookies.get('firebase-auth-token');

    if (!token) {
      // The AdminGuard component handles the actual auth + admin check client-side
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/rsvp/:path*', '/admin/:path*'],
};
