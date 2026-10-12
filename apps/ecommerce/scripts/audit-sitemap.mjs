#!/usr/bin/env node
/**
 * Audits every URL in a sitemap: HTTP status, redirects, not-found / soft-404,
 * canonical, noindex, page language and hreflang. Read-only and rate-bounded.
 *
 *   node scripts/audit-sitemap.mjs [options]
 *
 *   --sitemap <url>      Sitemap or sitemap index (default https://www.tallaby.com/sitemap.xml)
 *   --origin <url>       Expected canonical origin (default: the sitemap's origin)
 *   --request-origin <u> Request URLs on this origin instead (e.g. http://localhost:3000
 *                        to audit a local build against production-shaped URLs)
 *   --concurrency <n>    Parallel requests, 1-16 (default 4)
 *   --timeout <ms>       Per-request timeout (default 15000)
 *   --retries <n>        Retries for timeouts / 429 / 5xx (default 2)
 *   --limit <n>          Only audit the first n URLs
 *   --out <file>         Write the JSON report here (importable on /sitemap)
 *
 * Exit code 1 when any URL is not_found, soft_404, server_error, redirect,
 * duplicate or invalid_url; unverified URLs alone don't fail the run.
 *
 * Runs on Node >= 22.18 / 23.6, which strip TypeScript types natively.
 */
import { writeFileSync } from "node:fs";
import {
  auditUrls,
  createFetchPage,
  parseSitemapXml,
  summarizeAudit,
} from "../lib/sitemap/audit.lib.ts";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith("--")) pairs.push([arg.slice(2), all[i + 1]?.startsWith("--") ? "true" : all[i + 1]]);
    return pairs;
  }, [])
);

const sitemapUrl = args.sitemap ?? "https://www.tallaby.com/sitemap.xml";
const expectedOrigin = (args.origin ?? new URL(sitemapUrl).origin).replace(/\/+$/, "");
const requestOrigin = args["request-origin"]?.replace(/\/+$/, "");
const headers = { "user-agent": "TallabySitemapAudit/1.0 (+https://www.tallaby.com/sitemap)" };

const toRequestUrl = (url) => {
  if (!requestOrigin) return url;
  const u = new URL(url);
  return `${requestOrigin}${u.pathname}${u.search}`;
};

const problems = [];

/** Fetches a sitemap file and checks the response is XML a crawler will accept. */
async function loadSitemap(url) {
  const res = await fetch(toRequestUrl(url), { headers, redirect: "manual" });
  const type = res.headers.get("content-type") ?? "";
  if (res.status !== 200) problems.push(`${url}: HTTP ${res.status}`);
  if (!/(application|text)\/xml/.test(type)) problems.push(`${url}: content-type "${type}"`);
  const xml = await res.text();
  const bytes = Buffer.byteLength(xml);
  if (!xml.startsWith("<?xml")) problems.push(`${url}: missing XML declaration`);
  if (bytes > 50 * 1024 * 1024) problems.push(`${url}: ${bytes} bytes exceeds 50 MB`);
  const parsed = parseSitemapXml(xml);
  if (parsed.kind === "unknown") problems.push(`${url}: neither <urlset> nor <sitemapindex>`);
  if (parsed.kind === "urlset") {
    const urlCount = (xml.match(/<url>/g) ?? []).length;
    if (urlCount !== parsed.locs.length) problems.push(`${url}: ${urlCount} <url> but ${parsed.locs.length} <loc>`);
    if (urlCount > 50_000) problems.push(`${url}: ${urlCount} URLs exceeds 50,000`);
  }
  return parsed;
}

const root = await loadSitemap(sitemapUrl);
let urls = root.locs;
const files = [sitemapUrl];
if (root.kind === "sitemapindex") {
  urls = [];
  for (const child of root.locs) {
    files.push(child);
    const sub = await loadSitemap(child);
    if (sub.kind !== "urlset") problems.push(`${child}: nested index or invalid sitemap`);
    urls.push(...sub.locs);
  }
}
if (args.limit) urls = urls.slice(0, Number(args.limit));

console.log(`Sitemap: ${sitemapUrl} (${root.kind}, ${files.length} file(s), ${urls.length} URLs)`);
console.log(`Expected origin: ${expectedOrigin}${requestOrigin ? `, requesting via ${requestOrigin}` : ""}`);
for (const p of problems) console.log(`  ! ${p}`);

const started = Date.now();
const results = await auditUrls(urls, {
  expectedOrigin,
  fetchPage: createFetchPage(fetch, headers),
  requestUrlFor: toRequestUrl,
  concurrency: Number(args.concurrency ?? 4),
  timeoutMs: Number(args.timeout ?? 15_000),
  retries: Number(args.retries ?? 2),
  onResult: (r, done, total) => {
    if (r.status !== "valid" || r.issues.length > 0) {
      console.log(`[${done}/${total}] ${r.status.padEnd(13)} ${r.url}  ${r.issues.join("; ")}`);
    } else if (done % 50 === 0) {
      console.log(`[${done}/${total}] …`);
    }
  },
});

const summary = summarizeAudit(results);
console.log(`\nAudited ${results.length} URLs in ${((Date.now() - started) / 1000).toFixed(1)}s`);
console.table(summary);

if (args.out) {
  writeFileSync(
    args.out,
    JSON.stringify(
      { sitemap: sitemapUrl, expectedOrigin, generatedAt: new Date().toISOString(), problems, summary, results },
      null,
      2
    )
  );
  console.log(`Report written to ${args.out}`);
}

const failing = ["not_found", "soft_404", "server_error", "redirect", "duplicate", "invalid_url"];
process.exitCode = problems.length > 0 || failing.some((s) => summary[s] > 0) ? 1 : 0;
