import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Run your session logic first

  // if (
  //   process.env.NEXT_PUBLIC_MAINTENANCE_MODE &&
  //   request.nextUrl.pathname !== "/maintenance"
  // ) {
  //   return NextResponse.redirect(new URL("/maintenance", request.url));
  // }

  const response = await updateSession(request);

  // Try to get locale from cookie or header
  const localeFromCookie = request.cookies.get("locale")?.value;
  const localeFromHeader = request.headers
    .get("accept-language")
    ?.split(",")[0]
    ?.split("-")[0];

  const locale = localeFromCookie || localeFromHeader || "en";

  // Set the locale cookie if it's not already set
  if (!localeFromCookie) {
    response.cookies.set("locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
