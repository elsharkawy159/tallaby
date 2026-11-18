import { NextRequest, NextResponse } from "next/server";
import { buildOrderPagePath } from "@/lib/order-access-token";
import { getRequestSiteUrl } from "@/lib/storefront.server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Path form of the gateway return URL, used by EasyKash (ROADMAP.md F-98e,
 * docs/easykash.md §1.3, §4.4): EasyKash appends its own `?status=…&voucher=…`,
 * so the order travels in the path. Those query params are forgeable and are
 * ignored: this route writes nothing. The order is marked paid only by the
 * signed callback, and the order page reads any Fawry / Aman voucher through
 * EasyKash's Inquiry API on the server. The query form (`../route.ts`) stays
 * for Paymob and Kashier.
 */
async function redirectToOrder(params: Promise<{ orderId: string }>) {
  const siteUrl = await getRequestSiteUrl();
  const { orderId } = await params;
  if (!orderId || !UUID.test(orderId)) {
    return NextResponse.redirect(`${siteUrl}/cart/checkout`, 303);
  }
  return NextResponse.redirect(`${siteUrl}${buildOrderPagePath(orderId)}`, 303);
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  return redirectToOrder(params);
}

/** Some gateways return with a form POST; same answer, still writes nothing. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  return redirectToOrder(params);
}
