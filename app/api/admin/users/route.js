import { requireAdmin } from '@/lib/auth';
import { cleanDocument, getDb } from '@/lib/db';
import { bodyOf, fail, ok, serverError } from '@/lib/http';
export async function GET(request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return fail(auth.error, auth.status);
    const p = new URL(request.url).searchParams; const page = Math.max(1, Number(p.get('page')) || 1); const limit = Math.min(100, Math.max(1, Number(p.get('limit')) || 20));
    const db = await getDb(); const col = db.collection('users'); const total = await col.countDocuments();
    const users = (await col.find({}, { projection: { password: 0 } }).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).toArray()).map(cleanDocument);
    return ok({ users, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) { return serverError(error); }
}
export async function PATCH(request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return fail(auth.error, auth.status);
    const body = await bodyOf(request); const id = Number(body?.id);
    if (!Number.isSafeInteger(id) || id < 1 || !['ACTIVE', 'DISABLED'].includes(body?.status)) return fail('Provide a valid user and account status.');
    if (id === auth.user.id && body.status === 'DISABLED') return fail('You cannot disable your own account.');
    const result = await (await getDb()).collection('users').updateOne({ id }, { $set: { status: body.status } });
    if (!result.matchedCount) return fail('User not found.', 404);
    return ok(null, 'User status updated successfully');
  } catch (error) { return serverError(error); }
}
export async function DELETE(request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return fail(auth.error, auth.status);
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isSafeInteger(id) || id < 1) return fail('Provide a valid user id.');
    if (id === auth.user.id) return fail('You cannot delete your own account.');
    const db = await getDb(); const result = await db.collection('users').deleteOne({ id });
    if (!result.deletedCount) return fail('User not found.', 404);
    const trips = await db.collection('trips').find({ user_id: id }, { projection: { id: 1 } }).toArray();
    const tripIds = trips.map((trip) => trip.id);
    await Promise.all([db.collection('trips').deleteMany({ user_id: id }), db.collection('reviews').deleteMany({ user_id: id }), db.collection('itineraries').deleteMany({ trip_id: { $in: tripIds } })]);
    return ok(null, 'User deleted successfully');
  } catch (error) { return serverError(error); }
}
