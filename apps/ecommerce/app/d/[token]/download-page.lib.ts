import { DIGITAL_DOWNLOAD_HEADERS } from "@workspace/lib/digital/access";
import { DOWNLOAD_PAGE_MESSAGES, type DownloadPageLocale, type DownloadPageMessages } from "./download-page.messages";

/**
 * The one-time download page (F-108c) as plain server HTML: no client
 * bundle, nothing from the seller rendered unescaped (CLAUDE.md rule 9),
 * never indexed or cached. Pure, so it can be tested alone.
 */

/**
 * The page's language: `?lang=` (the email adds the language it was written
 * in), then the buyer's saved language, then the browser's, else Arabic.
 */
export function pickDownloadLocale(input: {
  lang?: string | null;
  buyerLanguage?: string | null;
  acceptLanguage?: string | null;
}): DownloadPageLocale {
  const known = (value: string | null | undefined): DownloadPageLocale | null => {
    const primary = value?.trim().toLowerCase().split(/[-_]/)[0];
    return primary === "ar" || primary === "en" ? primary : null;
  };
  return known(input.lang) ?? known(input.buyerLanguage) ?? acceptLanguageLocale(input.acceptLanguage) ?? "ar";
}

/** The browser's most preferred of Arabic or English, or null. */
export function acceptLanguageLocale(header: string | null | undefined): DownloadPageLocale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const quality = q ? Number(q.slice(2)) : 1;
      return { primary: tag.toLowerCase().split("-")[0], quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .filter((entry) => entry.quality > 0 && (entry.primary === "ar" || entry.primary === "en"))
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  return (ranked[0]?.primary as DownloadPageLocale | undefined) ?? null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** "2.4 MB", "830 KB"; empty for an unknown size. */
export function formatFileSize(bytes: number | null | undefined, locale: DownloadPageLocale): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const number = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en", {
    maximumFractionDigits: unit === 0 || value >= 10 ? 0 : 1,
    numberingSystem: "latn",
  }).format(value);
  return `${number} ${units[unit]}`;
}

/** Every download response's headers, plus a content type when it has a body. */
export function downloadHeaders(contentType: string | null = "text/html; charset=utf-8"): Record<string, string> {
  return { ...DIGITAL_DOWNLOAD_HEADERS, ...(contentType ? { "Content-Type": contentType } : {}) };
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));

const STYLE = `
:root{color-scheme:light;--ink:#171717;--muted:#6b7280;--line:#e5e7eb;--bg:#f7f7f5;--card:#fff;--accent:#171717}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Tahoma,"Noto Sans Arabic","Noto Naskh Arabic",sans-serif}
main{max-width:480px;margin:0 auto;padding:32px 16px 48px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px 20px}
h1{font-size:22px;line-height:1.35;margin:0 0 4px}
.sub{color:var(--muted);margin:0 0 20px;font-size:14px}
.product{font-weight:700;margin:0 0 12px;overflow-wrap:anywhere}
ul{list-style:none;margin:0 0 20px;padding:0;border-top:1px solid var(--line)}
li{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);font-size:14px}
.name{overflow-wrap:anywhere;min-width:0}
.size{color:var(--muted);white-space:nowrap}
.btn{display:block;width:100%;text-align:center;border:0;border-radius:12px;background:var(--accent);color:#fff;font:inherit;font-weight:700;padding:14px 16px;text-decoration:none;cursor:pointer}
.btn[disabled]{opacity:.6}
li .btn{width:auto;display:inline-block;padding:8px 14px;font-size:14px}
.note{color:var(--muted);font-size:13px;margin:16px 0 0}
.key{font-family:Consolas,Monaco,monospace;background:var(--bg);border-radius:8px;padding:10px 12px;overflow-wrap:anywhere;margin:4px 0 20px}
.label{font-size:13px;color:var(--muted);margin:0}
.text{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;margin:4px 0 20px}
`;

