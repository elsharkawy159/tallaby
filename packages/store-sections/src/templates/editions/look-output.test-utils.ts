/**
 * A template's full built output as one string, for the byte-for-byte guard
 * of an edition-ready look (`look-guard.test.ts`): every serialisable field
 * of the definition (key, version, names, palette, page names, demo store,
 * each design's id / library ref / patch, product page spec) and the whole
 * built site (`config()`: design system, header, footer and every page's
 * element trees). Functions are dropped by `JSON.stringify`; the trees they
 * build are in `config`. `preview` (gallery card screenshots, added
 * 2026-11-12) is left out: it is never part of the look a store gets.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { TemplateDefinition } from "../types";

export function builtOutput(template: TemplateDefinition): string {
  const { preview: _preview, ...definition } = template;
  return JSON.stringify({ definition, config: template.config() });
}

/** One line of JSON with no line break, so git's line-ending conversion cannot touch it. */
export const fixturePath = (template: TemplateDefinition) => join(__dirname, "__fixtures__", `${template.key}.v${template.version}.json`);

export function readFixture(template: TemplateDefinition): string | null {
  const path = fixturePath(template);
  return existsSync(path) ? readFileSync(path, "utf8").trim() : null;
}

/** Writes the fixture once; an existing one is never overwritten (delete it by hand for a deliberate new version). */
export function captureFixture(template: TemplateDefinition): boolean {
  if (existsSync(fixturePath(template))) return false;
  writeFileSync(fixturePath(template), builtOutput(template), "utf8");
  return true;
}

/** The first place two built outputs differ, as a JSON path with both values (for the failure message). */
export function firstDifference(expected: unknown, actual: unknown, path = "$"): string | null {
  if (expected === actual) return null;
  const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
  if (!isObject(expected) || !isObject(actual) || Array.isArray(expected) !== Array.isArray(actual)) {
    return `${path}: expected ${JSON.stringify(expected)?.slice(0, 200)}, got ${JSON.stringify(actual)?.slice(0, 200)}`;
  }
  const expectedKeys = Object.keys(expected);
  const actualKeys = Object.keys(actual);
  // Key order is part of the bytes.
  if (expectedKeys.join("\u0000") !== actualKeys.join("\u0000")) return `${path}: keys [${expectedKeys.join(", ")}] became [${actualKeys.join(", ")}]`;
  for (const key of expectedKeys) {
    const found = firstDifference(expected[key], actual[key], Array.isArray(expected) ? `${path}[${key}]` : `${path}.${key}`);
    if (found) return found;
  }
  return null;
}
