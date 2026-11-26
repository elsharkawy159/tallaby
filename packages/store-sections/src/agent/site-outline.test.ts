import { describe, expect, it } from "vitest";
import type { SectionInstance } from "../config/schema";
import { serializeSiteOutline, siteOutline, siteOutlineEntry } from "./site-outline";

const tree = (id: string, label: string, children: SectionInstance["componentTree"], style?: SectionInstance["style"]): SectionInstance => ({
  id,
  sectionId: "custom-section",
  version: 1,
  props: {},
  ...(style && { style }),
  componentTree: [{ id: `${id}-root`, type: "section", props: { label }, children: children ?? [] }],
});

describe("site outline", () => {
  it("names each section, summarises its first text and says whether it shows a photo", () => {
    const hero = tree("s-hero", "الواجهة", [
      { id: "n-bound", type: "text", props: { bind: "title", text: "store data" }, children: [] },
      { id: "n-h", type: "heading", props: { text: "تشكيلة الشتاء", level: "h1" }, children: [] },
      { id: "n-img", type: "image", props: { src: "https://x/y.jpg", alt: "" }, children: [] },
    ]);
    const faq = tree("s-faq", "", [{ id: "n-t", type: "text", props: { text: "<p>Questions</p>" }, children: [] }], { shell: { bgImage: "https://x/bg.jpg" } } as SectionInstance["style"]);
    const [a, b] = siteOutline([hero, faq], "ar");
    expect(a).toEqual({ id: "s-hero", name: "الواجهة", kind: "tree", summary: "تشكيلة الشتاء", hasImage: true });
    expect(b).toMatchObject({ name: "custom-section", hasImage: true });
    const text = serializeSiteOutline({ page: [a!, b!], header: siteOutlineEntry(tree("s-h", "Header", []), "ar"), footer: null });
    expect(text.split("\n")[0]).toMatch(/^HEADER s-h \| "Header" \| tree \| photo: no/);
    expect(text).toContain('0. s-hero | "الواجهة" | tree | photo: yes | "تشكيلة الشتاء"');
    expect(text).toContain('"Questions"');
    expect(text).not.toContain("store data");
  });

  it("reads a code section's name and first text setting", () => {
    const code: SectionInstance = {
      id: "s-c",
      sectionId: "custom-section",
      version: 1,
      props: {},
      componentTree: [{ id: "r", type: "section", props: {}, children: [{ id: "c", type: "code", props: { name: "FAQ", source: "", settings: { title: { ar: "أسئلة", en: "FAQ" } } }, children: [] }] }],
    };
    expect(siteOutlineEntry(code, "ar")).toMatchObject({ name: "FAQ", kind: "code", summary: "أسئلة", hasImage: false });
  });
});
