import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance, SiteLocale } from "../config/schema";
import { resolveSectionForLocale } from "../core/locale";
import { DESIGNS, getDesign, instantiateDesign } from "../designs";
import { CODE_TEMPLATES } from "./catalog";
import { fillPageName, fillPageTranslations, fillSectionTranslations, textScript } from "./fill-translations";
import { prepareTemplateForStore } from "./prepare";

const design = getDesign("stats-classic")!;

/** Every node with its English overlay removed (text a store kept in Arabic only); the store's name placeholder keeps it (a name is never translated). */
function dropEnglish(nodes: ComponentNode[]): ComponentNode[] {
  return nodes.map((node) => {
    if (node.props.role === "storeName" || node.props.role === "storeInitial") return { ...node, children: dropEnglish(node.children) };
    // Layers names (`label`, editor-only) keep their English: a short name like "قسم" has many.
    const { translations, ...props } = node.props as Record<string, unknown> & { translations?: { en?: Record<string, unknown> } };
    const label = translations?.en?.label;
    return { ...node, props: { ...props, ...(label !== undefined && { translations: { en: { label } } }) }, children: dropEnglish(node.children) };
  });
}

/** What a section shows in one language: overlays applied, then dropped, and invisible direction marks ignored. */
function shown(instance: SectionInstance, locale: SiteLocale, defaultLocale: SiteLocale): unknown {
  const view = resolveSectionForLocale(instance, locale, defaultLocale);
  return JSON.parse(JSON.stringify(view, (key, value) => (key === "translations" ? undefined : typeof value === "string" ? value.replace(/[‎‏⁦-⁩]/g, "") : value)));
}

const section = (nodes: ComponentNode[], source = "x@1"): SectionInstance => ({ id: "s1", sectionId: "custom-section", version: 1, props: {}, source, componentTree: nodes });

