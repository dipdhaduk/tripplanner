import { requireUser } from '@/lib/auth';
import { getDb, nextId, now } from '@/lib/db';
import { bodyOf, fail, ok, serverError } from '@/lib/http';

export async function GET() {
  try {
    const db = await getDb();
    const reviews = await db.collection('reviews').aggregate([
      { $match: { status: 'PUBLISHED' } }, { $sort: { created_at: -1 } }, { $limit: 50 },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'author' } },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, id: 1, rating: 1, review_text: 1, created_at: 1, name: '$author.name' } },
    ]).toArray();
    const [summary] = await db.collection('reviews').aggregate([
      { $match: { status: 'PUBLISHED' } }, { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } },
    ]).toArray();
    return ok({ reviews, summary: { count: summary?.count || 0, average: summary?.average || 0 } });
  } catch (error) { return serverError(error); }
}
export async function POST(request) {
  try {
    const auth = await requireUser(); if (auth.error) return fail(auth.error, auth.status);
    const body = await bodyOf(request); const rating = Number(body?.rating); const review_text = typeof body?.review_text === 'string' ? body.review_text.trim() : '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail('Choose a rating from 1 to 5.');
    if (review_text.length < 10 || review_text.length > 1200) return fail('Review must be between 10 and 1,200 characters.');
    const db = await getDb(); const review = { id: await nextId('reviews'), user_id: auth.user.id, rating, review_text, status: 'PUBLISHED', created_at: now() };
    await db.collection('reviews').insertOne(review);
    return ok({ review: { id: review.id, rating, review_text, created_at: review.created_at, name: auth.user.name } }, 'Thanks for sharing your experience', 201);
  } catch (error) { return serverError(error); }
}
