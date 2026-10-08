import { NextResponse } from 'next/server';

function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (parsed.exp && parsed.exp * 1000 < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function proxy(request) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('tripplanner_session')?.value;
  const claims = decodeJwtPayload(token);
  const hasSession = Boolean(claims);

  if ((path === '/dashboard' || path.startsWith('/trips') || path === '/profile' || path.startsWith('/admin')) && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (path.startsWith('/admin') && claims?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if ((path === '/login' || path === '/register') && hasSession) {
    return NextResponse.redirect(new URL(claims?.role === 'ADMIN' ? '/admin' : '/dashboard', request.url));
  }
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/dashboard/:path*', '/trips/:path*', '/profile/:path*', '/admin/:path*', '/login', '/register'],
};
