import { type NextRequest, NextResponse } from "next/server";
import { logServerError } from "@workspace/db/log";
import { isSetupReminderToken, optOutOfSetupReminders } from "@workspace/lib/sellers/setup-reminders/server";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";

export const dynamic = "force-dynamic";

/**
 * The "stop these reminders" link of the store setup reminder emails
 * (ROADMAP.md F-94, 0170). GET only shows a confirm button (mail scanners open
 * links; they must not opt anyone out); POST adds the seller's `opt_out` row.
 * Mail clients' one-click unsubscribe (RFC 8058, `List-Unsubscribe-Post`) also
 * POSTs here. Public (proxy.ts skips /api); the random token is the only input.
 */

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

const AR = ar.setupReminderUnsubscribe;
const EN = en.setupReminderUnsubscribe;

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

const both = (key: "confirm" | "done" | "invalid") => `<p>${escape(AR[key])}</p><p class="en">${escape(EN[key])}</p>`;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!isSetupReminderToken(token)) return page(both("invalid"), 400);
  return page(
    `${both("confirm")}
<form method="post" action="?token=${encodeURIComponent(token)}"><button type="submit">${escape(AR.button)} · ${escape(EN.button)}</button></form>`,
  );
}

export async function POST(request: NextRequest) {
  const ok = await optOutOfSetupReminders(request.nextUrl.searchParams.get("token")).catch((error) => {
    logServerError("email", "setup reminder opt-out failed", {}, error);
    return false;
  });
  return ok ? page(both("done")) : page(both("invalid"), 400);
}