describe("fillSectionTranslations", () => {
  it("restores the English of an Arabic-only copy of a design", () => {
    const full = instantiateDesign(design, { id: "s1", defaultLocale: "ar" });
    const arabicOnly = { ...full, componentTree: dropEnglish(full.componentTree!) };
    const { instance, stats } = fillSectionTranslations(arabicOnly, { defaultLocale: "ar" });
    expect(stats.filled).toBeGreaterThan(0);
    expect(stats.missing).toBe(0);
    expect(instance).toEqual(full);
  });

  it("repairs an English-default store whose content kept its Arabic base", () => {
    const arabicFirst = instantiateDesign(design, { id: "s1", defaultLocale: "ar" });
    const englishFirst = instantiateDesign(design, { id: "s1", defaultLocale: "en" });
    const { instance, stats } = fillSectionTranslations(arabicFirst, { defaultLocale: "en" });
    expect(stats.repaired).toBeGreaterThan(0);
    expect(instance).toEqual(englishFirst);
  });

  it("repairs and refills every library design: each language shows what the design writes", () => {
    for (const each of DESIGNS) {
      const ar = instantiateDesign(each, { id: "s1", defaultLocale: "ar" });
      const en = instantiateDesign(each, { id: "s1", defaultLocale: "en" });
      const repaired = fillSectionTranslations(ar, { defaultLocale: "en" }).instance;
      const refilled = fillSectionTranslations({ ...ar, componentTree: dropEnglish(ar.componentTree!) }, { defaultLocale: "ar" }).instance;
      for (const locale of ["ar", "en"] as const) {
        expect(shown(repaired, locale, "en"), `${each.id} ${locale}`).toEqual(shown(en, locale, "en"));
        expect(shown(refilled, locale, "ar"), `${each.id} ${locale}`).toEqual(shown(ar, locale, "ar"));
      }
    }
  }, 60_000);

  it("repairs and refills every template a store installed (its name filled in)", () => {
    for (const template of CODE_TEMPLATES) {
      const ar = prepareTemplateForStore(template.config(), { defaultLocale: "ar", storeName: "متجر سارة", year: 2026 });
      const en = prepareTemplateForStore(template.config(), { defaultLocale: "en", storeName: "متجر سارة", year: 2026 });
      const sectionsOf = (site: typeof ar) => [site.header, site.footer, ...site.pages.flatMap((page) => page.content.sections)].filter((s): s is SectionInstance => s !== null);
      const [arSections, enSections] = [sectionsOf(ar), sectionsOf(en)];
      arSections.forEach((section, i) => {
        const label = `${template.key} ${section.source ?? section.id}`;
        const repaired = fillSectionTranslations(section, { defaultLocale: "en" }).instance;
        const refilled = fillSectionTranslations(section.componentTree ? { ...section, componentTree: dropEnglish(section.componentTree) } : section, { defaultLocale: "ar" }).instance;
        for (const locale of ["ar", "en"] as const) {
          expect(shown(repaired, locale, "en"), `${label} ${locale}`).toEqual(shown(enSections[i]!, locale, "en"));
          expect(shown(refilled, locale, "ar"), `${label} ${locale}`).toEqual(shown(section, locale, "ar"));
        }
      });
    }
  }, 60_000);

  it("puts English first for Arabic-only template text in an English store", () => {
    const full = instantiateDesign(design, { id: "s1", defaultLocale: "ar" });
    const arabicOnly = { ...full, componentTree: dropEnglish(full.componentTree!) };
    const { instance } = fillSectionTranslations(arabicOnly, { defaultLocale: "en" });
    expect(instance).toEqual(instantiateDesign(design, { id: "s1", defaultLocale: "en" }));
  });

  it("never changes text the seller wrote, and counts Arabic text it can't translate", () => {
    const nodes: ComponentNode[] = [
      { id: "n1", type: "heading", props: { text: "عرضنا الخاص لهذا الأسبوع فقط", level: "h2" }, children: [] },
      { id: "n2", type: "paragraph", props: { text: "Our own words", translations: { ar: { text: "كلامنا" } } }, children: [] },
    ];
    const ar = fillSectionTranslations(section(nodes.slice(0, 1)), { defaultLocale: "ar" });
    expect(ar.instance.componentTree![0]).toBe(nodes[0]);
    expect(ar.stats).toEqual({ filled: 0, repaired: 0, missing: 1 });
    const en = fillSectionTranslations(section(nodes), { defaultLocale: "en" });
    expect(en.instance.componentTree![0]!.props).toEqual(nodes[0]!.props);
    expect(en.instance.componentTree![1]!.props).toEqual(nodes[1]!.props);
    expect(en.stats.missing).toBe(1);
  });

  it("fills an element's placeholder and the copyright line", () => {
    const nodes: ComponentNode[] = [
      { id: "n1", type: "heading", props: { text: "عنوان جديد", level: "h2" }, children: [] },
      { id: "n2", type: "text", props: { role: "copyright", text: "© ٢٠٢٦ متجري. كل الحقوق محفوظة." }, children: [] },
      { id: "n3", type: "text", props: { role: "storeName", text: "متجري" }, children: [] },
    ];
    const { instance } = fillSectionTranslations(section(nodes), { defaultLocale: "en" });
    const [heading, copyright, name] = instance.componentTree!;
    expect(heading!.props).toEqual({ text: "New heading", level: "h2", translations: { ar: { text: "عنوان جديد" } } });
    expect(copyright!.props).toEqual({ role: "copyright", text: "© 2026 متجري. All rights reserved.", translations: { ar: { text: "© ٢٠٢٦ متجري. كل الحقوق محفوظة." } } });
    expect(name).toBe(nodes[2]);
  });

  it("leaves a page with nothing to fill as it is", () => {
    const content = { sections: [instantiateDesign(design, { id: "s1", defaultLocale: "ar" })] };
    const result = fillPageTranslations(content, { defaultLocale: "ar" });
    expect(result.content).toBe(content);
    expect(result.stats).toEqual({ filled: 0, repaired: 0, missing: 0 });
  });
});

describe("fillPageName", () => {
  it("adds a template page's missing language", () => {
    expect(fillPageName({ ar: "الرئيسية" })).toEqual({ ar: "الرئيسية", en: "Home" });
    expect(fillPageName({ ar: "صفحتي الخاصة جدا" })).toBeNull();
    expect(fillPageName({ ar: "من نحن", en: "About" })).toBeNull();
  });
});

describe("textScript", () => {
  it("tells Arabic, English and neutral text apart", () => {
    expect(textScript("مرحبا")).toBe("ar");
    expect(textScript("Hello")).toBe("en");
    expect(textScript("١٢ / 12 %")).toBe("ar");
    expect(textScript("+20 100")).toBe("neutral");
  });
});
