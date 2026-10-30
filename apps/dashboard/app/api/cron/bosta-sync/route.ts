import { type NextRequest, NextResponse } from "next/server";
import { runBostaRetrySweep } from "@workspace/lib/shipping/bosta-ship";
import { syncBostaShipments } from "@workspace/lib/shipping/bosta-sync";
import { sendPendingDeliveredMetaPurchases } from "@workspace/lib/integrations/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Bosta safety net (docs/superpowers/plans/2026-10-26-bosta-shipping.md
 * §4.4–4.5, BS-09/BS-11): re-reads Bosta shipments whose webhook may have
 * been lost (not final, not synced for 2 hours) and retries auto-ship claims
 * that never reached Bosta. Same secret header as the other crons. Both
 * steps are idempotent, so a doubled or more frequent run is harmless.
 * Last, the Meta Purchase-on-delivery sweep (ROADMAP.md F-30a): delivered
 * store orders whose deferred Purchase was missed or failed (claim-based,
 * one Purchase per order).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const sync = await syncBostaShipments({ limit: 200 }).catch((error: unknown) => {
    console.error("bosta-sync cron: sync failed", (error as Error)?.name);
    return null;
  });
  const retry = await runBostaRetrySweep({ limit: 30 }).catch((error: unknown) => {
    console.error("bosta-sync cron: retry sweep failed", (error as Error)?.name);
    return null;
  });
  const metaPurchases = await sendPendingDeliveredMetaPurchases({ limit: 40 }).catch((error: unknown) => {
    console.error("bosta-sync cron: meta purchase sweep failed", (error as Error)?.name);
    return null;
  });
  return NextResponse.json({ sync, retry, metaPurchases });
}
