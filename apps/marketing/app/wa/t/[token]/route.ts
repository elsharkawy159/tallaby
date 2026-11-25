import { NextResponse, type NextRequest } from "next/server";
import { resolveWhatsAppTrackingTarget } from "@workspace/lib/whatsapp/tracking";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };

/**
 * The WhatsApp "Track order" button: `https://tallaby.com/wa/t/<token>`
 * (ROADMAP.md F-109, docs/whatsapp.md §4 Tracking link). The token is a signed
 * order id (ORDER_ACCESS_SECRET, 60 days). It redirects to the carrier's
 * tracking page, else to the order's page on the store's own host. A bad or
 * expired token is a plain 404. Never cached.
 */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  let target: string | null = null;
  try {
    target = await resolveWhatsAppTrackingTarget(decodeURIComponent(token));
  } catch (error) {
    console.error("whatsapp tracking: lookup failed", (error as Error)?.name);
  }
  if (!target) return new NextResponse(null, { status: 404, headers: NO_STORE });
  return NextResponse.redirect(target, { status: 302, headers: NO_STORE });
}
