import { requireUser } from '@/lib/auth';
import { cleanDocument, getDb, nextId, now } from '@/lib/db';
import { bodyOf, fail, ok, serverError, validDate } from '@/lib/http';

function validate(body) {
  const trip_name = typeof body?.trip_name === 'string' ? body.trip_name.trim() : '';
  const destination = typeof body?.destination === 'string' ? body.destination.trim() : '';
  const start_date = body?.start_date; const end_date = body?.end_date;
  const budget = body?.budget === '' || body?.budget == null ? 0 : Number(body.budget);
  if (!trip_name || trip_name.length > 120 || !destination || destination.length > 160) return 'Trip name and destination are required.';
  if (!validDate(start_date) || !validDate(end_date)) return 'Enter valid start and end dates.';
  if (end_date < start_date) return 'End date cannot be before start date.';
  if (!Number.isFinite(budget) || budget < 0 || budget > 999999999) return 'Budget must be a valid non-negative amount.';
  if (body.notes && (typeof body.notes !== 'string' || body.notes.length > 5000)) return 'Notes must be under 5,000 characters.';
  return { trip_name, destination, start_date, end_date, budget, notes: body.notes?.trim() || null };
}
export async function GET() {
  try {
    const auth = await requireUser(); if (auth.error) return fail(auth.error, auth.status);
    const db = await getDb();
    const trips = (await db.collection('trips').find({ user_id: auth.user.id }).sort({ start_date: 1 }).toArray()).map(cleanDocument);
    return ok({ trips });
  } catch (error) { return serverError(error); }
}
export async function POST(request) {
  try {
    const auth = await requireUser(); if (auth.error) return fail(auth.error, auth.status);
    const data = validate(await bodyOf(request)); if (typeof data === 'string') return fail(data);
    const db = await getDb(); const timestamp = now();
    const trip = { id: await nextId('trips'), user_id: auth.user.id, ...data, created_at: timestamp, updated_at: timestamp };
    await db.collection('trips').insertOne(trip);
    return ok({ trip }, 'Trip created successfully', 201);
  } catch (error) { return serverError(error); }
}
