import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

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
          response = NextResponse.next({
            request,
          });

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
  const path = url.pathname;

  // /signup works signed out (new account) and signed in (customer becoming a seller).
  // /roadmap is the public seller roadmap: anyone may read it; voting checks the seller server-side.
  const isPublic =
    path.startsWith("/login") ||
    path === "/signup" ||
    path.startsWith("/signup/") ||
    path === "/roadmap" ||
    path.startsWith("/.well-known/");
  if (!user && !isPublic) {
    const login = new URL("/login", request.url);
    // MCP consent (F-29b): come back to the same authorize request after signing in.
    if (path === "/oauth/authorize") login.searchParams.set("next", `${path}${url.search}`);
    return NextResponse.redirect(login);
  }

  if (user && path.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}
