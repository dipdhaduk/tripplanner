import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { COOKIE_NAME, signToken } from '@/lib/auth';
import { bodyOf, fail, ok, serverError, validEmail } from '@/lib/http';

export async function POST(request) {
  try {
    const body = await bodyOf(request);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!validEmail(email) || typeof body?.password !== 'string') return fail('Enter a valid email and password.');
    const db = await getDb();
    const user = await db.collection('users').findOne({ email });
    if (!user || !(await bcrypt.compare(body.password, user.password))) return fail('Invalid email or password.', 401);
    if (user.status !== 'ACTIVE') return fail('This account has been disabled. Contact an administrator.', 403);
    const token = signToken(user);
    const jar = await cookies();
    const expiresAt = jwt.decode(token)?.exp || Math.floor(Date.now() / 1000) + 7200;
    jar.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: Math.max(1, expiresAt - Math.floor(Date.now() / 1000)) });
    return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 'Login successful');
  } catch (error) { return serverError(error); }
}
