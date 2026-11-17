#!/usr/bin/env node
/*
 * Tallaby tutorial kit: builds one video's HyperFrames project.
 *
 *   node "Tutorial Videos/_kit/build.mjs" "Tutorial Videos/T-01-add-product"
 *
 * Reads from <video>/work/:
 *   video.mjs    the script: title, steps, timed events (see README.md)
 *   screen.html  the dashboard page(s), rebuilt at 390 x 693 CSS px
 *   screen.css   styles of this page only (shared dashboard styles come from the kit)
 * Writes to <video>/work/:
 *   index.html           the composition (kit styles, overlays and runtime included)
 *   assets/kit/          fonts and logo, copied from the kit
 *   assets/sfx-mix.wav   the five kit sounds placed on the video's cues
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KIT = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(KIT, "..", "..");
const videoDir = resolve(process.argv[2] ?? "");
if (!process.argv[2] || !existsSync(join(videoDir, "work", "video.mjs"))) {
  console.error('Usage: node build.mjs "<Tutorial Videos/T-xx-slug>"   (needs work/video.mjs)');
  process.exit(1);
}
const work = join(videoDir, "work");
const read = (path) => readFileSync(path, "utf8");
const video = (await import(pathToFileURL(join(work, "video.mjs")).href + `?t=${Date.now()}`)).default;

/* ───────────── checks: the rules of TUTORIALS.md that a script can break ───────────── */

const problems = [];
const steps = video.steps ?? [];
if (steps.length < 3 || steps.length > 5) problems.push(`steps: ${steps.length} (must be 3 to 5)`);
if (video.duration < 20 || video.duration > 40) problems.push(`duration ${video.duration}s is outside 20-40 s`);
steps.forEach((step, i) => {
  const end = steps[i + 1]?.at ?? video.resultAt;
  const length = end - step.at;
  if (length < 3.9 || length > 6.1) problems.push(`step ${i + 1} lasts ${length.toFixed(1)}s (4-6 s)`);
  if (step.text.trim().split(/\s+/).length > 8) problems.push(`step ${i + 1} caption is longer than about 7 words`);
});
if (/[٠-٩]/.test(JSON.stringify(video))) problems.push("Arabic-Indic digits found: use 0-9");
if (video.endAt && video.duration - video.endAt < 2.5) problems.push("end card is shorter than 2.5 s");
for (const event of video.events) {
  if (event.op === "tap") {
    const reacts = video.events.some((other) => other !== event && Math.abs(other.t - (event.t + 0.3)) < 0.011);
    if (!reacts) problems.push(`tap at ${event.t}s: nothing reacts 0.3 s later`);
  }
}
if (problems.length) {
  console.error("The script breaks TUTORIALS.md:\n- " + problems.join("\n- "));
  process.exit(1);
}

/* ───────────── assets ───────────── */

const assets = join(work, "assets");
for (const folder of ["fonts", "logo"]) {
  mkdirSync(join(assets, "kit", folder), { recursive: true });
  for (const file of readdirSync(join(KIT, folder))) {
    copyFileSync(join(KIT, folder, file), join(assets, "kit", folder, file));
  }
}

/* ───────────── sound: the five kit sounds on this video's cues ───────────── */

const FRAME = 1 / 30;
const cues = [{ t: 0.05, name: "pop" }];
for (const step of steps) cues.push({ t: step.at - 0.05, name: "whoosh" });
for (const event of video.events) {
  if (event.op === "tap") cues.push({ t: event.t + FRAME, name: "tap" });
  if (event.op === "type") {
    // One tick per letter group, exactly when the runtime shows the group.
    const groups = Math.ceil(Array.from(event.text).length / (event.group || 2));
    for (let i = 1; i <= groups; i++) cues.push({ t: event.t + (i / groups) * event.dur + FRAME, name: "key" });
  }
}
cues.push({ t: video.checkAt + FRAME, name: "success" });

