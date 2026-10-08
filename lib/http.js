import { NextResponse } from 'next/server';
export function ok(data, message = 'Request completed successfully', status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}
export function fail(message, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}
export function serverError(error) {
  console.error('TripPlanner API error:', error?.message || 'Unknown error');
  return fail('Something went wrong. Please try again.', 500);
}
export async function bodyOf(request) {
  try { return await request.json(); } catch { return null; }
}
export function validEmail(email) { return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
