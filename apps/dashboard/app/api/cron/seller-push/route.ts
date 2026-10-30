import { type NextRequest, NextResponse } from "next/server";
import { logServerError } from "@workspace/db/log";
import { dispatchSellerPushes } from "@/lib/push/push-alerts.server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Seller push alerts dispatcher (ROADMAP.md F-06, 0124). Called by:
 *   - a Supabase Database Webhook on INSERT into seller_notifications (POST);
 *   - the Vercel cron in vercel.json (GET), as a safety net.
 * Both send `Authorization: Bearer <CRON_SECRET>`. The request body is
 * ignored: each run claims the recent unpushed rows itself (pushed_at,
 * FOR UPDATE SKIP LOCKED), so repeated or parallel calls never double-send.
 */
async function run(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    return NextResponse.json(await dispatchSellerPushes());
  } catch (error) {
    logServerError("integration", "seller push dispatch failed", {}, error);
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
