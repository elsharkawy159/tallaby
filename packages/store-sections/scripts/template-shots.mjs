// Gallery card screenshots of the templates' home pages (owner, 2026-11-12 desktop; 2026-11-15 phone).
//
//   node packages/store-sections/scripts/template-shots.mjs [--keys a,b] [--base http://localhost:3000] [--list]
//
// Needs tallaby.com (apps/ecommerce) running (`pnpm --filter ecommerce dev`); it draws each template
// with its niche pack at `/template-preview/<key>?edition=<niche>`. For every key and language (ar, en)
// it shoots the whole home page twice and writes WebP files to apps/ecommerce/public/template-previews:
//   <key>.<locale>.webp         drawn 1280 px wide, stored 600 px wide (at most 6000 CSS px tall)
//   <key>.<locale>.mobile.webp  drawn 400 px wide at 2x, stored 600 px wide (at most 6000 CSS px tall)
// then rewrites src/templates/preview-shots.generated.ts from every file in that folder.
//
// --keys   template keys to shoot (default: every "ready" row of NICHE_TEMPLATES whose pack, or
//          native template, draws the generated photos (`editionPhoto(`)). Re-run with new keys as
//          more niches become ready; files of other templates are kept.
// --list   print the default keys and exit.
// --manifest-only  rewrite the manifest from the files without shooting.
//
// Playwright is not a dependency of the repo: point PLAYWRIGHT_DIR at an installed `playwright` or
// `playwright-core` package (e.g. `npm i --prefix F:/tmp-build/pw playwright-core`, then
// PLAYWRIGHT_DIR=F:/tmp-build/pw/node_modules/playwright-core). CHROME_PATH picks the browser
// (default: the newest Playwright Chromium in %LOCALAPPDATA%/ms-playwright). sharp comes from Next.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const TEMPLATES = path.join(ROOT, "packages/store-sections/src/templates");
const OUT = path.join(ROOT, "apps/ecommerce/public/template-previews");
const MANIFEST = path.join(TEMPLATES, "preview-shots.generated.ts");

/** How each kind of shot is drawn and stored. */
const KINDS = {
  desktop: { suffix: "", viewport: { width: 1280, height: 800 }, scale: 1, mobile: false, maxCssHeight: 6000, storedWidth: 600, quality: 72 },
  mobile: { suffix: ".mobile", viewport: { width: 400, height: 860 }, scale: 2, mobile: true, maxCssHeight: 6000, storedWidth: 600, quality: 66 },
};
const LOCALES = ["ar", "en"];

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

/** NICHE_TEMPLATES rows (one per line in niche-templates.ts, as that file requires). */
function nicheRows() {
  const source = fs.readFileSync(path.join(TEMPLATES, "editions/niche-templates.ts"), "utf8");
  const re = /\{\s*niche:\s*"([^"]+)",\s*template:\s*"([^"]+)"(?:,\s*edition:\s*"([^"]+)")?,\s*status:\s*"([^"]+)"\s*\}/g;
  return [...source.matchAll(re)].map(([, niche, template, edition, status]) => ({ niche, template, edition: edition ?? null, status }));
}

function filesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? filesUnder(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

/** Ready rows that draw the generated photos: the pack (edition rows) or the template itself (native rows). */
function readyKeys(rows) {
  const packs = filesUnder(path.join(TEMPLATES, "editions/packs"));
  const usesPhotos = (file) => !!file && fs.existsSync(file) && fs.readFileSync(file, "utf8").includes("editionPhoto(");
  return rows
    .filter((row) => row.status === "ready")
    .filter((row) => usesPhotos(row.edition ? packs.find((f) => path.basename(f) === `${row.edition}.ts`) : path.join(TEMPLATES, row.template, "index.ts")))
    .map((row) => row.template);
}

/** A WebP file's pixel size from its header (VP8, VP8L or VP8X). */
function webpSize(file) {
  const b = fs.readFileSync(file);
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
}

/** Rewrites the manifest from every complete set of files in the folder (both languages' desktop shots; phone shots when both exist). */
function writeManifest(rows) {
  const editionOf = new Map(rows.map((row) => [row.template, row.edition]));
  const files = new Set(fs.readdirSync(OUT));
  const keys = [...new Set([...files].map((f) => f.match(/^(.+)\.(ar|en)\.webp$/)?.[1]).filter(Boolean))].sort();
  const entries = {};
  for (const key of keys) {
    if (!editionOf.has(key)) {
      console.warn(`skip ${key}: not in NICHE_TEMPLATES`);
      continue;
    }
    if (!LOCALES.every((l) => files.has(`${key}.${l}.webp`))) {
      console.warn(`skip ${key}: a language's desktop shot is missing`);
      continue;
    }
    const withMobile = LOCALES.every((l) => files.has(`${key}.${l}.mobile.webp`));
    const entry = { edition: editionOf.get(key) };
    for (const l of LOCALES) {
      entry[l] = { desktop: webpSize(path.join(OUT, `${key}.${l}.webp`)), ...(withMobile ? { mobile: webpSize(path.join(OUT, `${key}.${l}.mobile.webp`)) } : {}) };
    }
    entries[key] = entry;
  }
  const body = Object.entries(entries)
    .map(([key, e]) => {
      const size = (s) => `{ width: ${s.width}, height: ${s.height} }`;
      const locale = (l) => `${l}: { desktop: ${size(e[l].desktop)}${e[l].mobile ? `, mobile: ${size(e[l].mobile)}` : ""} }`;
      return `  ${JSON.stringify(key)}: { edition: ${JSON.stringify(e.edition)}, ${locale("ar")}, ${locale("en")} },`;
    })
    .join("\n");
  fs.writeFileSync(
    MANIFEST,
    `// Generated by packages/store-sections/scripts/template-shots.mjs from the files in\n// apps/ecommerce/public/template-previews. Do not edit by hand: re-run the script.\nimport type { TemplatePreviewShots } from "./types";\n\nexport const PREVIEW_SHOTS: Readonly<Record<string, TemplatePreviewShots>> = {\n${body}\n};\n`,
  );
  console.log(`manifest: ${Object.keys(entries).length} templates -> ${path.relative(ROOT, MANIFEST)}`);
}

function loadPlaywright() {
  const dir = process.env.PLAYWRIGHT_DIR;
  const req = createRequire(dir ? path.join(path.resolve(dir), "package.json") : import.meta.url);
  try {
    return dir ? req(path.resolve(dir)) : req("playwright");
  } catch {
    throw new Error("Playwright not found: set PLAYWRIGHT_DIR to an installed playwright or playwright-core package (see the header of this script).");
  }
}

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "ms-playwright");
  if (!base || !fs.existsSync(base)) return undefined;
  const found = fs
    .readdirSync(base)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
    .map((d) => path.join(base, d, "chrome-win64/chrome.exe"))
    .find((exe) => fs.existsSync(exe));
  return found;
}

