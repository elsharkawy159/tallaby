/**
 * Sitemap URL auditing: classifies what a sitemap URL actually serves.
 *
 * Used by scripts/audit-sitemap.mjs, which Node runs directly via its
 * TypeScript type stripping — so this file must stay import-free and use
 * erasable syntax only. Never called while serving /sitemap.xml.
 */

export type AuditStatus =
  /** 200, self-canonical, indexable. */
  | "valid"
  /** Renders, but noindex or canonicalised elsewhere. */
  | "non_indexable"
  /** 3xx, or a client-side (meta refresh) redirect. */
  | "redirect"
  /** 404 / 410. */
  | "not_found"
  /** 200 that is really a not-found or empty-listing page. */
  | "soft_404"
  /** 5xx after retries. */
  | "server_error"
  /** Timeout, network error or rate limit after retries — not proven broken. */
  | "unverified"
  /** Same URL listed more than once in the sitemap. */
  | "duplicate"
  /** Not an absolute https URL on the canonical origin, or not normalised. */
  | "invalid_url";

export const AUDIT_STATUSES: AuditStatus[] = [
  "valid",
  "non_indexable",
  "redirect",
  "not_found",
  "soft_404",
  "server_error",
  "unverified",
  "duplicate",
  "invalid_url",
];

export interface AuditResult {
  url: string;
  status: AuditStatus;
  httpStatus: number | null;
  /** Redirect target when known (Location header or meta refresh). */
  location: string | null;
  canonical: string | null;
  /** Human-readable reasons; also carries non-fatal warnings for valid URLs. */
  issues: string[];
  checkedAt: string;
}

/** Problems with the URL string itself, before any request is made. */
export function validateUrlShape(url: string, expectedOrigin: string): string[] {
  const issues: string[] = [];
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return ["not an absolute URL"];
  }
  const origin = expectedOrigin.replace(/\/+$/, "");
  if (parsed.protocol !== "https:" && !/^http:\/\/localhost(:\d+)?$/.test(origin)) {
    issues.push("not https");
  }
  if (parsed.origin !== origin) issues.push(`origin ${parsed.origin} is not ${origin}`);
  if (parsed.search) issues.push("has a query string");
  if (parsed.hash) issues.push("has a fragment");
  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) issues.push("trailing slash");
  if (parsed.pathname.includes("//")) issues.push("empty path segment");
  if (/\s/.test(url)) issues.push("contains whitespace");
  return issues;
}

export interface HeadSignals {
  canonical: string | null;
  robots: string[];
  htmlLang: string | null;
  /** Target of a <meta http-equiv="refresh"> (Next's streamed redirect()). */
  metaRefresh: string | null;
  /** data-page-state marker rendered by not-found / empty listing pages. */
  pageState: string | null;
  hreflang: Record<string, string>;
}

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag);
  return m ? (m[2] ?? m[3] ?? null) : null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Regex-level extraction — enough for our own server-rendered markup. */
export function extractHeadSignals(html: string): HeadSignals {
  const signals: HeadSignals = {
    canonical: null,
    robots: [],
    htmlLang: null,
    metaRefresh: null,
    pageState: null,
    hreflang: {},
  };

  const htmlTag = /<html\b[^>]*>/i.exec(html)?.[0];
  if (htmlTag) signals.htmlLang = attr(htmlTag, "lang");

  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = attr(tag, "rel")?.toLowerCase();
    const href = attr(tag, "href");
    if (!href) continue;
    if (rel === "canonical" && !signals.canonical) signals.canonical = decodeEntities(href);
    if (rel === "alternate") {
      const lang = attr(tag, "hreflang");
      if (lang) signals.hreflang[lang.toLowerCase()] = decodeEntities(href);
    }
  }

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = attr(tag, "name")?.toLowerCase();
    if (name === "robots" || name === "googlebot") {
      const content = attr(tag, "content");
      if (content) signals.robots.push(content.toLowerCase());
    }
    if (attr(tag, "http-equiv")?.toLowerCase() === "refresh" && !signals.metaRefresh) {
      const content = attr(tag, "content") ?? "";
      const m = /url\s*=\s*(.+)$/i.exec(content);
      signals.metaRefresh = m ? decodeEntities(m[1]!.trim()) : content;
    }
  }

  const state = /\sdata-page-state\s*=\s*["']([^"']+)["']/i.exec(html);
  if (state) signals.pageState = state[1]!;

  return signals;
}

