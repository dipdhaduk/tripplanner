import { getCurrentUser } from '@/lib/auth';
import { fail, ok, serverError } from '@/lib/http';
export async function GET() {
  try { const user = await getCurrentUser(); return user ? ok({ user }) : fail('Authentication required', 401); }
  catch (error) { return serverError(error); }
}
