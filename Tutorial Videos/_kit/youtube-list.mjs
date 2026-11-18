// Collects every tutorial's YouTube title and description into ../YOUTUBE.md, ready to copy.
// Run: node "Tutorial Videos/_kit/youtube-list.mjs"   (re-run after adding or editing a video.md)
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const folders = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^T-\d+/.test(d.name) && existsSync(join(root, d.name, "video.md")))
  .map((d) => d.name)
  .sort((a, b) => Number(a.match(/^T-(\d+)/)[1]) - Number(b.match(/^T-(\d+)/)[1]));

const field = (md, key) => {
  const m = md.match(new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, "m"));
  return m ? m[1] : "";
};
const section = (md, heading) => {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`## ${heading}`));
  if (start < 0) return "";
  const end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
  return lines.slice(start + 1, end < 0 ? undefined : end).join("\n").trim();
};

const out = [
  "# YouTube titles and descriptions",
  "",
  "Generated from each video's `video.md` by `_kit/youtube-list.mjs`. Do not edit here: edit the video.md and run the script again.",
  "",
];
for (const name of folders) {
  const md = readFileSync(join(root, name, "video.md"), "utf8");
  const title = field(md, "youtube_title");
  const description = section(md, "YouTube description");
  const status = field(md, "status");
  out.push(`## ${field(md, "id") || name} · ${name.replace(/^T-\d+-/, "")} (${status})`, "");
  out.push("**Title**", "", "```text", title || "(missing youtube_title)", "```", "");
  out.push("**Description**", "", "```text", description || "(missing description)", "```", "");
}
writeFileSync(join(root, "YOUTUBE.md"), out.join("\n"));
console.log(`YOUTUBE.md: ${folders.length} videos`);
