import { cookies, draftMode } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import {
  STORE_PREVIEW_COOKIE,
  storePreviewSecret,
  verifyStorePreviewToken,
} from "@workspace/lib/store-sites/preview";
import { getRequestSiteUrl, getRequestStoreSubdomain, getStorefrontBySubdomain } from "@/lib/storefront.server";

export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

function refuse(status: number, message: string) {
  return new NextResponse(message, { status, headers: { ...NO_STORE, "Content-Type": "text/plain; charset=utf-8" } });
}

/**
 * Starts "Preview on my store" (PLAN.md P4-08) on a store host. The dashboard
 * opens `/api/store-preview?token=…` on the store's own address; the token
 * must verify for the store of THIS host (a token for store A is refused on
 * B's host). On success Draft Mode is turned on and the token is kept in an
 * httpOnly cookie on this host until it expires; every storefront request
 * re-verifies it (lib/store-site/preview.server.ts). Without
 * STORE_PREVIEW_SECRET the endpoint does nothing (fails closed).
 */
export async function GET(request: NextRequest) {
  const secret = storePreviewSecret();
  if (!secret) return refuse(404, "Not found");

  const subdomain = await getRequestStoreSubdomain();
  const store = subdomain ? await getStorefrontBySubdomain(subdomain) : null;
  if (!store) return refuse(404, "Not found");

  const token = request.nextUrl.searchParams.get("token");
  const verified = verifyStorePreviewToken(token, { secret, storeId: store.storeId });
  if (!verified.ok) {
    return refuse(403, "This preview link has expired or is not for this store. Open a new preview from your dashboard.");
  }

  (await draftMode()).enable();
  (await cookies()).set(STORE_PREVIEW_COOKIE, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(1, verified.expiresAt - Math.floor(Date.now() / 1000)),
  });

  const origin = await getRequestSiteUrl();
  return NextResponse.redirect(`${origin}/`, { status: 303, headers: NO_STORE });
}

/** Leaves the preview (the banner's "Exit preview" form). */
export async function POST() {
  (await draftMode()).disable();
  (await cookies()).delete(STORE_PREVIEW_COOKIE);
  const origin = await getRequestSiteUrl();
  return NextResponse.redirect(`${origin}/`, { status: 303, headers: NO_STORE });
}
