import { type NextRequest, NextResponse } from "next/server";
import { logServerError } from "@workspace/db/log";
import { runSetupReminders } from "@workspace/lib/sellers";
import { countSetupRemindersSentToday, loadSetupReminderSellers } from "@workspace/lib/sellers/setup-reminders/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Hourly (vercel.json): store setup reminders (ROADMAP.md F-94, 0170). Sellers
 * made in the last 30 days whose store isn't set up get `day1` after 24 hours
 * and `day7` after 7 days, one email per seller per run, oldest due first, at
 * most 10 a run and 40 a Cairo day (Resend's free plan: 100 a day for every
 * email); the rest go next run. The backend re-checks and claims each one, so
 * a doubled or retried run never sends twice. Logs counts only.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_URL;
  const apiSecret = process.env.INTERNAL_API_SECRET;
  if (!backendUrl || !apiSecret) {
    logServerError("email", "setup reminders not configured (BACKEND_API_URL or INTERNAL_API_SECRET missing)");
    return NextResponse.json({ error: "Email backend not configured" }, { status: 500 });
  }

  try {
    const summary = await runSetupReminders({
      now: () => new Date(),
      countSentToday: () => countSetupRemindersSentToday(),
      loadSellers: () => loadSetupReminderSellers(),
      deliver: async (sellerId, kind) => {
        const res = await fetch(`${backendUrl}/api/emails/seller-setup-reminder`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiSecret}` },
          body: JSON.stringify({ sellerId, kind }),
        });
        const body = (await res.json().catch(() => null)) as { status?: string } | null;
        if (!res.ok) throw new Error(`backend returned ${res.status}`);
        return { status: body?.status ?? "skipped" };
      },
    });
    console.info("[email] setup reminders", summary);
    return NextResponse.json(summary);
  } catch (error) {
    logServerError("email", "setup reminders run failed", {}, error);
    return NextResponse.json({ error: "Setup reminders run failed" }, { status: 500 });
  }
}
