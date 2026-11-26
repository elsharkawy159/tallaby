import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import { MAX_CODE_PROMPT_BYTES, MAX_OUTLINE_SECTIONS, MAX_TREE_PROMPT_BYTES, serializeCodeSection, serializeOutline, serializeTreeSection } from "./serialize";

const bytes = (text: string) => new TextEncoder().encode(text).length;

describe("serialize for the prompt", () => {
  it("caps a big tree and says how much is left out", () => {
    const children: ComponentNode[] = Array.from({ length: 400 }, (_, i) => ({ id: `n-${i}`, type: "heading", props: { text: "عنوان ".repeat(30) }, children: [] }));
    const section: SectionInstance = { id: "s", sectionId: "custom-section", version: 1, props: {}, componentTree: [{ id: "root", type: "section", props: {}, children }] };
    const text = serializeTreeSection(section, "ar");
    expect(bytes(text)).toBeLessThanOrEqual(MAX_TREE_PROMPT_BYTES);
    expect(text).toMatch(/more elements not shown/);
  });

  it("marks bound elements and never prints their record", () => {
    const section: SectionInstance = { id: "s", sectionId: "custom-section", version: 1, props: {}, componentTree: [{ id: "root", type: "section", props: {}, children: [{ id: "n", type: "text", props: { bind: "price", text: "٢٥٠" }, children: [] }] }] };
    expect(serializeTreeSection(section, "ar")).toContain("bound=price");
  });

  it("cuts a huge code file and tells the model not to rewrite it", () => {
    const code: ComponentNode = { id: "n-code", type: "code", props: { apiVersion: 1, source: `<p>${"x".repeat(60_000)}</p>`, schema: { name: "X", settings: [] }, settings: {}, blocks: [] }, children: [] };
    const section: SectionInstance = { id: "s", sectionId: "custom-section", version: 1, props: {}, componentTree: [{ id: "root", type: "section", props: {}, children: [code] }] };
    const { text, truncated } = serializeCodeSection(section);
    expect(truncated).toBe(true);
    expect(bytes(text)).toBeLessThanOrEqual(MAX_CODE_PROMPT_BYTES);
    expect(text).toContain("Don't rewrite it");
  });

  it("shows at most 30 outline lines around the target", () => {
    const outline = Array.from({ length: 60 }, (_, i) => ({ id: `s-${i}`, name: `S ${i}`, kind: "tree" }));
    const text = serializeOutline(outline, "s-50");
    expect(text.split("\n").filter((l) => /^\d+\./.test(l))).toHaveLength(MAX_OUTLINE_SECTIONS);
    expect(text).toContain("50. s-50");
    expect(text).toContain("← targeted");
  });
});
