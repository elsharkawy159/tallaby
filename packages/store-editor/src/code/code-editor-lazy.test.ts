import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STATIC_IMPORT = /^\s*(?:import|export)\s+(?!type\b)(?:[^"'`;]*?\sfrom\s+)?["']([^"']+)["']/gm;
const CODEMIRROR = /^(?:codemirror|@codemirror\/)/;

function resolveLocal(from: string, spec: string): string | null {
  const base = resolve(dirname(from), spec);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, resolve(base, "index.ts"), resolve(base, "index.tsx")]) {
    if (existsSync(candidate) && /\.tsx?$/.test(candidate)) return candidate;
  }
  return null;
}

/** Every package imported statically from `entry`, following this package's own files. */
function staticImports(entry: string): { packages: Set<string>; files: Set<string> } {
  const files = new Set<string>();
  const packages = new Set<string>();
  const visit = (file: string) => {
    if (files.has(file)) return;
    files.add(file);
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(STATIC_IMPORT)) {
      const spec = match[1]!;
      if (spec.startsWith(".")) {
        const next = resolveLocal(file, spec);
        if (next) visit(next);
      } else packages.add(spec);
    }
  };
  visit(entry);
  return { packages, files };
}

describe("CodeMirror is lazy-loaded", () => {
  it("is not in the editor's static import graph", () => {
    const { packages, files } = staticImports(resolve(SRC, "editor.client.tsx"));
    expect(files.has(resolve(SRC, "code/code-inspector.client.tsx"))).toBe(true);
    expect(files.has(resolve(SRC, "code/code-editor.client.tsx"))).toBe(false);
    expect([...packages].filter((p) => CODEMIRROR.test(p))).toEqual([]);
  });

  it("is imported only by the lazy Code tab editor", () => {
    const inspector = readFileSync(resolve(SRC, "code/code-inspector.client.tsx"), "utf8");
    expect(inspector).toMatch(/lazy\(\(\) => import\("\.\/code-editor\.client"\)\)/);
    const { packages } = staticImports(resolve(SRC, "code/code-editor.client.tsx"));
    expect([...packages].filter((p) => CODEMIRROR.test(p)).sort()).toEqual(["@codemirror/lang-liquid", "@codemirror/lint", "@codemirror/state", "@codemirror/view", "codemirror"]);
  });
});
