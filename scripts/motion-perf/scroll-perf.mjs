// Storefront scroll-performance baseline (motion v2 "before"/"after").
// Usage (run from anywhere; playwright is resolved from --pw or the default perf folder):
//   node scroll-perf.mjs <baseUrl> <outDir> [--pages=ar/template-preview/tallaby-classic,...] [--profiles=390,1280]
//   e.g. node scroll-perf.mjs http://localhost:3000 "F:/Programming Projects/tallaby/docs/motion-v2/before"
// Writes <outDir>/<slug>-<390|1280>.webm (slow-scroll video) and the results JSON to --json= (default <script>/../perf-work/results-<outDir name>.json). --traces keeps Chrome traces in --work=.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const args = process.argv.slice(2);
const flag = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};
const positional = args.filter((a) => !a.startsWith("--"));
const BASE = (positional[0] ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = path.resolve(positional[1] ?? "./out");
const PW_DIR = flag("pw", path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..", "perf"));
const PAGES = flag("pages", "template-preview/tallaby-classic,template-preview/fashion-luxe,template-preview/perfumes-luxe,en/template-preview/fashion-luxe").split(",");
const PROFILES = flag("profiles", "390,1280").split(",");
const SLOW_PX = Number(flag("slow", "12")); // px per frame (~720 px/s at 60 fps)
const FAST_PX = Number(flag("fast", "80")); // px per frame (~4800 px/s)
const KEEP_TRACES = args.includes("--traces");
// Scratch (traces, video temp) and the results file live outside the repo by default.
const WORK = path.resolve(flag("work", path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..", "perf-work")));
const JSON_OUT = path.resolve(flag("json", path.join(WORK, `results-${path.basename(OUT)}.json`)));
fs.mkdirSync(WORK, { recursive: true });

const require = createRequire(path.join(PW_DIR, "package.json"));
const { chromium } = require("playwright");
fs.mkdirSync(OUT, { recursive: true });

const PROFILE_DEFS = {
  390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, cpu: 4 },
  1280: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, cpu: 1 },
};

// Injected before any page script.
const INIT = () => {
  const P = (window.__perf = { phase: "load", frames: [], longtasks: [], shifts: [], events: [], lcp: 0, marks: {} });
  const sel = (n) => {
    if (!n || n.nodeType !== 1) return n ? n.nodeName : "null";
    const parts = [];
    let el = n;
    for (let i = 0; el && el.nodeType === 1 && i < 4; i++, el = el.parentElement) {
      let s = el.tagName.toLowerCase();
      if (el.id) s += "#" + el.id;
      const cls = [...el.classList].filter((c) => !c.startsWith("sf-") || c === "sf-motion").slice(0, 2);
      if (cls.length) s += "." + cls.join(".");
      for (const a of ["data-reveal", "data-carousel", "data-carousel-track", "data-sf-node", "data-field"]) if (el.hasAttribute(a)) s += `[${a}${el.getAttribute(a) ? "=" + el.getAttribute(a).slice(0, 20) : ""}]`;
      parts.unshift(s);
    }
    return parts.join(" > ");
  };
  const obs = (type, fn, extra = {}) => {
    try {
      new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({ type, buffered: true, ...extra });
    } catch {}
  };
  obs("layout-shift", (e) => {
    if (e.hadRecentInput) return;
    P.shifts.push({
      t: e.startTime,
      v: e.value,
      phase: P.phase,
      sources: (e.sources || []).map((s) => ({
        sel: sel(s.node),
        reveal: !!(s.node && s.node.nodeType === 1 && (s.node.closest("[data-reveal]") || s.node.closest(".is-inview"))),
        prev: s.previousRect && [s.previousRect.y | 0, s.previousRect.height | 0],
        cur: s.currentRect && [s.currentRect.y | 0, s.currentRect.height | 0],
      })),
    });
  });
  obs("longtask", (e) => P.longtasks.push({ t: e.startTime, d: e.duration, phase: P.phase }));
  obs("event", (e) => P.events.push({ name: e.name, d: e.duration, id: e.interactionId, phase: P.phase, target: sel(e.target) }), { durationThreshold: 16 });
  obs("largest-contentful-paint", (e) => (P.lcp = e.startTime));
  let last = 0;
  const loop = (t) => {
    if (last) P.frames.push({ d: t - last, phase: P.phase });
    last = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  // Keep the run read-only: no link navigates, no form submits.
  window.addEventListener("click", (e) => { if (e.target instanceof Element && e.target.closest("a")) e.preventDefault(); }, true);
  window.addEventListener("submit", (e) => e.preventDefault(), true);
};

const pct = (arr, p) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
const r1 = (n) => Math.round(n * 10) / 10;

function frameStats(frames) {
  const d = frames.map((f) => f.d);
  // over16: a frame longer than one 60 Hz vsync plus slop (>20 ms); over33: two or more vsyncs missed.
  return { frames: d.length, over16: d.filter((x) => x > 20).length, over33: d.filter((x) => x > 33.4).length, p50: r1(pct(d, 50)), p95: r1(pct(d, 95)), max: r1(Math.max(0, ...d)) };
}

// Real wheel input (browser-driven scroll, like a user), so no page-side JS forces layout on our behalf.
async function scrollToBottom(page, px) {
  const t0 = Date.now();
  await page.mouse.move(page.viewportSize().width / 2, page.viewportSize().height / 2);
  let last = -1;
  let still = 0;
  for (let i = 0; Date.now() - t0 < 90000; i++) {
    await page.mouse.wheel(0, px);
    await page.waitForTimeout(16);
    if (i % 15 === 14) {
      const { y, end } = await page.evaluate(() => ({ y: scrollY, end: scrollY + innerHeight >= document.documentElement.scrollHeight - 2 }));
      still = end || y === last ? still + 1 : 0;
      last = y;
      if (still >= 2) break;
    }
  }
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  return { ms: Date.now() - t0, height };
}

async function metrics(cdp) {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
}
function metricDiff(a, b) {
  const keys = ["LayoutCount", "RecalcStyleCount", "LayoutDuration", "RecalcStyleDuration", "ScriptDuration", "TaskDuration"];
  return Object.fromEntries(keys.map((k) => [k, k.endsWith("Duration") ? Math.round((b[k] - a[k]) * 1000) : b[k] - a[k]]));
}

// Forced layouts: Layout / UpdateLayoutTree events nested in a JS task on the renderer main thread.
function analyzeTrace(file) {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const events = raw.traceEvents ?? raw;
  const threads = new Map();
  for (const e of events) if (e.name === "thread_name" && e.args?.name === "CrRendererMain") threads.set(`${e.pid}:${e.tid}`, true);
  const JS = new Set(["FunctionCall", "EvaluateScript", "v8.callFunction", "TimerFire", "FireAnimationFrame", "EventDispatch", "FireIdleCallback", "RunMicrotasks", "V8.Execute", "v8.run"]);
  const out = { layouts: 0, layoutMs: 0, forcedLayouts: 0, forcedLayoutMs: 0, styleRecalcs: 0, forcedStyle: 0, forcedBy: {} };
  for (const key of threads.keys()) {
    const evs = events.filter((e) => `${e.pid}:${e.tid}` === key && e.ph === "X" && typeof e.dur === "number").sort((a, b) => a.ts - b.ts);
    const js = evs.filter((e) => JS.has(e.name));
    const inJs = (e) => js.filter((j) => j.ts <= e.ts && j.ts + j.dur >= e.ts + e.dur).sort((a, b) => b.ts - a.ts)[0];
    for (const e of evs) {
      if (e.name !== "Layout" && e.name !== "UpdateLayoutTree") continue;
      const host = inJs(e);
      if (e.name === "Layout") {
        out.layouts++;
        out.layoutMs += e.dur / 1000;
        if (host) {
          out.forcedLayouts++;
          out.forcedLayoutMs += e.dur / 1000;
          const d = host.args?.data ?? {}; const fn = d.url ? `${d.functionName || "(anon)"}@${d.url.split("/").pop()}:${d.lineNumber ?? ""}:${d.columnNumber ?? ""}` : host.name;
          out.forcedBy[fn] = (out.forcedBy[fn] || 0) + 1;
        }
      } else {
        out.styleRecalcs++;
        if (host) out.forcedStyle++;
      }
    }
  }
  // Script time by function (FunctionCall events on the main thread), top 8.
  const by = {};
  for (const e of events) {
    if (e.name !== "FunctionCall" || e.ph !== "X" || !threads.has(`${e.pid}:${e.tid}`)) continue;
    const d = e.args?.data ?? {};
    const k = `${d.functionName || "(anon)"}@${(d.url || "").split("/").pop()}:${d.lineNumber ?? ""}:${d.columnNumber ?? ""}`;
    by[k] = (by[k] || 0) + e.dur / 1000;
  }
  out.scriptBy = Object.fromEntries(Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => [k, r1(v)]));
  out.layoutMs = r1(out.layoutMs);
  out.forcedLayoutMs = r1(out.forcedLayoutMs);
  return out;
}

async function openPage(browser, prof, video) {
  const ctx = await browser.newContext({
    viewport: prof.viewport,
    deviceScaleFactor: prof.deviceScaleFactor,
    isMobile: prof.isMobile,
    hasTouch: prof.hasTouch,
    ...(video ? { recordVideo: { dir: path.join(WORK, ".video-tmp"), size: prof.viewport } } : {}),
  });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Performance.enable");
  if (prof.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: prof.cpu });
  return { ctx, page, cdp };
}

async function stuckHidden(page) {
  return page.evaluate(() => {
    const hidden = [];
    for (const el of document.querySelectorAll(".sf-motion *")) {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      const cs = getComputedStyle(el);
      if (cs.opacity !== "0" || cs.visibility === "hidden" || cs.display === "none") continue;
      if (el.closest("dialog:not([open]), [aria-hidden='true'], [inert]")) continue;
      hidden.push({ tag: el.tagName.toLowerCase(), reveal: el.getAttribute("data-reveal"), inview: el.classList.contains("is-inview"), cls: el.className?.toString?.().slice(0, 60) });
    }
    return { count: hidden.length, revealCount: hidden.filter((h) => h.reveal !== null).length, sample: hidden.slice(0, 8), stillMarked: document.querySelectorAll("[data-reveal]").length };
  });
}

async function runSlow(browser, slug, size, pageUrl) {
  const prof = PROFILE_DEFS[size];
  const { ctx, page, cdp } = await openPage(browser, prof, true);
  const resp = await page.goto(pageUrl, { waitUntil: "load", timeout: 120000 });
  const status = resp?.status();
  await page.waitForTimeout(2000);
  const loadState = await page.evaluate(() => ({ lcp: Math.round(window.__perf.lcp), motionRoot: !!document.querySelector(".sf-motion"), reveal: document.querySelectorAll("[data-reveal]").length, carousels: document.querySelectorAll("[data-carousel]").length }));
  const m0 = await metrics(cdp);
  const traceFile = path.join(WORK, `trace-${slug}-${size}.json`);
  await browser.startTracing(page, { path: traceFile, categories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "v8.execute"] });
  await page.evaluate(() => (window.__perf.phase = "scroll"));
  const scroll = await scrollToBottom(page, SLOW_PX);
  await page.evaluate(() => (window.__perf.phase = "after"));
  await browser.stopTracing();
  const m1 = await metrics(cdp);
  await page.waitForTimeout(4000); // let the last reveals finish (longest 3.6 s)
  const stuck = await stuckHidden(page);
  const P = await page.evaluate(() => window.__perf);
  const trace = analyzeTrace(traceFile);
  if (!KEEP_TRACES) fs.rmSync(traceFile, { force: true });
  const video = page.video();
  await ctx.close();
  const target = path.join(OUT, `${slug}-${size}.webm`);
  await video.saveAs(target);
  await video.delete();
  return { status, loadState, scroll, P, cdp: metricDiff(m0, m1), trace, stuck, video: target };
}

