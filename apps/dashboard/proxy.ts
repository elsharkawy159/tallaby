import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/supabase/middleware";
import { LOCALE_COOKIE, defaultLocale, resolveLocale } from "@/i18n/config";

export async function proxy(request: NextRequest) {
  // Run your session logic first

  // if (
  //   process.env.NEXT_PUBLIC_MAINTENANCE_MODE &&
  //   request.nextUrl.pathname !== "/maintenance"
  // ) {
  //   return NextResponse.redirect(new URL("/maintenance", request.url));
  // }

  const response = await updateSession(request);

  // Arabic is the default; only an explicit choice (the language switcher)
  // changes it. Missing or unknown values are reset to the default.
  const localeFromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (resolveLocale(localeFromCookie) !== localeFromCookie) {
    response.cookies.set(LOCALE_COOKIE, defaultLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.png|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
