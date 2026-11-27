import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import { MAX_CODE_PROMPT_BYTES, MAX_OUTLINE_SECTIONS, MAX_PAGE_PROMPT_BYTES, MAX_TREE_PROMPT_BYTES, serializeCodeSection, serializeOutline, serializePageSections, serializeTreeSection } from "./serialize";

const bytes = (text: string) => new TextEncoder().encode(text).length;

describe("serializePageSections (page scope)", () => {
  const section = (id: string, count: number): SectionInstance => ({
    id,
    sectionId: "custom-section",
    version: 1,
    props: {},
    componentTree: [{ id: `${id}-root`, type: "section", props: {}, children: Array.from({ length: count }, (_, i) => ({ id: `${id}-n${i}`, type: "heading" as const, props: { text: "عنوان القسم ".repeat(8) }, children: [] })) }],
  });
  const codeSection: SectionInstance = {
    id: "s-code",
    sectionId: "custom-section",
    version: 1,
    props: {},
    componentTree: [{ id: "c-root", type: "section", props: {}, children: [{ id: "c-code", type: "code", props: { apiVersion: 1, source: "<p>x</p>", schema: { name: "X", settings: [] }, settings: {}, blocks: [] }, children: [] }] }],
  };

  it("a large page stays under the budget, in page order, and lists what was left out", () => {
    // 30 sections of about 4.5 KB each: far more than the budget.
    const sections = Array.from({ length: 30 }, (_, i) => section(`s-${i}`, 20));
    const shown = serializePageSections(sections, "ar");
    expect(bytes(shown.text)).toBeLessThanOrEqual(MAX_PAGE_PROMPT_BYTES);
    expect(bytes(shown.text)).toBeGreaterThan(MAX_PAGE_PROMPT_BYTES / 2);
    expect(shown.editableIds.length).toBeGreaterThan(2);
    expect(shown.editableIds).toEqual(sections.slice(0, shown.editableIds.length).map((s) => s.id));
    expect([...shown.editableIds, ...shown.outlineOnlyIds]).toEqual(sections.map((s) => s.id));
    for (const id of shown.editableIds) expect(shown.text).toContain(`TREE SECTION ${id}\n`);
    for (const id of shown.outlineOnlyIds) expect(shown.text).not.toContain(`TREE SECTION ${id}\n`);
  });

  it("skips a section that doesn't fit and still shows a later, smaller one; code and empty sections are outline only", () => {
    const empty: SectionInstance = { id: "s-empty", sectionId: "custom-section", version: 1, props: {}, componentTree: [] };
    const shown = serializePageSections([section("s-a", 2), section("s-huge", 40), codeSection, empty, section("s-b", 2)], "ar", 4 * 1024);
    expect(shown.editableIds).toEqual(["s-a", "s-b"]);
    expect(shown.outlineOnlyIds).toEqual(["s-huge", "s-code", "s-empty"]);
    expect(bytes(shown.text)).toBeLessThanOrEqual(4 * 1024);
    expect(shown.text).not.toContain("CODE SECTION");
  });

  it("is deterministic and empty for an empty page", () => {
    const sections = [section("s-a", 3), section("s-b", 3)];
    expect(serializePageSections(sections, "ar")).toEqual(serializePageSections(sections, "ar"));
    expect(serializePageSections([], "ar")).toEqual({ text: "", editableIds: [], outlineOnlyIds: [] });
  });
});

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

  it("shows photo srcs whole, and the section's background photo, so set_image can name them", () => {
    const src = "https://x.supabase.co/storage/v1/object/public/store-media/" + "a".repeat(150) + ".jpg";
    const section: SectionInstance = { id: "s", sectionId: "custom-section", version: 1, props: {}, style: { shell: { bgImage: "https://x/bg.jpg" } } as SectionInstance["style"], componentTree: [{ id: "root", type: "section", props: {}, children: [{ id: "n", type: "image", props: { src, alt: "" }, children: [] }] }] };
    const text = serializeTreeSection(section, "ar");
    expect(text).toContain(`src=${JSON.stringify(src)}`);
    expect(text).toContain(`section background photo src="https://x/bg.jpg"`);
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
