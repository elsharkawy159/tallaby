import { describe, expect, it } from "vitest";
import { resolveSectionForLocale } from "../core/locale";
import { DESIGNS, instantiateDesign } from "../designs";
import { rebasePageContentLocale, rebaseSectionLocale } from "./locale-rebase";
import type { SectionInstance } from "./schema";

describe("rebaseSectionLocale", () => {
  it("turns every design's Arabic-first instance into its English-first instance, and back", () => {
    for (const design of DESIGNS) {
      const ar = instantiateDesign(design, { id: "s1", defaultLocale: "ar" });
      const en = instantiateDesign(design, { id: "s1", defaultLocale: "en" });
      expect(rebaseSectionLocale(ar, "ar", "en"), design.id).toEqual(en);
      expect(rebaseSectionLocale(en, "en", "ar"), design.id).toEqual(ar);
    }
  });

  it("keeps what each language shows", () => {
    const instance: SectionInstance = {
      id: "s1",
      sectionId: "custom-section",
      version: 1,
      props: { title: "مرحبا", items: [{ label: "أ", href: "/a" }] },
      translations: { en: { title: "Hello", items: [{ label: "A" }] } },
      componentTree: [
        {
          id: "n1",
          type: "heading",
          props: { text: "عنوان", level: "h2", translations: { en: { text: "Title" } } },
          children: [{ id: "n2", type: "text", props: { text: "١٢" }, children: [] }],
        },
      ],
    };
    const rebased = rebaseSectionLocale(instance, "ar", "en");
    for (const locale of ["ar", "en"] as const) {
      const strip = (s: SectionInstance) => JSON.parse(JSON.stringify(s, (key, value) => (key === "translations" ? undefined : value)));
      expect(strip(resolveSectionForLocale(rebased, locale, "en"))).toEqual(strip(resolveSectionForLocale(instance, locale, "ar")));
    }
    expect(rebased.props).toEqual({ title: "Hello", items: [{ label: "A", href: "/a" }] });
    expect(rebased.translations).toEqual({ ar: { title: "مرحبا", items: [{ label: "أ", href: "/a" }] } });
    // Text without an English overlay stays as it was.
    expect(rebased.componentTree![0]!.children[0]!.props).toEqual({ text: "١٢" });
  });

  it("returns the same objects when there is nothing to move", () => {
    const instance: SectionInstance = { id: "s1", sectionId: "custom-section", version: 1, props: {}, componentTree: [{ id: "n1", type: "text", props: { text: "x" }, children: [] }] };
    expect(rebaseSectionLocale(instance, "ar", "en")).toBe(instance);
    const content = { sections: [instance] };
    expect(rebasePageContentLocale(content, "ar", "en")).toBe(content);
    expect(rebasePageContentLocale(content, "en", "en")).toBe(content);
  });
});
