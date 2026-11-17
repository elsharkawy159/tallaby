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
 *   sfx-cues.json        where each sound was placed
 * and, when video.mjs has a `voice` block (needs ffmpeg on PATH):
 *   assets/voice-mix.wav the voiceover alone, each sentence on its beat
 *   assets/audio-mix.wav voice + sounds: the video's sound
 *   voice-cues.json      where each sentence was placed, the gain used and the measured loudness
 */
import { spawnSync } from "node:child_process";
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
  // A step may run to 7 s when its spoken sentence needs the room (TUTORIALS.md 5.1).
  const longest = video.voice ? 7 : 6;
  if (length < 3.9 || length > longest + 0.1) problems.push(`step ${i + 1} lasts ${length.toFixed(1)}s (4-${longest} s)`);
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

/* The voiceover: one sentence per beat, placed 0.3 s after the beat starts. The video follows the voice. */
const VOICE_DELAY = 0.3; // after the title card, a step's caption or the result appears
const VOICE_GAP = 0.4; // quiet between two sentences
const voicePlan = [];
if (video.voice) {
  const v = video.voice;
  if (!v.src || !existsSync(join(work, v.src))) problems.push(`voice.src not found: ${v.src}`);
  if (!v.opening || !v.closing || !Array.isArray(v.steps) || v.steps.length !== steps.length) {
    problems.push(`voice needs "opening", "closing" and one entry in "steps" per step (${steps.length})`);
  } else {
    const beats = [
      { beat: "opening", label: "the opening", at: 0, chunk: v.opening },
      ...steps.map((step, i) => ({ beat: `step ${i + 1}`, label: `step ${i + 1}'s sentence`, at: step.at, chunk: v.steps[i] })),
      { beat: "closing", label: "the closing", at: video.resultAt, chunk: v.closing },
    ];
    for (const { beat, label, at, chunk } of beats) {
      if (!chunk || !(chunk.to > chunk.from) || chunk.from < 0) {
        problems.push(`voice ${beat}: needs { from, to } in seconds of the take, with "to" after "from"`);
        continue;
      }
      const start = at + VOICE_DELAY;
      voicePlan.push({ beat, label, from: chunk.from, to: chunk.to, start: n3(start), end: n3(start + chunk.to - chunk.from) });
    }
    voicePlan.forEach((cue, i) => {
      const next = voicePlan[i + 1];
      if (next) {
        cue.gapToNext = n3(next.start - cue.end);
        if (cue.gapToNext < VOICE_GAP - 1e-6) {
          const short = (VOICE_GAP - cue.gapToNext).toFixed(2);
          problems.push(
            `voice: ${cue.label} ends at ${cue.end.toFixed(2)} s and ${next.label} starts at ${next.start.toFixed(2)} s, ${cue.gapToNext.toFixed(2)} s apart (at least ${VOICE_GAP} s of quiet is needed). ` +
              `Start the next beat ${short} s later or shorten the sentence. The voice is never sped up or cut.`,
          );
        }
      } else if (cue.end > video.endAt + 1e-6) {
        problems.push(
          `voice: the closing ends at ${cue.end.toFixed(2)} s, after the end card starts (endAt ${video.endAt} s). ` +
            `Move endAt to ${(cue.end + 0.3).toFixed(1)} s or later. Nothing is spoken over the end card.`,
        );
      }
    });
  }
}
function n3(value) {
  return Number(value.toFixed(3));
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
function writeWav(path, samples) {
  const pcm = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i]))), i * 2);
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
  writeFileSync(path, Buffer.concat([header, pcm]));
}
writeWav(join(assets, "sfx-mix.wav"), mix);
writeFileSync(join(work, "sfx-cues.json"), JSON.stringify(cues, null, 1));

/* ───────────── voiceover: cut the take at its pauses, one sentence per beat, one gain for all ───────────── */

