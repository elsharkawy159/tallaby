import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import { publishErrorKey } from "./edit-with-ai-page.lib";

/**
 * Every `agent.card.*` key the agent skills can put on a confirm card
 * (`packages/agent/src/skills/*.ts`, their `preview` functions) has text in
 * both message files. Keys built from a template literal are expanded from
 * the values listed here; a new template literal fails until it is listed.
 */

const SKILLS_DIR = path.resolve(__dirname, "../../../../../../../../../packages/agent/src/skills");

/** `agent.card.<prefix>.${variable}` → the values the variable can take (read from the skills' code). */
const DYNAMIC: Record<string, string[]> = {
  // PaletteNote in @workspace/store-sections/palette.
  "design.colors.note": ["primary_darkened_for_text", "primary_lightened_for_text"],
  // updateCopy's fields.
  "products.field": ["title", "description", "bulletPoints", "seo"],
  // updateContact's fields.
  "settings.contact": ["phone", "whatsapp", "email"],
};

function collectKeys(): string[] {
  const keys = new Set<string>();
  const files = readdirSync(SKILLS_DIR).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const source = readFileSync(path.join(SKILLS_DIR, file), "utf8");
    for (const match of source.matchAll(/"agent\.card\.([\w.]+)"/g)) keys.add(match[1]!);
    for (const match of source.matchAll(/`agent\.card\.([\w.]+)\.\$\{[^}]+\}`/g)) {
      const values = DYNAMIC[match[1]!];
      if (!values) throw new Error(`List the values of agent.card.${match[1]}.\${…} (${file}) in DYNAMIC`);
      for (const value of values) keys.add(`${match[1]}.${value}`);
    }
  }
  return [...keys].sort();
}

const lookup = (messages: unknown, key: string): unknown =>
  key.split(".").reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined), messages);

describe("agent.card.* messages", () => {
  const keys = collectKeys();

  it("finds the skills' keys", () => {
    expect(keys).toContain("products.create.title");
    expect(keys).toContain("shipping.zoneLine");
    expect(keys).toContain("settings.contact.whatsapp");
  });

  it.each([
    ["ar", ar],
    ["en", en],
  ] as const)("every key has text in %s", (_locale, messages) => {
    const missing = keys.filter((key) => typeof lookup((messages as Record<string, unknown>).agent, `card.${key}`) !== "string");
    expect(missing).toEqual([]);
  });
});

describe("editWithAi messages", () => {
  it("has the same keys in both languages", () => {
    const flat = (node: unknown, prefix = ""): string[] =>
      node && typeof node === "object"
        ? Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => flat(v, prefix ? `${prefix}.${k}` : k))
        : [prefix];
    expect(flat((ar as Record<string, unknown>).editWithAi).sort()).toEqual(flat((en as Record<string, unknown>).editWithAi).sort());
    expect(flat((ar as Record<string, unknown>).agent).sort()).toEqual(flat((en as Record<string, unknown>).agent).sort());
  });

  it("has a publish message for every publish error the page shows", () => {
    for (const error of ["noActiveProduct", "topUpRequired", "templateNotChosen", "nothingToPublish", "rateLimited", "readOnly", "publishBlocked", "invalidSite", "somethingElse"]) {
      expect(typeof lookup(en, `editWithAi.publish.${publishErrorKey(error)}`)).toBe("string");
    }
  });

  it("no longer has the placeholder copy", () => {
    expect(lookup(en, "editorEntry.aiSoon")).toBeUndefined();
    expect(lookup(ar, "editorEntry.aiSoon")).toBeUndefined();
  });
});
