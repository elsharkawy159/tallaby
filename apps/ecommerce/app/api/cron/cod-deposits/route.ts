import { type NextRequest, NextResponse } from "next/server";
import { expireUnpaidDeposits } from "@workspace/lib/orders/cod-deposit/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Hourly (vercel.json): cancels COD orders whose deposit (ROADMAP.md F-21) is
 * still unpaid 48 h after they were placed, and puts their stock back
 * (reason `cancel`). One transaction per order, guarded on the deposit and
 * order status, so it is idempotent and a late payment wins or loses cleanly.
 * A deposit the customer reported waits for the seller instead. Counts only.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    return NextResponse.json(await expireUnpaidDeposits());
  } catch (error) {
    console.error("[cod-deposit] cron failed", (error as Error)?.message);
    return NextResponse.json({ error: "Deposit expiry failed" }, { status: 500 });
  }
}
