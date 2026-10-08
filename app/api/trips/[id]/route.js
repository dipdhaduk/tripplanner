import { requireUser } from '@/lib/auth';
import { cleanDocument, getDb, now } from '@/lib/db';
import { bodyOf, fail, ok, serverError, validDate } from '@/lib/http';

function validId(value) { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null; }
function validate(body) {
  const trip_name = typeof body?.trip_name === 'string' ? body.trip_name.trim() : '';
  const destination = typeof body?.destination === 'string' ? body.destination.trim() : '';
  const start_date = body?.start_date; const end_date = body?.end_date;
  const budget = body?.budget === '' || body?.budget == null ? 0 : Number(body.budget);
  if (!trip_name || trip_name.length > 120 || !destination || destination.length > 160) return 'Trip name and destination are required.';
  if (!validDate(start_date) || !validDate(end_date) || end_date < start_date) return 'Enter valid dates. End date cannot be before start date.';
  if (!Number.isFinite(budget) || budget < 0 || budget > 999999999) return 'Budget must be a valid non-negative amount.';
  if (body.notes && (typeof body.notes !== 'string' || body.notes.length > 5000)) return 'Notes must be under 5,000 characters.';
  return { trip_name, destination, start_date, end_date, budget, notes: body.notes?.trim() || null };
}
export async function GET(request, { params }) {
  try {
    const auth = await requireUser(); if (auth.error) return fail(auth.error, auth.status);
    const id = validId((await params).id); if (!id) return fail('Trip not found.', 404);
    const db = await getDb();
    const trip = cleanDocument(await db.collection('trips').findOne({ id, user_id: auth.user.id }));
    if (!trip) return fail('Trip not found.', 404);
    const itinerary = (await db.collection('itineraries').find({ trip_id: id }).sort({ day_number: 1, start_time: 1, id: 1 }).toArray()).map(cleanDocument);
    return ok({ trip, itinerary });
  } catch (error) { return serverError(error); }
}
export async function PUT(request, { params }) {
  try {
    const auth = await requireUser(); if (auth.error) return fail(auth.error, auth.status);
    const id = validId((await params).id); if (!id) return fail('Trip not found.', 404);
    const data = validate(await bodyOf(request)); if (typeof data === 'string') return fail(data);
    const db = await getDb();
    const result = await db.collection('trips').findOneAndUpdate({ id, user_id: auth.user.id }, { $set: { ...data, updated_at: now() } }, { returnDocument: 'after' });
    const trip = result && (result.value || result);
    if (!trip) return fail('Trip not found.', 404);
    return ok({ trip: cleanDocument(trip) }, 'Trip updated successfully');
  } catch (error) { return serverError(error); }
}
export async function DELETE(request, { params }) {
  try {
    const auth = await requireUser(); if (auth.error) return fail(auth.error, auth.status);
    const id = validId((await params).id); if (!id) return fail('Trip not found.', 404);
    const db = await getDb();
    const result = await db.collection('trips').deleteOne({ id, user_id: auth.user.id });
    if (!result.deletedCount) return fail('Trip not found.', 404);
    await db.collection('itineraries').deleteMany({ trip_id: id });
    return ok(null, 'Trip deleted successfully');
  } catch (error) { return serverError(error); }
}
