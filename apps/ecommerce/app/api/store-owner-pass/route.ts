import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import {
  STORE_OWNER_PASS_COOKIE,
  STORE_OWNER_PASS_LINK_TTL_SECONDS,
  signStoreOwnerPass,
  verifyStoreOwnerPass,
} from "@workspace/lib/store-sites/owner-pass";
import { storePreviewSecret } from "@workspace/lib/store-sites/preview";
import { getRequestSiteUrl, getRequestStoreSubdomain, getStorefrontBySubdomain } from "@/lib/storefront.server";

export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};

/** Only a path on this host: "/products/x", never "//evil.com" or a full URL. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value.slice(0, 512);
}

/**
 * The seller's private pass to a store that isn't activated yet (ROADMAP.md
 * F-76). The dashboard's "View store" link opens `/api/store-owner-pass?token=…`
 * on the store's own address (subdomain or verified custom domain) with a
 * 10-minute signed link for ONE store and its seller. It must verify for the
 * store of THIS host and that store's seller; then a fresh 30-day pass goes into
 * an httpOnly cookie on this host, and every storefront request re-verifies it
 * (lib/store-site/activation.server.ts). The link itself is never kept. Without
 * STORE_PREVIEW_SECRET this does nothing (fails closed).
 */
export async function GET(request: NextRequest) {
  const origin = await getRequestSiteUrl();
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const secret = storePreviewSecret();
  const subdomain = await getRequestStoreSubdomain();
  const store = subdomain ? await getStorefrontBySubdomain(subdomain) : null;
  // Never an error page: a bad or old link just opens the store as anyone sees it.
  if (!secret || !store) return NextResponse.redirect(`${origin}${next}`, { status: 303, headers: NO_STORE });

  const now = Date.now();
  const link = verifyStoreOwnerPass(request.nextUrl.searchParams.get("token"), {
    secret,
    storeId: store.storeId,
    sellerId: store.id,
    now,
  });
  // The link is short-lived; a leaked one stops working after a few minutes.
  const fresh = link.ok && link.expiresAt - Math.floor(now / 1000) <= STORE_OWNER_PASS_LINK_TTL_SECONDS;
  if (fresh) {
    const pass = signStoreOwnerPass({ storeId: store.storeId, sellerId: store.id, secret, now });
    (await cookies()).set(STORE_OWNER_PASS_COOKIE, pass.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(1, pass.expiresAt - Math.floor(now / 1000)),
    });
  }
  return NextResponse.redirect(`${origin}${next}`, { status: 303, headers: NO_STORE });
}
