import { type NextRequest, NextResponse } from "next/server";
import { releaseDueTallabyPaySales } from "@workspace/lib/tallaby-pay/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Hourly (vercel.json): the safety net of the Tallaby Pay release on delivery
 * (ROADMAP.md F-100d, design §5). Every pending sale with no refund request
 * whose order is delivered and whose `delivered_at + hold_days` (0 today,
 * owner 2026-11-18) has passed moves to available. One guarded transaction
 * per sale, so a rerun or the delivered hook racing it changes nothing.
 * Counts only.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    return NextResponse.json(await releaseDueTallabyPaySales());
  } catch (error) {
    console.error("[tallaby-pay] release cron failed", (error as Error)?.message);
    return NextResponse.json({ error: "Tallaby Pay release failed" }, { status: 500 });
  }
}
