import { requireAdmin } from '@/lib/auth';
import { cleanDocument, getDb } from '@/lib/db';
import { fail, ok, serverError } from '@/lib/http';
export async function GET(request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return fail(auth.error, auth.status);
    const p = new URL(request.url).searchParams; const page = Math.max(1, Number(p.get('page')) || 1); const limit = Math.min(100, Math.max(1, Number(p.get('limit')) || 20));
    const db = await getDb(); const col = db.collection('trips'); const total = await col.countDocuments();
    const trips = await col.aggregate([
      { $sort: { created_at: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'owner' } },
      { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, id: 1, user_id: 1, trip_name: 1, destination: 1, start_date: 1, end_date: 1, budget: 1, created_at: 1, owner_name: '$owner.name', owner_email: '$owner.email' } },
    ]).toArray();
    return ok({ trips, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) { return serverError(error); }
}
export async function DELETE(request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return fail(auth.error, auth.status);
    const id = Number(new URL(request.url).searchParams.get('id')); if (!Number.isSafeInteger(id) || id < 1) return fail('Provide a valid trip id.');
    const db = await getDb(); const result = await db.collection('trips').deleteOne({ id });
    if (!result.deletedCount) return fail('Trip not found.', 404);
    await db.collection('itineraries').deleteMany({ trip_id: id });
    return ok(null, 'Trip deleted successfully');
  } catch (error) { return serverError(error); }
}
