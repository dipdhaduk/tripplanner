import bcrypt from 'bcryptjs';
import { getDb, nextId, now } from '@/lib/db';
import { bodyOf, fail, ok, serverError, validEmail } from '@/lib/http';

export async function POST(request) {
  try {
    const body = await bodyOf(request);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = body?.password;
    if (name.length < 2 || name.length > 100) return fail('Name must be between 2 and 100 characters.');
    if (!validEmail(email)) return fail('Enter a valid email address.');
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) return fail('Password must be 8–128 characters.');
    const db = await getDb();
    const exists = await db.collection('users').findOne({ email }, { projection: { id: 1 } });
    if (exists) return fail('An account with this email already exists.', 409);
    const hash = await bcrypt.hash(password, 12);
    const id = await nextId('users');
    await db.collection('users').insertOne({ id, name, email, password: hash, role: 'USER', status: 'ACTIVE', created_at: now(), updated_at: now() });
    return ok({ id, name, email, role: 'USER' }, 'Account created successfully', 201);
  } catch (error) {
    if (error?.code === 11000) return fail('An account with this email already exists.', 409);
    return serverError(error);
  }
}
