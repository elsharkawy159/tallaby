import { logServerError } from "@workspace/db/log";

/**
 * Hourly seller lifecycle emails (ROADMAP.md F-113): the store-offline email
 * and the weekly store insights, which replaced F-104's first-week email. The
 * path keeps its F-104 name so the existing schedule needs no change.
 */

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_URL;
  const apiSecret = process.env.INTERNAL_API_SECRET;
  if (!backendUrl || !apiSecret) {
    logServerError("email", "seller insights backend not configured");
    return Response.json({ error: "Email backend not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(`${backendUrl.replace(/\/+$/, "")}/api/emails/seller-insights`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiSecret}` },
      signal: AbortSignal.timeout(50_000),
    });
    if (!response.ok) throw new Error(`Email backend returned ${response.status}`);
    const summary = await response.json();
    console.info("[email] seller insights", summary);
    return Response.json(summary);
  } catch (error) {
    logServerError("email", "seller insights cron failed", {}, error);
    return Response.json({ error: "Seller insights cron failed" }, { status: 502 });
  }
}
