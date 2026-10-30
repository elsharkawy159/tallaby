import { NextRequest, NextResponse } from "next/server";
import { buildOrderPagePath } from "@/lib/order-access-token";
import { getRequestSiteUrl } from "@/lib/storefront.server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Where the seller's own gateway (Paymob or Kashier, ROADMAP.md F-39) sends
 * the shopper back after paying. The query string is forgeable, so this route
 * writes nothing: the order is marked paid only by the signed server webhook
 * (apps/backend /api/webhooks/store-payments/:integrationId), and the order
 * page shows whatever state that webhook has recorded.
 */
export async function GET(request: NextRequest) {
  const siteUrl = await getRequestSiteUrl();
  const orderId = request.nextUrl.searchParams.get("order");
  if (!orderId || !UUID.test(orderId)) {
    return NextResponse.redirect(`${siteUrl}/cart/checkout`, 303);
  }
  return NextResponse.redirect(`${siteUrl}${buildOrderPagePath(orderId)}`, 303);
}
