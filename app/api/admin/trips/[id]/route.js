import { requireAdmin } from '@/lib/auth';
import { cleanDocument, getDb } from '@/lib/db';
import { fail, ok, serverError } from '@/lib/http';
export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin(); if (auth.error) return fail(auth.error, auth.status);
    const id = Number((await params).id); if (!Number.isSafeInteger(id) || id < 1) return fail('Trip not found.', 404);
    const db = await getDb();
    const trip = await db.collection('trips').aggregate([
      { $match: { id } }, { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'owner' } }, { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, id: 1, user_id: 1, trip_name: 1, destination: 1, start_date: 1, end_date: 1, budget: 1, notes: 1, owner_name: '$owner.name', owner_email: '$owner.email' } },
    ]).next();
    if (!trip) return fail('Trip not found.', 404);
    const itinerary = (await db.collection('itineraries').find({ trip_id: id }).sort({ day_number: 1, start_time: 1, id: 1 }).toArray()).map(cleanDocument);
    return ok({ trip, itinerary });
  } catch (error) { return serverError(error); }
}