/** Locale a storefront URL should render in: /en/... is English, else Arabic. */
export function expectedLocaleOf(url: string): "en" | "ar" {
  try {
    const { pathname } = new URL(url);
    return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ar";
  } catch {
    return "ar";
  }
}

function sameUrl(a: string, b: string): boolean {
  const norm = (u: string) => {
    try {
      const p = new URL(u);
      return `${p.origin}${p.pathname.replace(/\/+$/, "") || ""}${p.search}`;
    } catch {
      return u;
    }
  };
  return norm(a) === norm(b);
}

export interface FetchedPage {
  url: string;
  httpStatus: number;
  /** null when the redirect target is opaque (browser fetch, redirect: "manual"). */
  location: string | null;
  isRedirect: boolean;
  xRobotsTag: string | null;
  contentType: string | null;
  html: string | null;
}

/** Classifies one fetched (not followed) response. */
export function classifyPage(page: FetchedPage, now = new Date()): AuditResult {
  const base = {
    url: page.url,
    httpStatus: page.httpStatus || null,
    location: page.location,
    canonical: null as string | null,
    issues: [] as string[],
    checkedAt: now.toISOString(),
  };

  if (page.isRedirect || (page.httpStatus >= 300 && page.httpStatus < 400)) {
    return {
      ...base,
      status: "redirect",
      issues: [page.location ? `redirects to ${page.location}` : "redirects"],
    };
  }
  if (page.httpStatus === 404 || page.httpStatus === 410) {
    return { ...base, status: "not_found", issues: [`HTTP ${page.httpStatus}`] };
  }
  if (page.httpStatus >= 500) {
    return { ...base, status: "server_error", issues: [`HTTP ${page.httpStatus}`] };
  }
  if (page.httpStatus < 200 || page.httpStatus >= 300) {
    return { ...base, status: "non_indexable", issues: [`HTTP ${page.httpStatus}`] };
  }

  const signals = extractHeadSignals(page.html ?? "");
  const result: AuditResult = { ...base, status: "valid", canonical: signals.canonical };

  if (signals.pageState === "not-found") {
    return { ...result, status: "soft_404", issues: ["renders the not-found page with HTTP 200"] };
  }
  if (signals.pageState === "empty-listing") {
    return { ...result, status: "soft_404", issues: ["listing page with no products"] };
  }
  if (signals.metaRefresh) {
    return {
      ...result,
      status: "redirect",
      location: signals.metaRefresh,
      issues: [`client-side redirect to ${signals.metaRefresh}`],
    };
  }

  const robots = [...signals.robots, ...(page.xRobotsTag ? [page.xRobotsTag.toLowerCase()] : [])];
  if (robots.some((r) => /\b(noindex|none)\b/.test(r))) {
    result.status = "non_indexable";
    result.issues.push("noindex");
  }

  if (!signals.canonical) {
    result.issues.push("no canonical link");
  } else if (!sameUrl(signals.canonical, page.url)) {
    result.status = "non_indexable";
    result.issues.push(`canonical points to ${signals.canonical}`);
  }

  // Warnings: don't change the status, but are worth fixing.
  const expected = expectedLocaleOf(page.url);
  const lang = signals.htmlLang?.toLowerCase().split("-")[0];
  if (lang && lang !== expected) result.issues.push(`page language is ${lang}, expected ${expected}`);
  const selfAlt = signals.hreflang[expected];
  if (Object.keys(signals.hreflang).length > 0 && (!selfAlt || !sameUrl(selfAlt, page.url))) {
    result.issues.push(`hreflang="${expected}" does not point back to this URL`);
  }

  return result;
}

/**
 * fetchPage over the standard fetch API, without following redirects so
 * they can be reported. In a browser a manual redirect is opaque (status 0,
 * no Location) — it is still classified as a redirect, just without target.
 */
export function createFetchPage(
  fetchImpl: typeof fetch,
  headers: Record<string, string> = {}
): AuditOptions["fetchPage"] {
  return async (url, signal) => {
    const res = await fetchImpl(url, { redirect: "manual", signal, headers, cache: "no-store" });
    const isRedirect = res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400);
    const contentType = res.headers.get("content-type");
    const rawLocation = res.headers.get("location");
    let html: string | null = null;
    if (!isRedirect && contentType?.includes("text/html")) html = await res.text();
    else await res.body?.cancel();
    return {
      url,
      httpStatus: res.status,
      location: rawLocation ? new URL(rawLocation, url).toString() : null,
      isRedirect,
      xRobotsTag: res.headers.get("x-robots-tag"),
      contentType,
      html,
    };
  };
}

