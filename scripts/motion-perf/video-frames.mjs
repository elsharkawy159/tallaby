// Contact sheet of a webm: N frames side by side, grabbed by seeking a <video> in Chromium (no ffmpeg needed).
// Usage: node video-frames.mjs <video.webm> <out.png> [frames=12] [--pw=<folder with playwright>]
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const [video, out, nArg] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const pwFlag = process.argv.find((a) => a.startsWith("--pw="));
const PW_DIR = pwFlag ? pwFlag.slice(5) : path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..", "perf");
const { chromium } = createRequire(path.join(PW_DIR, "package.json"))("playwright");
const N = Number(nArg ?? 12);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1800, height: 900 } });
const src = "data:video/webm;base64," + fs.readFileSync(video).toString("base64");
await page.setContent(`<body style="margin:0;background:#222"><video id=v muted preload=auto></video><div id=g style="display:flex;flex-wrap:wrap;gap:4px"></div></body>`);
await page.evaluate(
  async ({ src, N }) => {
    const v = document.getElementById("v");
    v.src = src;
    await new Promise((r) => (v.onloadeddata = r));
    // webm from Playwright often reports Infinity duration until seeked to the end.
    if (!isFinite(v.duration)) {
      v.currentTime = 1e9;
      await new Promise((r) => (v.onseeked = r));
    }
    const dur = v.duration;
    const g = document.getElementById("g");
    const w = 1800 / Math.min(N, 6) - 6;
    for (let i = 0; i < N; i++) {
      v.currentTime = (dur * (i + 0.5)) / N;
      await new Promise((r) => (v.onseeked = r));
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d").drawImage(v, 0, 0);
      c.style.width = w + "px";
      const box = document.createElement("div");
      box.style.cssText = "color:#fff;font:12px sans-serif";
      box.append(c, document.createTextNode(` t=${v.currentTime.toFixed(1)}s`));
      g.append(box);
    }
    v.remove();
  },
  { src, N },
);
await page.locator("#g").screenshot({ path: out });
await browser.close();
console.log(out);
