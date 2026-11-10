import { type NextRequest, NextResponse } from "next/server";
import { requestCountry } from "@/lib/marketing/visitor-country.lib";

export const dynamic = "force-dynamic";

/**
 * The visitor's country from Vercel's IP header, for tallaby.com's prices to
 * show in the local currency (the pages stay static). Pages read it from the
 * proxy's `Server-Timing: geo` first; this route is the fallback, asked once
 * per session. Outside production `?country=SA` stands in for the header, so
 * the swap can be tried locally. Nothing else about the visitor leaves this route.
 */
export function GET(request: NextRequest) {
  const country = requestCountry({
    header: request.headers.get("x-vercel-ip-country"),
    override: request.nextUrl.searchParams.get("country"),
    production: process.env.NODE_ENV === "production",
  });
  return NextResponse.json({ country }, { headers: { "Cache-Control": "private, no-store" } });
}
