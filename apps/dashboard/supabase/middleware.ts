import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { afterSignupPath } from "@/lib/auth/after-signup.lib";
import { routing } from "@/i18n/routing";

/** "/en/orders" → { prefix: "/en", path: "/orders" }; "/orders" → { prefix: "", path: "/orders" }.
 * "/ar/…" gets an empty prefix: Arabic is unprefixed, so redirects go straight to the Arabic URL. */
function splitLocalePrefix(pathname: string): { prefix: string; path: string } {
  for (const locale of routing.locales) {
    const prefix = `/${locale}`;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return {
        prefix: locale === routing.defaultLocale ? "" : prefix,
        path: pathname.slice(prefix.length) || "/",
      };
    }
  }
  return { prefix: "", path: pathname };
}

/**
 * Refreshes the Supabase session on top of `response` (next-intl's rewrite or
 * pass-through from proxy.ts, or a plain NextResponse.next), so the locale
 * rewrite and headers survive alongside the auth cookies.
 */
export async function updateSession(request: NextRequest, response: NextResponse) {

  const isDevelopment = process.env.NODE_ENV === "development";
  const cookieDomain = isDevelopment
    ? "localhost"
    : `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;

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
          // Pages rendered for this request see the refreshed cookies, as
          // NextResponse.next({ request }) did before: the passed response
          // forwards the request headers, so update its copy of the cookie.
          const overridden = response.headers.get("x-middleware-override-headers");
          if (overridden !== null) {
            response.headers.set("x-middleware-request-cookie", request.cookies.toString());
            if (!overridden.split(",").includes("cookie")) {
              response.headers.set("x-middleware-override-headers", overridden ? `${overridden},cookie` : "cookie");
            }
          }

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              domain: cookieDomain,
              sameSite: isDevelopment ? "strict" : "lax",
              secure: !isDevelopment,
              httpOnly: !isDevelopment,
            })
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl;
  // Path checks use the path without its locale prefix; redirects keep the
  // English prefix the seller used (Arabic stays unprefixed).
  const { prefix, path } = splitLocalePrefix(url.pathname);

  // /signup works signed out (new account) and signed in (customer becoming a seller).
  // /roadmap is the public seller roadmap: anyone may read it; voting checks the seller server-side.
  const isPublic =
    path.startsWith("/login") ||
    path === "/signup" ||
    path.startsWith("/signup/") ||
    path === "/roadmap" ||
    path.startsWith("/.well-known/");
  if (!user && !isPublic) {
    const login = new URL(`${prefix}/login`, request.url);
    // MCP consent (F-29b): come back to the same authorize request after signing in.
    if (path === "/oauth/authorize") login.searchParams.set("next", `${path}${url.search}`);
    // The AI Store Builder's link (F-54): back to the chat after signing in.
    // A hero intake (F-82d) keeps its id; anything else in the query is dropped.
    if (path === "/ai-builder") login.searchParams.set("next", afterSignupPath(`${path}${url.search}`) ?? path);
    return NextResponse.redirect(login);
  }

  if (user && path.startsWith("/login")) {
    return NextResponse.redirect(new URL(prefix || "/", request.url));
  }

  return response;
}
