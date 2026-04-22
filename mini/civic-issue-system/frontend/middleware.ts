import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /admin, /admin/settings, /department)
  const path = request.nextUrl.pathname;

  // Check if the path starts with /admin or /department
  if (path.startsWith('/admin') || path.startsWith('/department')) {
    // For server-side, we can't check localStorage directly
    // But we can check for the presence of auth cookies or headers
    const token = request.cookies.get('token')?.value;

    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Note: We can't verify the token role here without making an API call
    // The client-side will handle the role verification
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/department/:path*'],
};