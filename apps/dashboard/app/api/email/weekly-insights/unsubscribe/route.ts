import { type NextRequest, NextResponse } from "next/server";
import { logServerError } from "@workspace/db/log";
import { isSellerEmailOptOutToken } from "@workspace/lib/emails/seller-insights";
import { optOutOfWeeklyInsights } from "@workspace/lib/emails/seller-insights/server";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";

/**
 * The "stop the weekly summary" link of the weekly store insights email
 * (ROADMAP.md F-113, 0183). GET only shows a confirm button (mail scanners open
 * links; they must not opt anyone out); POST checks the HMAC-signed token and
 * adds the seller's `weekly_insights` opt-out. Mail clients' one-click
 * unsubscribe (RFC 8058, `List-Unsubscribe-Post`) also POSTs here. Public
 * (proxy.ts skips /api); the signed token is the only input.
 */

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

const AR = ar.weeklyInsightsUnsubscribe;
const EN = en.weeklyInsightsUnsubscribe;

function page(body: string, status = 200) {
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escape(AR.title)}</title>
<style>body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif;background:#f6f6f4;color:#1a1a1a;display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box}
main{max-width:420px;width:100%;background:#fff;border:1px solid #e6e6e6;border-radius:16px;padding:28px;text-align:center}
p{line-height:1.7;margin:0 0 12px}.en{direction:ltr;color:#666;font-size:14px}
button{margin-top:8px;height:48px;padding:0 24px;border:0;border-radius:999px;background:#1a1a1a;color:#fff;font-size:15px;font-weight:700;cursor:pointer}</style></head>
<body><main>${body}</main></body></html>`;
  return new NextResponse(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}

const both = (key: "confirm" | "done" | "invalid" | "unavailable") => `<p>${escape(AR[key])}</p><p class="en">${escape(EN[key])}</p>`;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!isSellerEmailOptOutToken(token)) return page(both("invalid"), 400);
  return page(
    `${both("confirm")}
<form method="post" action="?token=${encodeURIComponent(token)}"><button type="submit">${escape(AR.button)} · ${escape(EN.button)}</button></form>`,
  );
}

export async function POST(request: NextRequest) {
  const result = await optOutOfWeeklyInsights(request.nextUrl.searchParams.get("token")).catch((error) => {
    logServerError("email", "weekly insights opt-out failed", {}, error);
    return "unavailable" as const;
  });
  if (result === "done") return page(both("done"));
  return result === "invalid" ? page(both("invalid"), 400) : page(both("unavailable"), 503);
}
