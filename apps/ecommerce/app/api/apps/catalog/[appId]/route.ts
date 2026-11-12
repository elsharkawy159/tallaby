import { type NextRequest, NextResponse } from "next/server";
import { CATALOG_CACHE_CONTROL, catalogAppResponseBody, corsHeaders } from "@/lib/apps/catalog-api.lib";

/** One app of the public App Center catalog, by id or slug: `{ version: 1, locale, app }`, or 404 (ROADMAP.md F-93). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const cors = corsHeaders(request.headers.get("origin"));
  const body = catalogAppResponseBody(appId, request.nextUrl.searchParams.get("locale"));
  if (!body) return NextResponse.json({ version: 1, error: "not_found" }, { status: 404, headers: { "Cache-Control": CATALOG_CACHE_CONTROL, ...cors } });
  return NextResponse.json(body, { headers: { "Cache-Control": CATALOG_CACHE_CONTROL, ...cors } });
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}
