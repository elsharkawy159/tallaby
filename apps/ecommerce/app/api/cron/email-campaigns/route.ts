import { type NextRequest, NextResponse } from "next/server";
import { logServerError } from "@workspace/db/log";
import { runEmailCampaignCron } from "@workspace/lib/email-campaigns/send";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily (vercel.json): store email campaigns and win-back emails (0129,
 * ROADMAP.md F-16a, F-16e). Plans today's win-back emails (per-store daily
 * cap), starts campaigns whose scheduled time has come, then claims
 * recipients in small batches (FOR UPDATE SKIP LOCKED) and asks the backend
 * to send one store-branded email each; its email_deliveries claim stops a
 * second send, and failed rows go back to pending (failed after 3 tries).
 * "Send now" in the dashboard starts its own run for that one campaign.
 * Logs counts only, never an email.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    const summary = await runEmailCampaignCron({ deadlineMs: 240_000, winback: true });
    return NextResponse.json(summary);
  } catch (error) {
    logServerError("email", "email campaign cron failed", {}, error);
    return NextResponse.json({ error: "Run failed" }, { status: 500 });
  }
}
