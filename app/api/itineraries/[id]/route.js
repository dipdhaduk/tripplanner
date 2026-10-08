import { requireUser } from '@/lib/auth';
import { cleanDocument, getDb } from '@/lib/db';
import { bodyOf, fail, ok, serverError, validDate } from '@/lib/http';

function parseId(value) { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null; }
export async function PUT(request, { params }) {
  try {
    const auth = await requireUser(); if (auth.error) return fail(auth.error, auth.status);
    const id = parseId((await params).id); if (!id) return fail('Activity not found.', 404);
    const db = await getDb();
    const item = await db.collection('itineraries').findOne({ id });
    if (!item || !await db.collection('trips').findOne({ id: item.trip_id, user_id: auth.user.id }, { projection: { id: 1 } })) return fail('Activity not found.', 404);
    const body = await bodyOf(request); const tripId = Number(body?.trip_id || item.trip_id); const day = Number(body?.day_number);
    const activity = typeof body?.activity === 'string' ? body.activity.trim() : ''; const location = typeof body?.location === 'string' ? body.location.trim() : '';
    if (!Number.isSafeInteger(tripId) || !Number.isInteger(day) || day < 1 || day > 366 || !activity || activity.length > 200 || location.length > 200) return fail('Enter a valid activity, location, trip, and day.');
    if (body.activity_date && !validDate(body.activity_date)) return fail('Enter a valid activity date.');
    for (const time of [body.start_time, body.end_time]) if (time && !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) return fail('Enter a valid activity time.');
    if (body.start_time && body.end_time && body.end_time < body.start_time) return fail('End time cannot be before start time.');
    if (body.notes && (typeof body.notes !== 'string' || body.notes.length > 2000)) return fail('Notes must be under 2,000 characters.');
    if (!await db.collection('trips').findOne({ id: tripId, user_id: auth.user.id }, { projection: { id: 1 } })) return fail('Trip not found.', 404);
    const update = { trip_id: tripId, day_number: day, activity, location: location || null, activity_date: body.activity_date || null, start_time: body.start_time || null, end_time: body.end_time || null, notes: body.notes?.trim() || null };
    const result = await db.collection('itineraries').findOneAndUpdate({ id }, { $set: update }, { returnDocument: 'after' });
    return ok({ itinerary: cleanDocument(result?.value || result) }, 'Activity updated successfully');
  } catch (error) { return serverError(error); }
}
export async function DELETE(request, { params }) {
  try {
    const auth = await requireUser(); if (auth.error) return fail(auth.error, auth.status);
    const id = parseId((await params).id); if (!id) return fail('Activity not found.', 404);
    const db = await getDb(); const item = await db.collection('itineraries').findOne({ id });
    if (!item || !await db.collection('trips').findOne({ id: item.trip_id, user_id: auth.user.id }, { projection: { id: 1 } })) return fail('Activity not found.', 404);
    await db.collection('itineraries').deleteOne({ id });
    return ok(null, 'Activity deleted successfully');
  } catch (error) { return serverError(error); }
}
