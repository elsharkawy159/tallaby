import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COUNTRY = /^[A-Z]{2}$/;

/**
 * The visitor's country from Vercel's IP header, for tallaby.com's plan cards
 * to show prices in the local currency (the pages stay static; the cards ask
 * this once per session). Outside production `?country=SA` stands in for the
 * header, so the swap can be tried locally. Nothing else about the visitor
 * leaves this route.
 */
export function GET(request: NextRequest) {
  const override = process.env.NODE_ENV !== "production" ? request.nextUrl.searchParams.get("country") : null;
  const raw = (override ?? request.headers.get("x-vercel-ip-country") ?? "").toUpperCase();
  return NextResponse.json(
    { country: COUNTRY.test(raw) ? raw : null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
