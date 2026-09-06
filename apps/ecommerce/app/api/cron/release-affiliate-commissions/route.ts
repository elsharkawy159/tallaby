import { NextResponse } from "next/server";

import { db } from "@workspace/db";
import { releaseDueAffiliateCommissions } from "@workspace/db/affiliates";

/**
 * Hourly cron: credits affiliate wallets once RETURN_WINDOW_DAYS after delivery.
 * Auth: Authorization Bearer CRON_SECRET (set in the ecommerce Vercel project).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await releaseDueAffiliateCommissions(db);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("release-affiliate-commissions cron failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
