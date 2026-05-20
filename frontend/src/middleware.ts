import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get tokens from cookies
  const adminToken = request.cookies.get('admin_token')?.value;
  const memberToken = request.cookies.get('member_token')?.value;

  // Admin routes - require admin_token
  if (pathname.startsWith('/admin')) {
    // Admin login page - redirect to dashboard if already logged in
    if (pathname === '/admin/login' && adminToken) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Protected admin routes - require token
    if (pathname !== '/admin/login' && !adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Member routes - require member_token
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/dashboard' ||
    pathname === '/profile' ||
    pathname.startsWith('/organizations') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/announcements')
  ) {
    // Login/Register pages - redirect to dashboard if already logged in
    if ((pathname === '/login' || pathname === '/register') && memberToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Protected member routes - require token
    if (
      pathname !== '/login' &&
      pathname !== '/register' &&
      pathname !== '/forgot-password' &&
      !memberToken
    ) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|favicon.ico|public).*)',
  ],
};
