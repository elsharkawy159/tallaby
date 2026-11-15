import { NextResponse } from "next/server";
import { logServerError } from "@workspace/db/log";
import { runTopUpReminders } from "@workspace/lib/billing/top-up-reminder/server";

export const maxDuration = 60;

/**
 * Hourly (vercel.json): one bell notification asking a seller who isn't
 * activated to top up, 24 hours after their first store was created (owner,
 * 2026-11-15; 0172). Once per seller (dedupe_key + ON CONFLICT), at most
 * TOP_UP_REMINDER_BATCH a run, so repeated or parallel runs never double-send.
 * The push dispatcher pushes the rows. Logs counts only.
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    const summary = await runTopUpReminders();
    if (summary.status === "migration_missing") {
      logServerError("wallet", "top-up reminders: migration 0172 is not applied", { candidates: summary.candidates });
    }
    return NextResponse.json(summary);
  } catch (error) {
    logServerError("wallet", "top-up reminders run failed", {}, error);
    return NextResponse.json({ error: "Top-up reminders run failed" }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
