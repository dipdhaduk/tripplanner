import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getDb, cleanDocument } from '@/lib/db';

export const COOKIE_NAME = 'tripplanner_session';
export function signToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '2h' });
}
export function verifyToken(token) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.verify(token, process.env.JWT_SECRET);
}
export async function getCurrentUser() {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    const db = await getDb();
    const user = cleanDocument(await db.collection('users').findOne({ id: Number(payload.id) }, { projection: { password: 0 } }));
    return user?.status === 'ACTIVE' ? user : null;
  } catch { return null; }
}
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Authentication required', status: 401 };
  return { user };
}
export async function requireAdmin() {
  const result = await requireUser();
  if (result.error) return result;
  if (result.user.role !== 'ADMIN') return { error: 'Administrator access required', status: 403 };
  return result;
}
