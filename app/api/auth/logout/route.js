import { cookies } from 'next/headers';
import { COOKIE_NAME } from '@/lib/auth';
import { ok, serverError } from '@/lib/http';

export async function POST() {
  try {
    const jar = await cookies();
    jar.delete(COOKIE_NAME);
    jar.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    });
    return ok(null, 'Logged out successfully');
  } catch (error) {
    return serverError(error);
  }
}
