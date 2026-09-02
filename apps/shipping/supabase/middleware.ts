import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/login", "/auth", "/error"];

const isPublicPath = (pathname: string) =>
  PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

const forbidden = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("error", "forbidden");
  return NextResponse.redirect(url);
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and supabase.auth.getUser().
  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // supabase-js goes through PostgREST, which queries literal column names —
  // the real columns are snake_case. An unaliased camelCase selector matches no
  // column and silently yields undefined, which previously locked every real
  // admin out of apps/admin. Keep the alias:column form.
  const { data: profile } = await supabase
    .from("users")
    .select("role, isVerified:is_verified, isSuspended:is_suspended")
    .eq("id", user.id)
    .single();

  if (!profile || profile.isSuspended) {
    return forbidden(request);
  }

  const isRiderOnlyPath =
    pathname === "/rider" || pathname.startsWith("/rider/");

  if (profile.role === "driver") {
    if (pathname === "/rider") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/rider";
      return NextResponse.rewrite(url);
    }

    // Riders only ever see their own deliveries.
    if (!isRiderOnlyPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (profile.role === "admin") {
    if (!profile.isVerified) {
      return forbidden(request);
    }
    if (isRiderOnlyPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Customers, sellers, support — no business in the shipping app.
  return forbidden(request);
}
