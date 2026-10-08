import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { bodyOf, fail, ok, serverError } from '@/lib/http';
export async function GET() {
  try {
    const auth = await requireAdmin(); if (auth.error) return fail(auth.error, auth.status);
    const db = await getDb();
    const reviews = await db.collection('reviews').aggregate([
      { $sort: { created_at: -1 } }, { $limit: 100 }, { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'author' } },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, id: 1, rating: 1, review_text: 1, status: 1, created_at: 1, name: '$author.name', email: '$author.email' } },
    ]).toArray();
    return ok({ reviews });
  } catch (error) { return serverError(error); }
}
export async function PATCH(request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return fail(auth.error, auth.status);
    const body = await bodyOf(request); const id = Number(body?.id);
    if (!Number.isSafeInteger(id) || id < 1 || !['PUBLISHED', 'HIDDEN'].includes(body?.status)) return fail('Provide a valid review and status.');
    const result = await (await getDb()).collection('reviews').updateOne({ id }, { $set: { status: body.status } });
    if (!result.matchedCount) return fail('Review not found.', 404);
    return ok(null, 'Review visibility updated');
  } catch (error) { return serverError(error); }
}
