import { type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "./supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  return updateSession(request, response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (route handlers under app/api/, including OAuth callback and
     *   server-to-server webhooks — locale routing must not intercept these
     *   or they 404 instead of running their handlers)
     * - sitemap.xml, robots.txt, manifest.webmanifest (top-level metadata
     *   route handlers outside app/[locale]/ — locale routing must not
     *   intercept these or they 404 instead of returning their content)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
