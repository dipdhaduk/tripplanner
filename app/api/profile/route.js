import bcrypt from 'bcryptjs';
import { requireUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { bodyOf, fail, ok, serverError, validEmail } from '@/lib/http';

export async function GET() {
  try { const auth = await requireUser(); if (auth.error) return fail(auth.error, auth.status); return ok({ user: auth.user }); }
  catch (error) { return serverError(error); }
}
export async function PATCH(request) {
  try {
    const auth = await requireUser(); if (auth.error) return fail(auth.error, auth.status);
    const body = await bodyOf(request);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (name.length < 2 || name.length > 100 || !validEmail(email)) return fail('Enter a valid name and email address.');
    const db = await getDb();
    await db.collection('users').updateOne({ id: auth.user.id }, { $set: { name, email, updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ') } });
    const user = await db.collection('users').findOne({ id: auth.user.id }, { projection: { password: 0, _id: 0 } });
    return ok({ user }, 'Profile updated successfully');
  } catch (error) { if (error?.code === 11000) return fail('That email is already in use.', 409); return serverError(error); }
}
export async function PUT(request) {
  try {
    const auth = await requireUser(); if (auth.error) return fail(auth.error, auth.status);
    const body = await bodyOf(request);
    if (typeof body?.currentPassword !== 'string' || typeof body?.newPassword !== 'string' || body.newPassword.length < 8 || body.newPassword.length > 128) return fail('Enter your current password and a new password of at least 8 characters.');
    const db = await getDb();
    const row = await db.collection('users').findOne({ id: auth.user.id }, { projection: { password: 1 } });
    if (!row || !(await bcrypt.compare(body.currentPassword, row.password))) return fail('Current password is incorrect.', 401);
    const hash = await bcrypt.hash(body.newPassword, 12);
    await db.collection('users').updateOne({ id: auth.user.id }, { $set: { password: hash, updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ') } });
    return ok(null, 'Password changed successfully');
  } catch (error) { return serverError(error); }
}