export interface AuditOptions {
  expectedOrigin: string;
  fetchPage: (url: string, signal: AbortSignal) => Promise<FetchedPage>;
  concurrency?: number;
  timeoutMs?: number;
  /** Extra attempts for timeouts, network errors, 429 and 502–504. */
  retries?: number;
  /** Rewrites a sitemap URL to the host actually requested (local testing). */
  requestUrlFor?: (url: string) => string;
  onResult?: (result: AuditResult, done: number, total: number) => void;
  signal?: AbortSignal;
}

const TRANSIENT_HTTP = new Set([429, 502, 503, 504]);

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      resolve();
    });
  });

async function auditOne(url: string, opts: AuditOptions): Promise<AuditResult> {
  const shapeIssues = validateUrlShape(url, opts.expectedOrigin);
  if (shapeIssues.length > 0) {
    return {
      url,
      status: "invalid_url",
      httpStatus: null,
      location: null,
      canonical: null,
      issues: shapeIssues,
      checkedAt: new Date().toISOString(),
    };
  }

  const retries = opts.retries ?? 2;
  const requestUrl = opts.requestUrlFor ? opts.requestUrlFor(url) : url;
  let lastProblem = "not checked";
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (opts.signal?.aborted) break;
    if (attempt > 0) await sleep(500 * 2 ** attempt, opts.signal);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15_000);
    const onAbort = () => controller.abort();
    opts.signal?.addEventListener("abort", onAbort);
    try {
      const page = await opts.fetchPage(requestUrl, controller.signal);
      const transient = TRANSIENT_HTTP.has(page.httpStatus);
      if ((transient || page.httpStatus >= 500) && attempt < retries) {
        lastProblem = `HTTP ${page.httpStatus}`;
        continue;
      }
      // Rate limits / gateway errors that never cleared prove nothing about
      // the page itself; a persistent 500 is a real server error.
      if (transient) {
        lastProblem = `HTTP ${page.httpStatus} after ${retries + 1} attempts`;
        break;
      }
      return classifyPage({ ...page, url });
    } catch (error) {
      lastProblem = controller.signal.aborted
        ? opts.signal?.aborted
          ? "audit cancelled"
          : "timed out"
        : `network error: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onAbort);
    }
  }

  return {
    url,
    status: "unverified",
    httpStatus: null,
    location: null,
    canonical: null,
    issues: [lastProblem],
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Audits every URL with bounded concurrency. Duplicates are reported without
 * a second request. Results come back in input order.
 */
export async function auditUrls(urls: string[], opts: AuditOptions): Promise<AuditResult[]> {
  const results: AuditResult[] = new Array(urls.length);
  const firstIndex = new Map<string, number>();
  const queue: number[] = [];
  urls.forEach((url, i) => {
    if (firstIndex.has(url)) {
      results[i] = {
        url,
        status: "duplicate",
        httpStatus: null,
        location: null,
        canonical: null,
        issues: [`duplicate of entry #${firstIndex.get(url)! + 1}`],
        checkedAt: new Date().toISOString(),
      };
    } else {
      firstIndex.set(url, i);
      queue.push(i);
    }
  });

  let done = urls.length - queue.length;
  const total = urls.length;
  let next = 0;
  const worker = async () => {
    while (next < queue.length && !opts.signal?.aborted) {
      const i = queue[next++]!;
      results[i] = await auditOne(urls[i]!, opts);
      done++;
      opts.onResult?.(results[i]!, done, total);
    }
  };
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 4, 16));
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results.filter(Boolean);
}

export function summarizeAudit(results: AuditResult[]): Record<AuditStatus, number> {
  const summary = Object.fromEntries(AUDIT_STATUSES.map((s) => [s, 0])) as Record<AuditStatus, number>;
  for (const r of results) summary[r.status]++;
  return summary;
}

/** <loc> values of a sitemap or sitemap index document. */
export function parseSitemapXml(xml: string): { kind: "urlset" | "sitemapindex" | "unknown"; locs: string[] } {
  const kind = /<urlset[\s>]/.test(xml) ? "urlset" : /<sitemapindex[\s>]/.test(xml) ? "sitemapindex" : "unknown";
  const locs = [...xml.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => decodeEntities(m[1]!));
  return { kind, locs };
}