function readWav(path) {
  const buffer = readFileSync(path);
  let offset = 12;
  let format = null;
  while (offset < buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === "fmt ") format = { channels: buffer.readUInt16LE(offset + 10), rate: buffer.readUInt32LE(offset + 12) };
    if (id === "data") {
      if (!format || format.rate !== 48000 || format.channels !== 2) throw new Error(`${path}: expected 48 kHz stereo`);
      return new Int16Array(buffer.buffer, buffer.byteOffset + offset + 8, size / 2);
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error(`${path}: no data chunk`);
}

const RATE = 48000;
const mix = new Float64Array(Math.ceil(video.duration * RATE) * 2);
const sounds = {};
for (const cue of cues) {
  const samples = (sounds[cue.name] ??= readWav(join(KIT, "sfx", `${cue.name}.wav`)));
  const start = Math.round(cue.t * RATE) * 2;
  for (let i = 0; i < samples.length && start + i < mix.length; i++) mix[start + i] += samples[i];
}
const pcm = Buffer.alloc(mix.length * 2);
for (let i = 0; i < mix.length; i++) pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(mix[i]))), i * 2);
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write("WAVEfmt ", 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(RATE, 24);
header.writeUInt32LE(RATE * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(pcm.length, 40);
writeFileSync(join(assets, "sfx-mix.wav"), Buffer.concat([header, pcm]));
writeFileSync(join(work, "sfx-cues.json"), JSON.stringify(cues, null, 1));

/* ───────────── the dashboard screen: kit partials and real Lucide icons ───────────── */

function lucideDir() {
  const pnpm = join(REPO, "node_modules", ".pnpm");
  const pkg = readdirSync(pnpm).find((name) => name.startsWith("lucide-react@"));
  if (!pkg) throw new Error("lucide-react not found in node_modules/.pnpm (run pnpm install)");
  return join(pnpm, pkg, "node_modules", "lucide-react", "dist", "esm", "icons");
}
const icons = lucideDir();
function icon(name, attrs) {
  const file = join(icons, `${name}.js`);
  if (!existsSync(file)) throw new Error(`Lucide icon "${name}" does not exist`);
  // Renamed icons are one-line files pointing at the new name.
  const alias = read(file).match(/export \{ default \} from '\.\/([\w-]+)\.js'/);
  if (alias) return icon(alias[1], attrs);
  const literal = read(file).match(/const __iconNode = (\[[\s\S]*?\]);\s*const \w+ = createLucideIcon/);
  if (!literal) throw new Error(`Cannot read Lucide icon "${name}"`);
  const nodes = new Function(`return ${literal[1]}`)();
  const inner = nodes
    .map(([tag, props]) => {
      const pairs = Object.entries(props).filter(([key]) => key !== "key");
      return `<${tag} ${pairs.map(([key, value]) => `${key}="${value}"`).join(" ")}/>`;
    })
    .join("");
  return `<svg${attrs} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

let screen = read(join(work, "screen.html"));
screen = screen.replace(/<!--\s*@kit\s+([\w-]+)\s*-->/g, (_, name) => read(join(KIT, "dashboard", `${name}.html`)));
screen = screen.replace(/<i data-lucide="([\w-]+)"([^>]*)><\/i>/g, (_, name, attrs) => icon(name, attrs));

/* ───────────── overlays (static HTML, timed with data-start / data-duration) ───────────── */

const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const n = (value) => Number(value.toFixed(3));
const clip = (id, start, duration, track, body, z) =>
  `<div id="${id}" class="clip tk-clip" style="z-index:${z}" data-start="${n(start)}" data-duration="${n(duration)}" data-track-index="${track}" data-track-kind="graphics">${body}</div>`;

const logo = (alt) => `<img class="tk-card-logo" src="assets/kit/logo/logo-white.png" alt="${alt}" />`;
const playIcon = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>`;

const overlays = [];
const capStart = steps[0].at;
const capEnd = video.resultAt;

// Step caption: one card for the whole run of steps.
overlays.push(clip("tk-cap", capStart, capEnd - capStart, 2, `<div id="tk-cap-in"><div class="tk-cap"></div>${dots(-1)}</div>`, 10));

function dots(active) {
  const size = 14;
  const gap = 20;
  const total = steps.length * size + (steps.length - 1) * gap;
  const right = 540 + total / 2; // step 1 is the rightmost dot (RTL)
  const center = (i) => right - size / 2 - i * (size + gap);
  if (active >= 0) return `<span class="tk-dot-on" style="left:${center(active) - 11}px"></span>`;
  const pill = `<span class="tk-dots-pill" style="left:${540 - total / 2 - 20}px;width:${total + 40}px"></span>`;
  return pill + steps.map((_, i) => `<span class="tk-dot" style="left:${center(i) - size / 2}px"></span>`).join("");
}

steps.forEach((step, i) => {
  const end = steps[i + 1]?.at ?? capEnd;
  overlays.push(
    clip(
      `tk-step-${i + 1}`,
      step.at,
      end - step.at,
      3,
      `${dots(i)}<div id="tk-step-${i + 1}-in" class="tk-step" data-layout-allow-safe-zone><span class="tk-step-num" data-layout-allow-safe-zone>${i + 1}</span><span class="tk-step-text" data-layout-allow-safe-zone>${esc(step.text)}</span></div>`,
      11,
    ),
  );
});

let hl = 0;
let tap = 0;
for (const event of [...video.events].sort((a, b) => a.t - b.t)) {
  if (event.op === "hl") {
    overlays.push(clip(`tk-hl-${++hl}`, event.t, event.dur, 4, `<div class="tk-hl"></div>`, 20));
  }
  if (event.op === "tap") {
    overlays.push(
      clip(`tk-tap-${++tap}`, event.t, 0.75, 5, `<div class="tk-tap"><span class="tk-tap-ripple"></span><span class="tk-tap-ring"></span></div>`, 30),
    );
  }
}

overlays.push(
  clip(
    "tk-check",
    video.checkAt,
    1.5,
    6,
    `<div id="tk-check-in" class="tk-check"><svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path id="tk-check-path" d="M11 25.5 20.5 35 38 15" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="60" stroke-dashoffset="0"/></svg></div>`,
    40,
  ),
);

overlays.push(
  clip(
    "tk-end",
    video.endAt,
    video.duration - video.endAt,
    7,
    `<div id="tk-end-in" class="tk-card">${logo("Tallaby")}<div class="tk-end-line">${esc(video.endLine ?? "جرّبها الآن من لوحة التحكم")}</div><div class="tk-end-crumbs"><div>${video.breadcrumbs
      .map((crumb, i, all) => (i === all.length - 1 ? `<b>${esc(crumb)}</b>` : `<span>${esc(crumb)}</span><i>‹</i>`))
      .join("")}</div></div></div>`,
    60,
  ),
);

overlays.push(
  clip(
    "tk-title",
    0,
    capStart + 0.32,
    8,
    `<div id="tk-title-in" class="tk-card">${logo("Tallaby")}<div class="tk-title-block"><span class="tk-title-label">${playIcon}${esc(video.label ?? "شرح سريع")}</span><div class="tk-title-text">${esc(video.title)}</div><div class="tk-title-rule"></div></div></div>`,
    70,
  ),
);

/* ───────────── index.html ───────────── */

const fontFace = (family, file, weight) =>
  `@font-face{font-family:"${family}";src:url("assets/kit/fonts/${file}") format("woff2");font-weight:${weight};font-style:normal;font-display:block}`;
const fonts = [
  ...[400, 500, 600, 700].map((w) => fontFace("Noto Kufi Arabic", `noto-kufi-arabic-arabic-${w}-normal.woff2`, w)),
  ...[400, 600, 700].map((w) => fontFace("Montserrat", `montserrat-latin-${w}-normal.woff2`, w)),
].join("\n");

const runtime = video;
const html = `<!doctype html>
<!-- Built by Tutorial Videos/_kit/build.mjs. Edit work/video.mjs, screen.html or screen.css, then build again. -->
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
${fonts}
${read(join(KIT, "kit.css"))}
${read(join(KIT, "dashboard", "dashboard.css"))}
${existsSync(join(work, "screen.css")) ? read(join(work, "screen.css")) : ""}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${n(video.duration)}" data-width="1080" data-height="1920">
      <div id="tk-stage" data-layout-ignore data-layout-allow-overflow>
        <div id="tk-cam">
          <div id="tk-fit" class="db">
${screen}
          </div>
        </div>
      </div>
      <div id="tk-overlay">
        ${overlays.join("\n        ")}
      </div>
      <audio id="tk-sfx" class="clip" data-start="0" data-duration="${n(video.duration)}" data-track-index="9" data-volume="1" src="assets/sfx-mix.wav"></audio>
    </div>
    <script>
      window.TK_VIDEO = ${JSON.stringify(runtime)};
    </script>
    <script>
${read(join(KIT, "kit.js"))}
    </script>
  </body>
</html>
`;
writeFileSync(join(work, "index.html"), html);
console.log(
  `Built ${join(work, "index.html")}\n  ${steps.length} steps, ${video.duration}s, ${cues.length} sound cues (${["pop", "tap", "key", "whoosh", "success"]
    .map((name) => `${cues.filter((cue) => cue.name === name).length} ${name}`)
    .join(", ")})`,
);