async function runFast(browser, size, pageUrl) {
  const prof = PROFILE_DEFS[size];
  const { ctx, page, cdp } = await openPage(browser, prof, false);
  await page.goto(pageUrl, { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(2000);
  const m0 = await metrics(cdp);
  await page.evaluate(() => (window.__perf.phase = "scroll"));
  const scroll = await scrollToBottom(page, FAST_PX);
  await page.evaluate(() => (window.__perf.phase = "after"));
  const m1 = await metrics(cdp);
  await page.waitForTimeout(4000);
  const stuck = await stuckHidden(page);
  // Interactions.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(500);
  await page.evaluate(() => (window.__perf.phase = "interact"));
  const tried = [];
  const tryClick = async (label, selector) => {
    const loc = page.locator(selector).filter({ visible: true }).first();
    try {
      if ((await loc.count()) === 0) return tried.push({ label, ok: false, why: "none visible" });
      await loc.scrollIntoViewIfNeeded({ timeout: 5000 });
      await page.waitForTimeout(400);
      await loc.click({ timeout: 5000 });
      await page.waitForTimeout(800);
      tried.push({ label, ok: true });
    } catch (e) {
      tried.push({ label, ok: false, why: String(e.message).split("\n")[0].slice(0, 120) });
    }
  };
  await tryClick("carousel arrow/dot", "[data-carousel-go], [data-carousel-dot]");
  await tryClick("product card link", "a[href*='/product']");
  if (size === "390") {
    await tryClick("header burger", "[data-sf-menu-open]");
    await page.keyboard.press("Escape").catch(() => {});
  }
  await page.waitForTimeout(500);
  const P = await page.evaluate(() => window.__perf);
  await ctx.close();
  const ev = P.events.filter((e) => e.phase === "interact");
  const byInteraction = {};
  for (const e of ev) if (e.id) byInteraction[e.id] = Math.max(byInteraction[e.id] || 0, e.d);
  return {
    scroll,
    frames: frameStats(P.frames.filter((f) => f.phase === "scroll")),
    longtasks: sumLT(P.longtasks.filter((l) => l.phase === "scroll")),
    cls: r1s(P.shifts.filter((s) => s.phase === "scroll").reduce((a, s) => a + s.v, 0)),
    cdp: metricDiff(m0, m1),
    stuck,
    interactions: tried,
    inpApprox: Math.max(0, ...Object.values(byInteraction)),
    events: ev.map((e) => ({ name: e.name, d: e.d, target: e.target })),
  };
}
const sumLT = (l) => ({ count: l.length, totalMs: Math.round(l.reduce((a, x) => a + x.d, 0)), maxMs: Math.round(Math.max(0, ...l.map((x) => x.d))) });
const r1s = (n) => Math.round(n * 10000) / 10000;

const browser = await chromium.launch({ args: ["--disable-features=PaintHolding"] });
const results = { base: BASE, chrome: browser.version(), date: new Date().toISOString(), slowPxPerFrame: SLOW_PX, fastPxPerFrame: FAST_PX, runs: [] };
for (const p of PAGES) {
  const slug = p.split("/").filter(Boolean).slice(-1)[0] + (p.startsWith("en/") ? "-en" : "");
  for (const size of PROFILES) {
    const pageUrl = `${BASE}/${p}`;
    console.log(`→ ${pageUrl} @ ${size}`);
    try {
      const slow = await runSlow(browser, slug, size, pageUrl);
      const fast = await runFast(browser, size, pageUrl);
      const P = slow.P;
      const shiftsAll = P.shifts;
      const run = {
        page: p,
        slug,
        size,
        status: slow.status,
        load: { ...slow.loadState, longtasks: sumLT(P.longtasks.filter((l) => l.phase === "load")), frames: frameStats(P.frames.filter((f) => f.phase === "load")) },
        slow: {
          scroll: slow.scroll,
          frames: frameStats(P.frames.filter((f) => f.phase === "scroll")),
          longtasks: sumLT(P.longtasks.filter((l) => l.phase === "scroll")),
          cdp: slow.cdp,
          trace: slow.trace,
        },
        fast,
        cls: {
          total: r1s(shiftsAll.reduce((a, s) => a + s.v, 0)),
          duringLoad: r1s(shiftsAll.filter((s) => s.phase === "load").reduce((a, s) => a + s.v, 0)),
          duringScroll: r1s(shiftsAll.filter((s) => s.phase === "scroll").reduce((a, s) => a + s.v, 0)),
          afterScroll: r1s(shiftsAll.filter((s) => s.phase === "after").reduce((a, s) => a + s.v, 0)),
          shifts: shiftsAll.filter((s) => s.v > 0.0001).map((s) => ({ t: Math.round(s.t), v: r1s(s.v), phase: s.phase, sources: s.sources })),
        },
        stuck: slow.stuck,
        video: slow.video,
      };
      results.runs.push(run);
      console.log(JSON.stringify({ size, slowFrames: run.slow.frames, slowLT: run.slow.longtasks, fastFrames: fast.frames, cls: run.cls.total, clsScroll: run.cls.duringScroll, inp: fast.inpApprox, cdp: run.slow.cdp, forced: run.slow.trace.forcedLayouts, stuck: run.stuck.revealCount }));
    } catch (e) {
      console.error(`  failed: ${e.message}`);
      results.runs.push({ page: p, size, error: e.message });
    }
  }
}
await browser.close();
fs.rmSync(path.join(WORK, ".video-tmp"), { recursive: true, force: true });
fs.writeFileSync(JSON_OUT, JSON.stringify(results, null, 2));
console.log(`results: ${JSON_OUT}`);
