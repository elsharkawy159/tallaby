import { type NextRequest, NextResponse } from "next/server";
import { requestOrigin } from "@workspace/lib/http/request-origin";
import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { LOCALE_COOKIE } from "@/i18n/config";
import { savedLocaleHref } from "@/lib/i18n/saved-locale-href.lib";

const NO_STORE = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };

/**
 * "View store": opens the seller's store on its own address (its active custom
 * domain, or its subdomain). A published store is public for everyone (ROADMAP.md
 * F-84), so this is a plain redirect; the F-76 owner pass is gone. The store comes
 * from the session seller's own stores only (requireStore); nothing from the
 * client is trusted beyond a same-site path.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  let access: Awaited<ReturnType<typeof requireStore>>;
  try {
    access = await requireStore(storeId);
  } catch (error) {
    if (isAccessError(error)) return NextResponse.redirect(new URL(savedLocaleHref("/stores", request.cookies.get(LOCALE_COOKIE)?.value), requestOrigin(request)), { status: 303, headers: NO_STORE });
    throw error;
  }
  const { store } = access;
  const customDomain = await findActiveCustomDomainForSubdomain(store.subdomain).catch(() => null);
  const base = storeUrl(store.subdomain, customDomain);
  const next = request.nextUrl.searchParams.get("next");
  const path = next && next.startsWith("/") && !next.startsWith("//") ? next.slice(0, 512) : "/";
  return NextResponse.redirect(`${base}${path === "/" ? "" : path}`, { status: 303, headers: NO_STORE });
}
