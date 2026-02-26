import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect the RSVP route
  if (request.nextUrl.pathname.startsWith('/rsvp')) {
    // Check if user is authenticated by looking for the Firebase auth token
    const token = request.cookies.get('firebase-auth-token');
    
    if (!token) {
      // Redirect to the same RSVP page but with a sign-in prompt
      // The AuthGuard component will handle showing the sign-in UI
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/rsvp/:path*']
};
