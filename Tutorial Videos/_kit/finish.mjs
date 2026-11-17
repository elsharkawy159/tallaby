#!/usr/bin/env node
/*
 * Tallaby tutorial kit: turns a HyperFrames render into the deliverables and checks them.
 *
 *   node "Tutorial Videos/_kit/finish.mjs" "Tutorial Videos/T-01-add-product" [render.mp4]
 *
 * Needs ffmpeg and ffprobe on PATH. Reads <video>/work/renders/raw.mp4 unless a file is given.
 * Writes:
 *   <video>/video.mp4     H.264 as rendered (not encoded twice), AAC 48 kHz stereo 192 kbps, faststart
 *   <video>/poster.jpg    frame 0 (the title card)
 *   <video>/work/stills/  one still per moment a reviewer must look at
 * Prints the TUTORIALS.md section 10 numbers and exits 1 if one is out of range.
 * A video with a `voice` block is checked as a voiced mix (-18 to -14 LUFS, peak at most -1.5 dBTP,
 * sounds at least 15 dB under the voice); one without is checked as quiet sounds only.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, openSync, readSync, closeSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const videoDir = resolve(process.argv[2] ?? "");
const work = join(videoDir, "work");
const raw = resolve(process.argv[3] ?? join(work, "renders", "raw.mp4"));
if (!process.argv[2] || !existsSync(raw)) {
  console.error(`Render not found: ${raw}\nRender first: npx hyperframes render --quality delivery --crf 18 --fps 30 --output renders/raw.mp4`);
  process.exit(1);
}
const video = (await import(pathToFileURL(join(work, "video.mjs")).href)).default;
const out = join(videoDir, "video.mp4");
const run = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

// The picture is copied as rendered; the sound comes straight from the kit mix, not from the render's low-bitrate track.
const hasVoice = Boolean(video.voice);
const soundFile = join(work, "assets", hasVoice ? "audio-mix.wav" : "sfx-mix.wav");
if (!existsSync(soundFile)) {
  console.error(`Sound not found: ${soundFile}
Run build.mjs first.`);
  process.exit(1);
}
run("ffmpeg", [
  "-y", "-v", "error",
  "-i", raw,
  "-i", soundFile,
  "-map", "0:v:0", "-map", "1:a:0",
  "-c:v", "copy",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
  "-t", String(video.duration),
  "-movflags", "+faststart",
  out,
]);
run("ffmpeg", ["-y", "-v", "error", "-i", out, "-frames:v", "1", "-q:v", "2", "-update", "1", join(videoDir, "poster.jpg")]);

/* Stills: frame 0, the middle of every step, a step change in flight, the result and the end card. */
const stills = join(work, "stills");
rmSync(stills, { recursive: true, force: true });
mkdirSync(stills, { recursive: true });
const shots = [["00-title", 0]];
if (video.steps[0].at > 2.5) shots.push(["00-title-late", video.steps[0].at - 0.5]); // a long title card: look at it near its end too
video.steps.forEach((step, i) => {
  const end = video.steps[i + 1]?.at ?? video.resultAt;
  shots.push([`${String(i + 1).padStart(2, "0")}-step-${i + 1}`, (step.at + end) / 2]);
});
for (const event of video.events) {
  if (event.op === "tap") shots.push([`tap-${event.t.toFixed(2)}s`, event.t + 0.2]);
  if (event.op === "screen") shots.push([`transition-${event.t.toFixed(2)}s`, event.t + 0.2]);
}
shots.push(["step-change", video.steps[1].at + 0.1]);
shots.push(["90-result", video.checkAt + 0.8]);
shots.push(["99-end", video.endAt + (video.duration - video.endAt) * 0.7]);
for (const [name, t] of shots) {
  run("ffmpeg", ["-y", "-v", "error", "-ss", t.toFixed(3), "-i", out, "-frames:v", "1", "-update", "1", join(stills, `${name}.png`)]);
}

/* Checks */
const probe = JSON.parse(run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", out]));
const v = probe.streams.find((s) => s.codec_type === "video");
const a = probe.streams.find((s) => s.codec_type === "audio");
function loudness(file) {
  const log = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const summary = log.slice(log.lastIndexOf("Summary:"));
  return { lufs: Number(summary.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]), peak: Number(summary.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]) };
}
const { lufs, peak } = loudness(out);
const voiceOnly = hasVoice ? loudness(join(work, "assets", "voice-mix.wav")) : null;
const soundsOnly = loudness(join(work, "assets", "sfx-mix.wav"));

// faststart = the "moov" box comes before "mdat".
const head = Buffer.alloc(1 << 16);
const fd = openSync(out, "r");
readSync(fd, head, 0, head.length, 0);
closeSync(fd);
const moov = head.indexOf("moov");
const mdat = head.indexOf("mdat");
const faststart = moov > 0 && (mdat < 0 || moov < mdat);

const duration = Number(probe.format.duration);
const sizeMb = statSync(out).size / 1048576;
const rows = [
  ["size", `${v.width}x${v.height}`, v.width === 1080 && v.height === 1920],
  ["frame rate", v.r_frame_rate, v.r_frame_rate === "30/1"],
  ["video", `${v.codec_name} ${v.profile} ${v.pix_fmt}`, v.codec_name === "h264" && v.profile === "High" && v.pix_fmt === "yuv420p"],
  ["audio", `${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch ${Math.round(a.bit_rate / 1000)} kbps`, a.codec_name === "aac" && a.sample_rate === "48000" && a.channels === 2],
  ["duration", `${duration.toFixed(2)} s`, duration >= 20 && duration <= 40],
  ["target 28-35 s", duration >= 28 && duration <= 35 ? "yes" : "no", duration >= 28 && duration <= 35],
  ["file size", `${sizeMb.toFixed(2)} MB`, sizeMb < 45],
  ["faststart", faststart ? "yes" : "no", faststart],
  ...(hasVoice
    ? [
        ["loudness", `${lufs} LUFS (about -16: -18 to -14)`, lufs >= -18 && lufs <= -14],
        ["true peak", `${peak} dBTP (at most -1.5)`, peak <= -1.5],
        ["voice alone", `${voiceOnly.lufs} LUFS, peak ${voiceOnly.peak} dBFS`, true],
        ["sounds alone", `${soundsOnly.lufs} LUFS, peak ${soundsOnly.peak} dBFS (peak at most -16)`, soundsOnly.peak <= -16],
        ["sounds under voice", `${(voiceOnly.lufs - soundsOnly.lufs).toFixed(1)} dB (at least 15)`, voiceOnly.lufs - soundsOnly.lufs >= 15],
      ]
    : [
        ["loudness", `${lufs} LUFS (quiet: at most -28)`, lufs <= -28],
        ["true peak", `${peak} dBTP (at most -16)`, peak <= -16],
      ]),
];
let failed = false;
for (const [name, value, ok] of rows) {
  console.log(`${ok ? "ok  " : "FAIL"}  ${name.padEnd(18)} ${value}`);
  if (!ok) failed = true;
}
console.log(`\n${out}\n${join(videoDir, "poster.jpg")}\n${stills} (${shots.length} stills: look at every one)`);
process.exit(failed ? 1 : 0);
