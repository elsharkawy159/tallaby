import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MARKETING_CLIENT_NAMESPACES, ROOT_CLIENT_NAMESPACES, namespaceCovered, pickMessages } from "./client-messages.lib";

const APP = path.resolve(__dirname, "..");
const REPO = path.resolve(APP, "../..");
const LOCALE_DIR = path.join(APP, "app", "[locale]");
const EXTENSIONS = ["", ".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"];

function asFile(candidate: string): string | null {
  for (const ext of EXTENSIONS) {
    const file = candidate + ext;
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
}

/** App imports (relative and `@/`) and workspace package sources; anything else is a dependency. */
function resolveImport(spec: string, from: string): string | null {
  if (spec.startsWith(".")) return asFile(path.resolve(path.dirname(from), spec));
  if (spec.startsWith("@/")) return asFile(path.join(APP, spec.slice(2)));
  const pkg = spec.match(/^@workspace\/([^/]+)(?:\/(.*))?$/);
  if (!pkg) return null;
  const dir = path.join(REPO, "packages", pkg[1]!);
  return asFile(path.join(dir, "src", pkg[2] ?? "index")) ?? asFile(path.join(dir, pkg[2] ?? "index"));
}

const IMPORT_RE = /(?:import|export)\s[^"';]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g;
const NAMESPACE_RE = /useTranslations\(\s*["']([^"']+)["']\s*\)/g;

/** Every `useTranslations` namespace in the files reachable from `entries`, and any call without a literal one. */
function namespacesFrom(entries: string[]) {
  const seen = new Set<string>();
  const namespaces = new Map<string, string>();
  const unknown: string[] = [];
  const stack = [...entries];
  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(NAMESPACE_RE)) namespaces.set(match[1]!, path.relative(APP, file));
    if (/useTranslations\(\s*(\)|[^"'\s)])|useMessages\(/.test(source)) unknown.push(path.relative(APP, file));
    for (const match of source.matchAll(IMPORT_RE)) {
      const resolved = resolveImport(match[1] ?? match[2] ?? match[3]!, file);
      if (resolved && /\.[jt]sx?$/.test(resolved)) stack.push(resolved);
    }
  }
  return { namespaces, unknown };
}

function routeFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...routeFiles(full));
    else if (/^(page|layout|template|error|loading|not-found|default)\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function expectCovered(entries: string[], list: readonly string[]) {
  const { namespaces, unknown } = namespacesFrom(entries);
  expect(namespaces.size).toBeGreaterThan(0);
  // A namespace the scan can't read (a variable, or the whole tree) can't be picked.
  expect(unknown).toEqual([]);
  const missing = [...namespaces].filter(([ns]) => !namespaceCovered(ns, list)).map(([ns, file]) => `${ns} (${file})`);
  expect(missing).toEqual([]);
}

describe("client messages per route group", () => {
  it("tallaby.com sends every namespace its client components use", () => {
    expectCovered(routeFiles(path.join(LOCALE_DIR, "(marketing)")), MARKETING_CLIENT_NAMESPACES);
  });

  it("the root layout sends what the root layout, 404 and catch-all use", () => {
    expectCovered(
      [path.join(LOCALE_DIR, "layout.tsx"), path.join(LOCALE_DIR, "not-found.tsx"), path.join(LOCALE_DIR, "[...rest]", "page.tsx")],
      ROOT_CLIENT_NAMESPACES,
    );
  });
});

describe("pickMessages", () => {
  const messages = { a: { b: { c: "1" }, d: "2" }, e: "3", f: { g: "4" } };

  it("keeps whole and dotted namespaces, nested as they were", () => {
    expect(pickMessages(messages, ["a.b", "e", "missing", "f.none"])).toEqual({ a: { b: { c: "1" } }, e: "3" });
  });

  it("never changes the loaded messages when a listed namespace holds another", () => {
    const picked = pickMessages(messages, ["a", "a.b"]);
    expect(picked).toEqual({ a: messages.a });
    expect(messages.a).toEqual({ b: { c: "1" }, d: "2" });
  });

  it("covers a namespace inside a listed one only", () => {
    expect(namespaceCovered("home.demo.ai", ["home.demo"])).toBe(true);
    expect(namespaceCovered("home.demos", ["home.demo"])).toBe(false);
  });
});
