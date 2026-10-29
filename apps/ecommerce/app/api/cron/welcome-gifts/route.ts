import { type NextRequest, NextResponse } from "next/server";
import { logServerError } from "@workspace/db/log";
import { runWelcomeGiftJob } from "@workspace/lib/store-wallet/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily (vercel.json): the EGP 100 welcome gift (0119). Grants gifts a new
 * seller earned outside the dashboard's own checks (or whose grant failed),
 * sends the 3-day reminder and takes back the unspent part of gifts older than
 * 30 days. Every step is idempotent, so a doubled or retried run is harmless
 * and a missed day is caught up the next day.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const summary = await runWelcomeGiftJob();
    return NextResponse.json(summary);
  } catch (error) {
    logServerError("wallet", "welcome gift job failed", {}, error);
    return NextResponse.json({ error: "Welcome gift job failed" }, { status: 500 });
  }
}
