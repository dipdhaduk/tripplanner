import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Fast navigation guard only. APIs always verify the JWT, current account status, role and ownership.
export function proxy(request) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('tripplanner_session')?.value;
  let claims = null;
  try { if (token && process.env.JWT_SECRET) claims = jwt.verify(token, process.env.JWT_SECRET); } catch { claims = null; }
  const hasSession = Boolean(claims);
  if ((path === '/dashboard' || path.startsWith('/trips') || path === '/profile' || path.startsWith('/admin')) && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (path.startsWith('/admin') && claims?.role !== 'ADMIN') return NextResponse.redirect(new URL('/dashboard', request.url));
  if ((path === '/login' || path === '/register') && hasSession) return NextResponse.redirect(new URL(claims.role === 'ADMIN' ? '/admin' : '/dashboard', request.url));
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*', '/trips/:path*', '/profile/:path*', '/admin/:path*', '/login', '/register'] };
