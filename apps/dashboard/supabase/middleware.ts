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

  if (!user && !path.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && path.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}