/** No motion in a still: transitions, animations and smooth scrolling off. */
const STILL_CSS = `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition:none!important;caret-color:transparent!important}html{scroll-behavior:auto!important}`;

/** Scrolls the page through so lazy images load and reveal-on-scroll sections show, then waits for images and fonts. */
async function settle(page, maxCssHeight) {
  await page.addStyleTag({ content: STILL_CSS });
  await page.evaluate(async (limit) => {
    const pause = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = Math.max(300, Math.floor(innerHeight * 0.8));
    for (let y = 0; y < Math.min(document.documentElement.scrollHeight, limit + innerHeight); y += step) {
      scrollTo(0, y);
      await pause(120);
    }
    scrollTo(0, 0);
    // Fixed layers below the top (the phone bottom bar, pop-ups, Next's dev badge) would land mid-page
    // in a full-page shot; a fixed header at the top stays.
    document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    for (const el of document.body.querySelectorAll("*"))
      if (getComputedStyle(el).position === "fixed" && el.getBoundingClientRect().top > 120) el.style.setProperty("display", "none", "important");
    for (const img of document.images) img.loading = "eager";
    await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => ((img.onload = r), (img.onerror = r), setTimeout(r, 15000))))));
    await document.fonts.ready;
  }, maxCssHeight);
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(600);
}

async function shoot(browser, sharp, key, edition, locale, kindName) {
  const kind = KINDS[kindName];
  const context = await browser.newContext({
    viewport: kind.viewport,
    deviceScaleFactor: kind.scale,
    isMobile: kind.mobile,
    hasTouch: kind.mobile,
    reducedMotion: "reduce",
    locale: locale === "en" ? "en-US" : "ar-EG",
  });
  try {
    const page = await context.newPage();
    const url = `${BASE}/${locale === "en" ? "en/" : ""}template-preview/${key}${edition ? `?edition=${encodeURIComponent(edition)}` : ""}`;
    const res = await page.goto(url, { waitUntil: "load", timeout: 300000 });
    debug(`loaded ${url}`);
    if (!res || !res.ok()) throw new Error(`${url}: HTTP ${res?.status()}`);
    await settle(page, kind.maxCssHeight);
    debug("settled");
    const cssHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const height = Math.min(cssHeight, kind.maxCssHeight);
    const png = await page.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: kind.viewport.width, height }, animations: "disabled" });
    const file = path.join(OUT, `${key}.${locale}${kind.suffix}.webp`);
    const info = await sharp(png).resize({ width: kind.storedWidth }).webp({ quality: kind.quality, effort: 6, smartSubsample: true }).toFile(file);
    console.log(`${path.basename(file).padEnd(36)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB  (page ${cssHeight} css px${cssHeight > height ? `, cut at ${height}` : ""})`);
  } finally {
    await context.close();
  }
}

const debug = (message) => process.env.SHOTS_DEBUG && console.log(`  … ${message}`);
const BASE = (option("--base") ?? "http://localhost:3000").replace(/\/+$/, "");
const rows = nicheRows();

if (flag("--list")) {
  console.log(readyKeys(rows).join(","));
  process.exit(0);
}
if (!flag("--manifest-only")) {
  const keys = option("--keys") ? option("--keys").split(",").map((k) => k.trim()).filter(Boolean) : readyKeys(rows);
  const editionOf = new Map(rows.map((row) => [row.template, row.edition]));
  const unknown = keys.filter((k) => !editionOf.has(k));
  if (unknown.length) throw new Error(`Not in NICHE_TEMPLATES: ${unknown.join(", ")}`);
  const nextDir = path.dirname(createRequire(import.meta.url).resolve("next/package.json", { paths: [path.join(ROOT, "apps/ecommerce")] }));
  const sharp = createRequire(path.join(nextDir, "package.json"))("sharp");
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: chromePath() });
  const failed = [];
  try {
    console.log(`shooting ${keys.length}: ${keys.join(", ")}`);
    for (const key of keys)
      for (const locale of LOCALES)
        for (const kind of Object.keys(KINDS)) {
          try {
            await shoot(browser, sharp, key, editionOf.get(key), locale, kind);
          } catch (error) {
            failed.push(`${key}.${locale}.${kind}`);
            console.error(`FAILED ${key} ${locale} ${kind}: ${error.message}`);
          }
        }
  } finally {
    await browser.close();
  }
  if (failed.length) console.error(`failed: ${failed.join(", ")}`);
}
writeManifest(rows);
