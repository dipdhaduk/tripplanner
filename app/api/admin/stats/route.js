import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { fail, ok, serverError } from '@/lib/http';
export async function GET() {
  try {
    const auth = await requireAdmin(); if (auth.error) return fail(auth.error, auth.status);
    const db = await getDb(); const users = db.collection('users'); const trips = db.collection('trips');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const [totalUsers, activeUsers, newUsersLast30Days, totalTrips, upcomingTrips, completedTrips, publishedReviews] = await Promise.all([
      users.countDocuments(), users.countDocuments({ status: 'ACTIVE' }), users.countDocuments({ created_at: { $gte: thirtyDaysAgo } }),
      trips.countDocuments(), trips.countDocuments({ end_date: { $gte: today } }), trips.countDocuments({ end_date: { $lt: today } }),
      db.collection('reviews').countDocuments({ status: 'PUBLISHED' }),
    ]);
    return ok({ stats: { totalUsers, activeUsers, newUsersLast30Days, totalTrips, upcomingTrips, completedTrips, publishedReviews } });
  } catch (error) { return serverError(error); }
}
