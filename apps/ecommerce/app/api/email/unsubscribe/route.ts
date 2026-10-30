import { type NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { isEmailUnsubscribeToken } from "@workspace/lib/email-campaigns";
import { unsubscribeByEmailToken } from "@workspace/lib/email-campaigns/server";

export const dynamic = "force-dynamic";

/**
 * The unsubscribe link of store campaign and win-back emails (0129, ROADMAP.md
 * F-16a/F-16e), served on the store's own host. GET only shows a confirm
 * button (mail scanners open links; they must not unsubscribe anyone); POST
 * adds the email to that store's unsubscribe list and skips its unsent
 * campaign and win-back emails there. A tiny Arabic + English page, no store
 * chrome. Same shape as the back-in-stock unsubscribe route.
 */

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

type Copy = { title: string; confirm: string; button: string; done: string; invalid: string };

async function copies(storeName = ""): Promise<{ ar: Copy; en: Copy }> {
  const [ar, en] = await Promise.all([
    getTranslations({ locale: "ar", namespace: "emailUnsubscribe" }),
    getTranslations({ locale: "en", namespace: "emailUnsubscribe" }),
  ]);
  const pick = (t: typeof ar): Copy => ({
    title: t("title"),
    confirm: t("confirm"),
    button: t("button"),
    done: t("done", { store: storeName }),
    invalid: t("invalid"),
  });
  return { ar: pick(ar), en: pick(en) };
}

function page(title: string, body: string, status = 200) {
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escape(title)}</title>
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

export async function GET(request: NextRequest) {
  const { ar, en } = await copies();
  const token = request.nextUrl.searchParams.get("token");
  if (!isEmailUnsubscribeToken(token)) {
    return page(ar.title, `<p>${escape(ar.invalid)}</p><p class="en">${escape(en.invalid)}</p>`, 400);
  }
  return page(
    ar.title,
    `<p>${escape(ar.confirm)}</p><p class="en">${escape(en.confirm)}</p>
<form method="post" action="?token=${encodeURIComponent(token)}"><button type="submit">${escape(ar.button)} · ${escape(en.button)}</button></form>`,
  );
}

export async function POST(request: NextRequest) {
  const result = await unsubscribeByEmailToken(request.nextUrl.searchParams.get("token")).catch(() => null);
  const { ar, en } = await copies(result?.storeName ?? "");
  if (!result) {
    return page(ar.title, `<p>${escape(ar.invalid)}</p><p class="en">${escape(en.invalid)}</p>`, 400);
  }
  return page(ar.title, `<p>${escape(ar.done)}</p><p class="en">${escape(en.done)}</p>`);
}
