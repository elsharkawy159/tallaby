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
     * - manifest.webmanifest (PWA manifest — must load before login)
     * - sw.js (push service worker, F-06e)
     * - api/cron/ (dispatchers, authenticated by CRON_SECRET)
     * - api/revalidate (server-to-server cache invalidation webhook —
     *   authenticated by its own shared secret, not a user session)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|api/revalidate|api/cron/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};