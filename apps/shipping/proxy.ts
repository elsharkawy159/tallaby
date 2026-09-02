import { type NextRequest } from 'next/server';
import { updateSession } from './supabase/middleware';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/revalidate (server-to-server cache invalidation webhook —
     *   authenticated by its own shared secret, not a user session)
     * - api/automation (order-automation webhook posted by a database
     *   trigger through pg_net — likewise secret-authenticated, and there is
     *   no session to redirect to /login)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/revalidate|api/automation|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};