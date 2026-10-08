import { requireUser } from '@/lib/auth';
import { getDb, nextId, now } from '@/lib/db';
import { bodyOf, fail, ok, serverError, validDate } from '@/lib/http';

function values(body) {
  const tripId = Number(body?.trip_id); const day = Number(body?.day_number);
  const activity = typeof body?.activity === 'string' ? body.activity.trim() : '';
  const location = typeof body?.location === 'string' ? body.location.trim() : '';
  if (!Number.isSafeInteger(tripId) || tripId < 1 || !Number.isInteger(day) || day < 1 || day > 366) return 'Select a valid trip and day.';
  if (!activity || activity.length > 200 || location.length > 200) return 'Activity is required. Activity and location must be under 200 characters.';
  if (body.activity_date && !validDate(body.activity_date)) return 'Enter a valid activity date.';
  for (const time of [body.start_time, body.end_time]) if (time && !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) return 'Enter a valid activity time.';
  if (body.start_time && body.end_time && body.end_time < body.start_time) return 'End time cannot be before start time.';
  if (body.notes && (typeof body.notes !== 'string' || body.notes.length > 2000)) return 'Notes must be under 2,000 characters.';
  return { trip_id: tripId, day_number: day, activity, location: location || null, activity_date: body.activity_date || null, start_time: body.start_time || null, end_time: body.end_time || null, notes: body.notes?.trim() || null };
}
export async function POST(request) {
  try {
    const auth = await requireUser(); if (auth.error) return fail(auth.error, auth.status);
    const data = values(await bodyOf(request)); if (typeof data === 'string') return fail(data);
    const db = await getDb();
    if (!await db.collection('trips').findOne({ id: data.trip_id, user_id: auth.user.id }, { projection: { id: 1 } })) return fail('Trip not found.', 404);
    const item = { id: await nextId('itineraries'), ...data, created_at: now() };
    await db.collection('itineraries').insertOne(item);
    return ok({ itinerary: item }, 'Activity added successfully', 201);
  } catch (error) { return serverError(error); }
}
