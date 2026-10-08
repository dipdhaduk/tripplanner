import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { bodyOf, fail, ok, serverError } from '@/lib/http';
export async function GET() {
  try {
    const auth = await requireAdmin(); if (auth.error) return fail(auth.error, auth.status);
    const messages = await (await getDb()).collection('contact_messages').find({}, { projection: { _id: 0 } }).sort({ created_at: -1 }).limit(100).toArray();
    return ok({ messages });
  } catch (error) { return serverError(error); }
}
export async function PATCH(request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return fail(auth.error, auth.status);
    const body = await bodyOf(request); const id = Number(body?.id);
    if (!Number.isSafeInteger(id) || id < 1 || !['NEW', 'READ', 'CLOSED'].includes(body?.status)) return fail('Provide a valid message and status.');
    const result = await (await getDb()).collection('contact_messages').updateOne({ id }, { $set: { status: body.status } });
    if (!result.matchedCount) return fail('Message not found.', 404);
    return ok(null, 'Contact message status updated');
  } catch (error) { return serverError(error); }
}
