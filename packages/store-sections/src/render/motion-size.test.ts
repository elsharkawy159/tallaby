/**
 * The motion client JS budget (docs/motion-v2-plan.md §5.9): the reveal
 * runtime with the scroll engine and count-ups (`MotionRuntime`), and the
 * carousel runtime (with the burger sheet and bottom bar it mounts), bundled
 * together the way a storefront ships them (minified, React external), stay
 * at or under 6 KB gzip. zod and the copy table must never get in.
 */
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";
import { describe, expect, it } from "vitest";

const dir = fileURLToPath(new URL(".", import.meta.url));
const BUDGET = 6 * 1024;

async function bundle(contents: string) {
  const result = await build({
    stdin: { contents, resolveDir: dir, loader: "ts", sourcefile: "motion-entry.ts" },
    bundle: true,
    minify: true,
    format: "esm",
    write: false,
    metafile: true,
    external: ["react", "react/jsx-runtime", "react-dom"],
    logLevel: "silent",
  });
  const code = result.outputFiles[0]!.text;
  // Modules that put code in the bundle (the metafile also lists the ones tree-shaken away).
  const inputs = Object.entries(Object.values(result.metafile.outputs)[0]!.inputs)
    .filter(([, input]) => input.bytesInOutput > 0)
    .map(([path]) => path);
  return { code, gzip: gzipSync(code, { level: 9 }).length, inputs };
}

describe("motion client bundle", () => {
  it("stays within 6 KB gzip, without zod or the copy table", async () => {
    const all = await bundle(
      [
        `export { MotionRuntime } from "./motion-runtime.client";`,
        `export { startScrollEngine } from "./scroll-engine.client";`,
        `export { CarouselRuntime } from "./carousel-runtime.client";`,
      ].join("\n"),
    );
    const parts = {
      motionRuntime: (await bundle(`export { MotionRuntime } from "./motion-runtime.client";`)).gzip,
      scrollEngine: (await bundle(`export { startScrollEngine } from "./scroll-engine.client";`)).gzip,
      countUp: (await bundle(`export { createCountUps } from "./count-up.client";`)).gzip,
      carouselRuntime: (await bundle(`export { CarouselRuntime } from "./carousel-runtime.client";`)).gzip,
    };
    console.info(`motion JS gzip: total ${all.gzip} B`, parts);
    expect(all.inputs.some((path) => /node_modules[\\/](\.pnpm[\\/])?zod/.test(path))).toBe(false);
    expect(all.inputs.some((path) => /core[\\/]copy\.ts$/.test(path))).toBe(false);
    expect(all.gzip).toBeLessThanOrEqual(BUDGET);
  }, 30_000);
});
