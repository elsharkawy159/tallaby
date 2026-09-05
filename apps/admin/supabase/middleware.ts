import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getAdminAuthCookieOptions,
  mergeAdminAuthCookieOptions,
} from "./auth-cookie-options";
import { createTimeoutFetch } from "./fetch-with-timeout";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getAdminAuthCookieOptions(),
      global: { fetch: createTimeoutFetch() },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              mergeAdminAuthCookieOptions(options),
            ),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const isPublicPath =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/error");

  // Both Supabase calls below are bounded by createTimeoutFetch, but a
  // timeout still rejects the promise — without this try/catch, an
  // unreachable/slow Supabase project turned every navigation into an
  // uncaught rejection (Next's generic error page) instead of a redirect.
  // Fail closed: any auth-check failure is treated like "no session".
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] =
    null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error("[admin-auth] auth.getUser() failed:", error);
  }

  if (!user && !isPublicPath) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Previously this only checked that SOME Supabase session existed — any
  // authenticated marketplace user (a customer, a seller) could reach the
  // entire admin app. Mirrors the role check in
  // apps/admin/lib/auth/admin-auth.ts:getCurrentAdminUser, duplicated here
  // (rather than imported) because middleware/proxy cannot use Drizzle —
  // it runs the lightweight supabase-js client only.
  if (user && !isPublicPath) {
    let isAdmin = false;
    try {
      // PostgREST queries the literal column name — the real column is
      // is_verified (snake_case), not isVerified. The unaliased select
      // matched nothing, so `profile.isVerified` was always undefined and
      // every login (including a real admin) was redirected as forbidden.
      const { data: profile } = await supabase
        .from("users")
        .select("role, isVerified:is_verified")
        .eq("id", user.id)
        .single();

      const adminRoles = ["admin", "super_admin", "moderator"];
      isAdmin = Boolean(
        profile && adminRoles.includes(profile.role) && profile.isVerified,
      );
    } catch (error) {
      console.error("[admin-auth] admin profile lookup failed:", error);
    }

    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
