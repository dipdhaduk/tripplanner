import { getDb, nextId, now } from '@/lib/db';
import { bodyOf, fail, ok, serverError, validEmail } from '@/lib/http';

export async function POST(request) {
  try {
    const body = await bodyOf(request);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (name.length < 2 || name.length > 100) return fail('Name must be between 2 and 100 characters.');
    if (!validEmail(email)) return fail('Enter a valid email address.');
    if (subject.length < 3 || subject.length > 160) return fail('Subject must be between 3 and 160 characters.');
    if (message.length < 10 || message.length > 4000) return fail('Message must be between 10 and 4,000 characters.');
    const db = await getDb(); const id = await nextId('contact_messages');
    await db.collection('contact_messages').insertOne({ id, name, email, subject, message, status: 'NEW', created_at: now() });
    return ok({ id }, 'Your message has been sent. We will get back to you soon.', 201);
  } catch (error) { return serverError(error); }
}
