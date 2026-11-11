// Where are the reveal elements that never got is-inview? Usage: node stuck-probe.mjs <url> [width]
import { createRequire } from "node:module";
import path from "node:path";
import url from "node:url";
const { chromium } = createRequire(path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..", "perf", "package.json"))("playwright");
const [u, w = "390"] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: 844 } });
await p.goto(u, { waitUntil: "load" });
await p.waitForTimeout(1500);
await p.mouse.move(100, 100);
for (let i = 0; i < 400; i++) { await p.mouse.wheel(0, 60); await p.waitForTimeout(16); }
await p.waitForTimeout(4000);
console.log(JSON.stringify(await p.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("[data-reveal]:not(.is-inview)")) {
    const r = el.getBoundingClientRect();
    let sc = el.parentElement, scInfo = null;
    while (sc && sc !== document.body) { const cs = getComputedStyle(sc); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX)) { const sr = sc.getBoundingClientRect(); scInfo = { tag: sc.tagName, cls: sc.className.toString().slice(0, 70), ox: cs.overflowX, left: sr.left | 0, right: sr.right | 0, rail: sc.hasAttribute("data-rail") }; break; } sc = sc.parentElement; }
    out.push({ left: r.left | 0, top: (r.top + scrollY) | 0, w: r.width | 0, h: r.height | 0, sc: scInfo, txt: el.textContent.trim().slice(0, 25) });
  }
  return { vw: innerWidth, count: out.length, items: out.slice(0, 30) };
}), null, 0));
await b.close();
