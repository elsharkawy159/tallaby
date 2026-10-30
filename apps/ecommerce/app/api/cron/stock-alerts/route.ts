import { type NextRequest, NextResponse } from "next/server";
import { logServerError } from "@workspace/db/log";
import { sendBackInStockEmail } from "@workspace/lib/orders";
import { STOCK_ALERT_BATCH } from "@workspace/lib/stock-alerts";
import { claimStockAlerts, releaseStockAlertClaim } from "@workspace/lib/stock-alerts/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily (vercel.json): back-in-stock alerts (0126, ROADMAP.md F-23a). Claims
 * up to STOCK_ALERT_BATCH open alerts whose product/variant has stock again on
 * a live store (`notified_at`, FOR UPDATE SKIP LOCKED), asks the backend to
 * send one store-branded email each (its email_deliveries claim stops a
 * second send), and gives back the claims whose send failed so the next run
 * retries them. Logs counts only, never an email.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let claimed: string[];
  try {
    claimed = await claimStockAlerts({ limit: STOCK_ALERT_BATCH });
  } catch (error) {
    logServerError("email", "stock alert claim failed", {}, error);
    return NextResponse.json({ error: "Claim failed" }, { status: 500 });
  }

  const summary = { claimed: claimed.length, requested: 0, released: 0 };
  for (const id of claimed) {
    const result = await sendBackInStockEmail(id);
    if (result.success) {
      summary.requested++;
      continue;
    }
    await releaseStockAlertClaim(id);
    summary.released++;
    logServerError("email", "back-in-stock email failed", { subscriptionId: id, error: result.error ?? null });
  }

  return NextResponse.json(summary);
}