function shell(locale: DownloadPageLocale, m: DownloadPageMessages, body: string): string {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="referrer" content="no-referrer">
<title>${escapeHtml(m.pageTitle)}</title>
<style>${STYLE}</style>
</head>
<body><main><div class="card">${body}</div></main></body>
</html>`;
}

export interface LandingFile {
  name: string;
  size: number | null;
}

/** Before the download: what the link gives, and one button that uses it. Never changes anything. */
export function renderLandingPage(input: {
  locale: DownloadPageLocale;
  token: string;
  productName: string;
  storeName: string | null;
  files: LandingFile[];
}): string {
  const m = DOWNLOAD_PAGE_MESSAGES[input.locale];
  const store = input.storeName?.trim() || m.platformName;
  const files = input.files.length
    ? `<p class="label">${escapeHtml(m.files)}</p><ul>${input.files
        .map(
          (file) =>
            `<li><span class="name" dir="auto">${escapeHtml(file.name)}</span><span class="size" dir="ltr">${escapeHtml(formatFileSize(file.size, input.locale))}</span></li>`,
        )
        .join("")}</ul>`
    : "";
  const action = `/d/${encodeURIComponent(input.token)}?lang=${input.locale}`;
  return shell(
    input.locale,
    m,
    `<h1>${escapeHtml(m.heading)}</h1>
<p class="sub">${escapeHtml(fill(m.from, { store }))}</p>
${input.productName ? `<p class="product" dir="auto">${escapeHtml(input.productName)}</p>` : ""}
${files}
<form method="post" action="${escapeHtml(action)}" onsubmit="this.querySelector('button').disabled=true">
<button class="btn" type="submit">${escapeHtml(input.files.length ? m.download : m.getPurchase)}</button>
</form>
<p class="note">${escapeHtml(m.onceNote)}</p>`,
  );
}

/** After the download: one link per file, and a key, link or instructions when the product has them. */
export function renderReadyPage(input: {
  locale: DownloadPageLocale;
  productName: string;
  files: { name: string; url: string; size: number | null }[];
  licenseKey: string | null;
  externalUrl: string | null;
  accessInstructions: string | null;
  linkMinutes: number;
}): string {
  const m = DOWNLOAD_PAGE_MESSAGES[input.locale];
  const parts: string[] = [`<h1>${escapeHtml(m.readyHeading)}</h1>`];
  if (input.productName) parts.push(`<p class="product" dir="auto">${escapeHtml(input.productName)}</p>`);
  if (input.licenseKey) {
    parts.push(`<p class="label">${escapeHtml(m.licenseKey)}</p><p class="key" dir="ltr">${escapeHtml(input.licenseKey)}</p>`);
  }
  if (input.files.length) {
    parts.push(
      `<ul>${input.files
        .map(
          (file) =>
            `<li><span class="name" dir="auto">${escapeHtml(file.name)} <span class="size" dir="ltr">${escapeHtml(formatFileSize(file.size, input.locale))}</span></span><a class="btn" href="${escapeHtml(file.url)}" rel="noreferrer" download>${escapeHtml(m.download)}</a></li>`,
        )
        .join("")}</ul>`,
    );
  }
  if (input.externalUrl && isHttpUrl(input.externalUrl)) {
    parts.push(`<p><a class="btn" href="${escapeHtml(input.externalUrl)}" rel="noreferrer noopener" target="_blank">${escapeHtml(m.openLink)}</a></p>`);
  }
  if (input.accessInstructions) {
    parts.push(`<p class="label">${escapeHtml(m.instructions)}</p><p class="text" dir="auto">${escapeHtml(input.accessInstructions)}</p>`);
  }
  if (input.files.length) parts.push(`<p class="note">${escapeHtml(fill(m.readyNote, { minutes: input.linkMinutes }))}</p>`);
  return shell(input.locale, m, parts.join("\n"));
}

/** Unknown, used, expired or revoked: one page for all, so it never tells which. */
export function renderUnavailablePage(locale: DownloadPageLocale): string {
  const m = DOWNLOAD_PAGE_MESSAGES[locale];
  return shell(locale, m, `<h1>${escapeHtml(m.unavailableHeading)}</h1><p class="sub">${escapeHtml(m.unavailableBody)}</p>`);
}

/** Storage failed before the link was used: it still works. */
export function renderErrorPage(locale: DownloadPageLocale): string {
  const m = DOWNLOAD_PAGE_MESSAGES[locale];
  return shell(locale, m, `<h1>${escapeHtml(m.errorHeading)}</h1><p class="sub">${escapeHtml(m.errorBody)}</p>`);
}

/** One file and nothing else to show: send the browser straight to it. */
export function shouldRedirectToFile(input: {
  files: unknown[];
  licenseKey: string | null;
  externalUrl: string | null;
  accessInstructions: string | null;
}): boolean {
  return input.files.length === 1 && !input.licenseKey && !input.externalUrl && !input.accessInstructions;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