const VOICE_LUFS = -16; // the finished video: about -16 LUFS (between -18 and -14), TUTORIALS.md 5.3
const VOICE_CEILING_DB = -2.5; // sample peak of the voice, so voice + sounds + AAC stay under -1.5 dBTP
const VOICE_FADE = 0.012; // 12 ms fade at each edge of a sentence
const MAX_LIMITING_DB = 6; // more than this on the tallest peak would be heavy compression: refuse
let audioFile = "sfx-mix.wav";
let voiceNote = "";
if (video.voice) {
  const source = join(work, video.voice.src);
  const ffmpeg = (args) => {
    const result = spawnSync("ffmpeg", args, { maxBuffer: 1 << 30 });
    if (result.error) {
      console.error("The voiceover needs ffmpeg on PATH.");
      process.exit(1);
    }
    return result;
  };
  const decode = (filters) => {
    const out = ffmpeg(["-v", "error", "-i", source, ...(filters ? ["-af", filters] : []), "-f", "s16le", "-ac", "2", "-ar", String(RATE), "-"]).stdout;
    return new Int16Array(out.buffer, out.byteOffset, Math.floor(out.length / 2));
  };
  const loudness = (file) => {
    const log = ffmpeg(["-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr.toString();
    const summary = log.slice(log.lastIndexOf("Summary:"));
    return { lufs: Number(summary.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]), peak: Number(summary.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]) };
  };
  const db = (linear) => 20 * Math.log10(Math.max(linear, 1e-9));

  // The take as recorded: every cut must sit in a pause, and every chunk inside the take.
  const dry = decode(null);
  const takeSeconds = dry.length / 2 / RATE;
  const rmsAround = (seconds) => {
    const half = Math.round(0.01 * RATE);
    const centre = Math.round(seconds * RATE);
    let sum = 0;
    let count = 0;
    for (let i = Math.max(0, centre - half); i < Math.min(dry.length / 2, centre + half); i++, count++) sum += (dry[i * 2] / 32768) ** 2;
    return count ? db(Math.sqrt(sum / count)) : -120;
  };
  const cutProblems = [];
  for (const cue of voicePlan) {
    if (cue.to > takeSeconds + 0.05) cutProblems.push(`voice ${cue.beat}: "to" ${cue.to} s is after the end of the take (${takeSeconds.toFixed(2)} s)`);
    for (const edge of [cue.from, cue.to]) {
      if (edge < 0.05 || edge > takeSeconds - 0.05) continue; // the take's own start and end
      const level = rmsAround(edge);
      if (level > -35) cutProblems.push(`voice ${cue.beat}: the cut at ${edge} s is inside speech (${level.toFixed(0)} dBFS there). Move it into the pause between the sentences.`);
    }
  }
  if (cutProblems.length) {
    console.error("The voice cuts are wrong:\n- " + cutProblems.join("\n- "));
    process.exit(1);
  }
  let dryPeak = 0;
  for (let i = 0; i < dry.length; i += 2) dryPeak = Math.max(dryPeak, Math.abs(dry[i]));
  const dryPeakDb = db(dryPeak / 32768);

  // One gain for the whole take, found in a few passes; a limiter only catches the few tallest peaks.
  const place = (take) => {
    const track = new Float64Array(mix.length);
    const fade = Math.round(VOICE_FADE * RATE);
    for (const cue of voicePlan) {
      const first = Math.round(cue.from * RATE);
      const length = Math.min(Math.round(cue.to * RATE), take.length / 2) - first;
      const at = Math.round(cue.start * RATE);
      for (let i = 0; i < length; i++) {
        const edge = Math.min(1, i / fade, (length - 1 - i) / fade);
        const gain = 0.5 - 0.5 * Math.cos(Math.PI * edge);
        const target = (at + i) * 2;
        if (target + 1 >= track.length) break;
        track[target] += take[(first + i) * 2] * gain;
        track[target + 1] += take[(first + i) * 2 + 1] * gain;
      }
    }
    return track;
  };
  const voiceFile = join(assets, "voice-mix.wav");
  const ceiling = 10 ** (VOICE_CEILING_DB / 20);
  let gainDb = video.voice.gainDb ?? VOICE_LUFS - loudness(source).lufs;
  let voice;
  let measured;
  for (let pass = 0; pass < 3; pass++) {
    // Stereo first (a mono take is spread at -3 dB a side), so the limiter's ceiling is the ceiling of what is heard.
    voice = place(decode(`volume=${gainDb.toFixed(2)}dB,aformat=channel_layouts=stereo,alimiter=limit=${ceiling.toFixed(4)}:attack=5:release=60:level=disabled`));
    writeWav(voiceFile, voice);
    measured = loudness(voiceFile);
    if (video.voice.gainDb != null || Math.abs(measured.lufs - VOICE_LUFS) <= 0.2) break;
    gainDb += VOICE_LUFS - measured.lufs;
  }
  const limiting = Math.max(0, dryPeakDb + gainDb - VOICE_CEILING_DB);
  if (limiting > MAX_LIMITING_DB) {
    console.error(
      `The voice would need ${limiting.toFixed(1)} dB of limiting to reach ${VOICE_LUFS} LUFS (at most ${MAX_LIMITING_DB} dB is allowed). ` +
        `Set voice.gainDb lower in video.mjs, or use a take with lower peaks.`,
    );
    process.exit(1);
  }
  let limited = 0;
  const threshold = (32768 * ceiling) / 10 ** (gainDb / 20);
  for (let i = 0; i < dry.length; i += 2) if (Math.abs(dry[i]) > threshold) limited++;
  const touched = (100 * limited) / (dry.length / 2);

  const both = new Float64Array(mix.length);
  for (let i = 0; i < mix.length; i++) both[i] = mix[i] + voice[i];
  writeWav(join(assets, "audio-mix.wav"), both);
  audioFile = "audio-mix.wav";
  const total = loudness(join(assets, "audio-mix.wav"));
  const effects = loudness(join(assets, "sfx-mix.wav"));
  writeFileSync(
    join(work, "voice-cues.json"),
    JSON.stringify(
      {
        source: video.voice.src,
        gainDb: n3(gainDb),
        limiter: { ceilingDb: VOICE_CEILING_DB, deepestCutDb: n3(limiting), samplesTouchedPercent: n3(touched) },
        measured: { voice: measured, effects, mix: total, effectsUnderVoiceDb: n3(measured.lufs - effects.lufs) },
        cues: voicePlan.map(({ label, ...cue }) => cue),
      },
      null,
      1,
    ),
  );
  voiceNote =
    `\n  voice: ${voicePlan.length} sentences, gain ${gainDb.toFixed(1)} dB, limiter touches ${touched.toFixed(2)}% of samples (deepest cut ${limiting.toFixed(1)} dB)` +
    `\n  mix ${total.lufs} LUFS, peak ${total.peak} dBFS; voice alone ${measured.lufs} LUFS; sounds alone ${effects.lufs} LUFS`;
}

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
      <audio id="tk-sfx" class="clip" data-start="0" data-duration="${n(video.duration)}" data-track-index="9" data-volume="1" src="assets/${audioFile}"></audio>
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
    .join(", ")})${voiceNote}`,
);
