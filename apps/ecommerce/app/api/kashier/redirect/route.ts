import { NextRequest, NextResponse } from "next/server";
import {
  getKashierConfig,
  parseKashierOrderReference,
  verifyKashierRedirectSignature,
} from "@workspace/lib/kashier";
import { buildOrderPagePath } from "@/lib/order-access-token";

export const dynamic = "force-dynamic";

/**
 * Kashier's merchantRedirect target. The browser query string is forgeable, so
 * this route only proves the redirect came from Kashier (HMAC with the Payment
 * API Key) and then sends the customer to the order page. It writes nothing:
 * the order is marked paid exclusively by the signed server webhook, and the
 * order page renders whatever state the webhook has (or has not yet) recorded.
 */
export async function GET(request: NextRequest) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || request.nextUrl.origin;
  const config = getKashierConfig();
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());

  if (!config || !verifyKashierRedirectSignature(query, config.paymentApiKey)) {
    console.error("Kashier redirect signature verification failed");
    return NextResponse.redirect(`${siteUrl}/cart/checkout`, 303);
  }

  const orderId = parseKashierOrderReference(query.merchantOrderId);
  if (!orderId) {
    return NextResponse.redirect(`${siteUrl}/cart/checkout`, 303);
  }

  return NextResponse.redirect(`${siteUrl}${buildOrderPagePath(orderId)}`, 303);
}
