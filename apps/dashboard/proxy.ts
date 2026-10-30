import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/supabase/middleware";
import { LOCALE_COOKIE, defaultLocale, resolveLocale } from "@/i18n/config";
import { REFERRAL_COOKIE, referralCookieOptions, referralCookieToSet } from "@workspace/lib/referrals";

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

  // Affiliate link (F-37): remember ?ref= for 60 days; the first link wins.
  const referral = referralCookieToSet(request.nextUrl.searchParams.get("ref"), request.cookies.get(REFERRAL_COOKIE)?.value);
  if (referral) response.cookies.set(REFERRAL_COOKIE, referral, referralCookieOptions(process.env.REFERRAL_COOKIE_DOMAIN));

  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.png|robots.txt|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
