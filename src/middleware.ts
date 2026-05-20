import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Define route classifications
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isDashboardPage = pathname.startsWith('/dashboard');

  // If trying to access dashboard but unauthenticated, redirect to login
  if (isDashboardPage && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and trying to access login/register, redirect to dashboard
  if (isAuthPage && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Allow navigation to continue
  return NextResponse.next();
}

// Map middleware to only run on protected application entry points
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
