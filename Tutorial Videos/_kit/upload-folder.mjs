// Copies every tutorial that is not on YouTube yet (empty youtube_url) into "Tutorial Videos/_upload/",
// named "T-## <youtube_title>" (the owner removes the "T-## " in YouTube Studio; it shows which folder gets the link).
// Windows file names cannot hold "|", so " | " becomes " - " (paste the exact title from video.md if you want the bar).
// YouTube Studio takes 15 files at a time, so the files go into batch-1, batch-2, … (ready videos first).
// Run: node "Tutorial Videos/_kit/upload-folder.mjs"   (re-run after uploading; it rebuilds _upload from scratch)
import { readdirSync, readFileSync, existsSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "_upload");
const BATCH = 15;

const field = (md, key) => (md.match(new RegExp(`^${key}:[ \\t]*"?([^"\\r\\n]*)"?[ \\t]*$`, "m")) || [])[1]?.trim() ?? "";

const videos = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^T-\d+/.test(d.name))
  .map((d) => d.name)
  .filter((name) => existsSync(join(root, name, "video.mp4")) && existsSync(join(root, name, "video.md")))
  .map((name) => {
    const md = readFileSync(join(root, name, "video.md"), "utf8");
    return { name, num: Number(name.match(/^T-(\d+)/)[1]), md, status: field(md, "status"), url: field(md, "youtube_url"), title: field(md, "youtube_title") };
  })
  .filter((v) => !v.url)
  .sort((a, b) => (a.status === "ready" ? 0 : 1) - (b.status === "ready" ? 0 : 1) || a.num - b.num);

rmSync(out, { recursive: true, force: true });
videos.forEach((v, i) => {
  if (!v.title) throw new Error(`${v.name}: video.md has no youtube_title`);
  const dir = join(out, `batch-${Math.floor(i / BATCH) + 1}`);
  mkdirSync(dir, { recursive: true });
  const file = `${v.name.match(/^T-\d+/)[0]} ` + v.title.replace(/\s*\|\s*/g, " - ").replace(/[<>:"/\\?*]/g, "").trim() + ".mp4";
  copyFileSync(join(root, v.name, "video.mp4"), join(dir, file));
  console.log(`batch-${Math.floor(i / BATCH) + 1}  ${v.name.padEnd(24)} ${v.status.padEnd(6)} ${file}`);
});
console.log(`${videos.length} videos to upload in ${out}`);
