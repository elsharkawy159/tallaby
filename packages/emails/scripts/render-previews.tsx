/**
 * Renders every `emails/*.tsx` preview to static HTML, for a quick look in a
 * browser or a diff against the Claude Design files:
 *
 *   pnpm --filter @workspace/emails render:previews <outDir>
 */
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { render } from "@react-email/components";
import { createElement, type ComponentType } from "react";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(process.argv[2] ?? join(root, ".previews"));
mkdirSync(outDir, { recursive: true });

const files = readdirSync(join(root, "emails")).filter((file) => file.endsWith(".tsx"));
const links: string[] = [];
for (const file of files) {
  const mod = (await import(pathToFileURL(join(root, "emails", file)).href)) as { default?: ComponentType };
  if (!mod.default) continue;
  const html = await render(createElement(mod.default));
  const name = file.replace(/\.tsx$/, ".html");
  writeFileSync(join(outDir, name), html);
  links.push(`<li><a href="${name}">${name}</a></li>`);
}
writeFileSync(join(outDir, "index.html"), `<!doctype html><meta charset="utf-8"><ul>${links.join("")}</ul>`);
console.log(`Rendered ${links.length} previews to ${outDir}`);
