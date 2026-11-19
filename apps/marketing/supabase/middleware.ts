import { createServerClient } from "@supabase/ssr";
import { type NextRequest, type NextResponse } from "next/server";
import { cookieDomainForHost } from "@workspace/lib/storefront/cookie-domain";

/**
 * Runs Supabase session refresh on top of an existing response (produced by
 * next-intl's middleware in proxy.ts), so the locale rewrite/headers survive
 * alongside the auth cookies. Uses the getAll/setAll cookie adapter so cookies
 * are layered onto `response` in place instead of replacing it.
 *
 * Same cookie rule as apps/ecommerce/supabase/middleware.ts (the session is
 * shared on `.tallaby.com` with the dashboard). The /onboarding, /auth and
 * /profile redirects there are storefront pages this app does not serve.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          const isDevelopment = process.env.NODE_ENV === "development";
          const cookieDomain = cookieDomainForHost(request.headers.get("host"));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              ...(cookieDomain ? { domain: cookieDomain } : {}),
              sameSite: "lax",
              secure: !isDevelopment,
            })
          );
        },
      },
    }
  );
  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  await supabase.auth.getUser();

  // IMPORTANT: You *must* return the response object as it is (aside from
  // the cookie mutations above).
  return response;
}
