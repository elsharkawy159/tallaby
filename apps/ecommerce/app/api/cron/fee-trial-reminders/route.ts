import { type NextRequest, NextResponse } from "next/server";
import { and, db, gt, lte, sellers, sql } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { feeTrialReminderStage } from "@workspace/lib/sellers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily (vercel.json): a fee trial reminder 1 day before a seller's 7-day
 * trial ends (PLAN.md §13.5, P6-07; no 7-day reminder since 0067). The backend sends each stage once per
 * seller (email_deliveries claim), so a retried or doubled run is harmless and
 * a missed day is caught up the next day.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_URL;
  const apiSecret = process.env.INTERNAL_API_SECRET;
  if (!backendUrl || !apiSecret) {
    logServerError("fee", "trial reminders not configured (BACKEND_API_URL or INTERNAL_API_SECRET missing)");
    return NextResponse.json({ error: "Email backend not configured" }, { status: 500 });
  }

  const now = new Date();
  const candidates = await db
    .select({ id: sellers.id, endsAt: sellers.feeTrialEndsAt })
    .from(sellers)
    .where(
      and(
        gt(sellers.feeTrialEndsAt, now.toISOString()),
        lte(sellers.feeTrialEndsAt, sql`now() + interval '1 day'`),
      ),
    );

  const summary = { candidates: candidates.length, sent: 0, skipped: 0, errors: 0 };
  for (const seller of candidates) {
    const stage = feeTrialReminderStage(seller.endsAt, now);
    if (!stage) {
      summary.skipped++;
      continue;
    }
    try {
      const res = await fetch(`${backendUrl}/api/emails/fee-trial-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiSecret}` },
        body: JSON.stringify({ sellerId: seller.id, stage }),
      });
      const body = (await res.json().catch(() => null)) as { status?: string } | null;
      if (!res.ok) throw new Error(`backend returned ${res.status}`);
      if (body?.status === "sent") summary.sent++;
      else summary.skipped++;
    } catch (error) {
      summary.errors++;
      logServerError("fee", "trial reminder failed", { sellerId: seller.id, stage }, error);
    }
  }

  return NextResponse.json(summary);
}
