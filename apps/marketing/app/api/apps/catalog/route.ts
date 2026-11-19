import { type NextRequest, NextResponse } from "next/server";
import { CATALOG_CACHE_CONTROL, catalogResponseBody, corsHeaders } from "@/lib/apps/catalog-api.lib";

/**
 * The public App Center catalog (ROADMAP.md F-93): `{ version: 1, locale, apps }`.
 * `?locale=ar|en` (Arabic by default). Read-only, no auth, no store data.
 * See docs/apps-platform.md.
 */
export function GET(request: NextRequest) {
  const body = catalogResponseBody(request.nextUrl.searchParams.get("locale"));
  return NextResponse.json(body, {
    headers: { "Cache-Control": CATALOG_CACHE_CONTROL, ...corsHeaders(request.headers.get("origin")) },
  });
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}
