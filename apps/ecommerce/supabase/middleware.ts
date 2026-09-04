import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

/** Strips a leading `/ar` (or any configured non-default locale) prefix so
 * path checks below work the same under both `/onboarding` and `/ar/onboarding`. */
function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

/**
 * Runs Supabase session refresh on top of an existing response (produced by
 * next-intl's middleware in proxy.ts), so the locale rewrite/headers survive
 * alongside the auth cookies. Uses the getAll/setAll cookie adapter so cookies
 * are layered onto `response` in place instead of replacing it.
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
          const hostname = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
          const isDevelopment = process.env.NODE_ENV === "development";
          const cookieDomain = isDevelopment ? null : `.${hostname}`;
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = stripLocalePrefix(request.nextUrl.pathname);
  const localePrefix = pathname === request.nextUrl.pathname
    ? ""
    : request.nextUrl.pathname.slice(0, request.nextUrl.pathname.length - pathname.length);

  function redirectWithinLocale(targetPathname: string, extra?: (url: URL) => void) {
    const url = request.nextUrl.clone();
    url.pathname = `${localePrefix}${targetPathname}`;
    extra?.(url);
    const redirectResponse = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  // Redirect authenticated sellers from /onboarding to dashboard
  if (user && pathname === "/onboarding" && user?.user_metadata?.is_seller) {
    return NextResponse.redirect("https://dashboard.tallaby.com/");
  }

  // Redirect authenticated users away from login page
  if (user && pathname === "/auth") {
    return redirectWithinLocale("/");
  }

  // Redirect unauthenticated users without a guest session away from profile
  if (!user && pathname.startsWith("/profile") && !pathname.startsWith("/error")) {
    const hasGuestSession = Boolean(request.cookies.get("guest_uid")?.value);

    if (!hasGuestSession) {
      return redirectWithinLocale("/auth", (url) => {
        url.searchParams.set("redirect", pathname);
      });
    }
  }

  // IMPORTANT: You *must* return the response object as it is (aside from
  // the cookie mutations above). If you're creating a new response object
  // make sure to carry over the cookies, or you may break the user's session.

  return response;
}
