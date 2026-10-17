import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** P4-02 acceptance: the storefront can render sections without pulling in app or editor code. */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("package boundaries", () => {
  const sources = files(join(__dirname, "..")).map((path) => ({ path, code: readFileSync(path, "utf8") }));

  it("imports nothing from the apps, Next.js or the editor", () => {
    const offenders = sources.filter(({ code }) =>
      /from\s+["'](?:@\/|next\/|next["']|@workspace\/(?:db|lib|cache)|.*website-builder|.*apps\/)/.test(code),
    );
    expect(offenders.map((o) => o.path)).toEqual([]);
  });

  it("has no client hooks in sections or the renderer (server-renderable)", () => {
    const offenders = sources.filter(({ path, code }) => /[\/](sections|render)[\/]/.test(path) && /\buse(State|Effect|Ref|Context|Reducer)\(|"use client"/.test(code));
    expect(offenders.map((o) => o.path)).toEqual([]);
  });

  it("never uses dangerouslySetInnerHTML except for the theme <style>", () => {
    const offenders = sources.filter(({ path, code }) => code.includes("dangerouslySetInnerHTML") && !path.endsWith("render.tsx"));
    expect(offenders.map((o) => o.path)).toEqual([]);
  });
});
