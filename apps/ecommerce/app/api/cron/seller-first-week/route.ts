import { logServerError } from "@workspace/db/log";

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_URL;
  const apiSecret = process.env.INTERNAL_API_SECRET;
  if (!backendUrl || !apiSecret) {
    logServerError("email", "first-week insights backend not configured");
    return Response.json({ error: "Email backend not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(`${backendUrl.replace(/\/+$/, "")}/api/emails/seller-first-week`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiSecret}` },
      signal: AbortSignal.timeout(50_000),
    });
    if (!response.ok) throw new Error(`Email backend returned ${response.status}`);
    const summary = await response.json();
    console.info("[email] first-week insights", summary);
    return Response.json(summary);
  } catch (error) {
    logServerError("email", "first-week insights cron failed", {}, error);
    return Response.json({ error: "First-week insights cron failed" }, { status: 502 });
  }
}
