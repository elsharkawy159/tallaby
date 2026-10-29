import { type NextRequest, NextResponse } from "next/server";
import { logServerError } from "@workspace/db/log";
import { deleteOldStoreCheckoutLeads } from "@workspace/lib/checkout-leads/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily (vercel.json): deletes missed-order leads (0120, ROADMAP.md F-03d)
 * older than 30 days, converted or not. Idempotent.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const deleted = await deleteOldStoreCheckoutLeads();
    return NextResponse.json({ deleted });
  } catch (error) {
    logServerError("integration", "checkout leads cleanup failed", {}, error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
