import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
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
    const offenders = sources.filter(({ path, code }) => /[\/](sections|render|elements)[\/]/.test(path) && /\buse(State|Effect|Ref|Context|Reducer)\(|"use client"/.test(code));
    expect(offenders.map((o) => o.path)).toEqual([]);
  });

  it("never uses dangerouslySetInnerHTML except for the theme <style> and host-sanitised product content", () => {
    // The product content element prints `ProductDetail.contentHtml`, which the host sanitises on the
    // server when it builds the product (core/types.ts); exactly one use, of that field only.
    const sanitisedProductContent = (path: string, code: string) =>
      /elements[\\/]product-elements\.tsx$/.test(path) &&
      code.split("dangerouslySetInnerHTML").length === 2 &&
      code.includes('const html = product.contentHtml?.trim() ?? "";') &&
      code.includes("dangerouslySetInnerHTML={{ __html: html }}");
    const offenders = sources.filter(
      ({ path, code }) => code.includes("dangerouslySetInnerHTML") && !/render[\\/]render\.tsx$/.test(path) && !sanitisedProductContent(path, code),
    );
    expect(offenders.map((o) => o.path)).toEqual([]);
  });

  it("keeps the html sanitizer out of the render entry (the editor's client bundle)", () => {
    const seen = new Set<string>();
    const visit = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      const code = readFileSync(file, "utf8");
      for (const [, spec] of code.matchAll(/(?:from|import)\s+["'](\.{1,2}\/[^"']+)["']/g)) {
        const base = join(dirname(file), spec!);
        const target = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")].find((p) => existsSync(p) && statSync(p).isFile());
        if (target) visit(target);
      }
    };
    visit(join(__dirname, "index.ts"));
    expect(seen.size).toBeGreaterThan(20);
    expect([...seen].filter((path) => /config[\\/]sanitize\.ts$/.test(path))).toEqual([]);
  });
});
