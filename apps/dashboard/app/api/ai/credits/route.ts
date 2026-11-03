import { NextResponse } from "next/server";
import { getAiCreditStatus } from "@workspace/lib/billing/credits";
import { getBillingState } from "@workspace/lib/billing/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";

export const dynamic = "force-dynamic";

/** Credits left on the session's account, for the note beside the AI buttons (ROADMAP.md F-57c). */
export async function GET() {
  let sellerId: string;
  try {
    sellerId = (await requireSeller()).sellerId;
  } catch (error) {
    if (isAccessError(error)) return new NextResponse(null, { status: 401 });
    throw error;
  }
  const billing = await getBillingState();
  // No credits before the USD switch: the buttons run on the daily cap alone.
  if (!billing.usdLive) return NextResponse.json({ live: false }, { headers: { "Cache-Control": "no-store" } });
  const credits = await getAiCreditStatus(sellerId);
  return NextResponse.json({ live: true, total: credits.total }, { headers: { "Cache-Control": "no-store" } });
}
