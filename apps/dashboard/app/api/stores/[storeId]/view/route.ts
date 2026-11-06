import { type NextRequest, NextResponse } from "next/server";
import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { STORE_OWNER_PASS_LINK_TTL_SECONDS, signStoreOwnerPass } from "@workspace/lib/store-sites/owner-pass";
import { storePreviewSecret } from "@workspace/lib/store-sites/preview";
import { isAccessError, loadOrderLock, requireStore } from "@/lib/auth/require-seller.server";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };

/**
 * "View store" (ROADMAP.md F-76). Opens the seller's store on its own address.
 * While the seller isn't activated, their published store is private: the link
 * then goes through the store's /api/store-owner-pass with a 10-minute signed
 * link for THIS store and its owner, which gives this browser a 30-day pass
 * (re-issued every time the store is opened from here). The store comes from the
 * session seller's own stores only (requireStore); nothing from the client is trusted.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  let access: Awaited<ReturnType<typeof requireStore>>;
  try {
    access = await requireStore(storeId);
  } catch (error) {
    if (isAccessError(error)) return NextResponse.redirect(new URL("/stores", request.url), { status: 303, headers: NO_STORE });
    throw error;
  }
  const { seller, store } = access;
  const customDomain = await findActiveCustomDomainForSubdomain(store.subdomain).catch(() => null);
  const base = storeUrl(store.subdomain, customDomain);
  const next = request.nextUrl.searchParams.get("next");
  const path = next && next.startsWith("/") && !next.startsWith("//") ? next.slice(0, 512) : "/";

  const secret = storePreviewSecret();
  const { locked } = await loadOrderLock(seller.sellerId);
  if (!locked || !secret) return NextResponse.redirect(`${base}${path === "/" ? "" : path}`, { status: 303, headers: NO_STORE });

  const { token } = signStoreOwnerPass({
    storeId: store.id,
    sellerId: seller.sellerId,
    secret,
    ttlSeconds: STORE_OWNER_PASS_LINK_TTL_SECONDS,
  });
  const url = `${base}/api/store-owner-pass?token=${encodeURIComponent(token)}&next=${encodeURIComponent(path)}`;
  return NextResponse.redirect(url, { status: 303, headers: NO_STORE });
}
