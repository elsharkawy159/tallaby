import { describe, expect, it } from "vitest";
import { siteConfigSchema, type SectionInstance } from "../config/schema";
import { contentOverrideKeys } from "../core/registry";
import { storeSectionRegistry } from "../sections";
import { mergeSectionInstance, mergeTemplateIntoDraft, type DraftSite } from "./apply";
import { tallabyClassicConfig } from "./tallaby-classic";

const keys = contentOverrideKeys(storeSectionRegistry);
const section = (id: string, sectionId: string, props: Record<string, unknown>, extra: Partial<SectionInstance> = {}): SectionInstance => ({
  id,
  sectionId,
  version: 1,
  props,
  ...extra,
});

describe("applyTemplate merge (P4-05)", () => {
  it("content keys are text/image/link props and item lists, not layout", () => {
    expect(keys["hero-banner"]).toEqual(expect.arrayContaining(["title", "subtitle", "image", "ctaLabel", "ctaHref"]));
    expect(keys["hero-banner"]).not.toContain("align");
    expect(keys["features"]).toContain("items");
    expect(keys["product-grid"]).not.toContain("source");
  });

  it("keeps the store's text and image overrides when the section id matches", () => {
    const current = section("hero", "hero-banner", { title: "My title", image: "me.jpg", align: "center" }, { translations: { en: { title: "My EN title", align: "x" } } });
    const incoming = section("hero", "hero-banner", { title: "Template title", image: "", align: "start", height: "lg" }, { translations: { en: { subtitle: "T sub" } } });
    const merged = mergeSectionInstance(current, incoming, keys);
    expect(merged.props).toEqual({ title: "My title", image: "me.jpg", align: "start", height: "lg" });
    expect(merged.translations).toEqual({ en: { subtitle: "T sub", title: "My EN title" } });
  });

  it("takes the template instance when the id or type differs", () => {
    const incoming = section("hero", "hero-banner", { title: "Template" });
    expect(mergeSectionInstance(section("other", "hero-banner", { title: "Mine" }), incoming, keys)).toBe(incoming);
    expect(mergeSectionInstance(section("hero", "rich-text", { title: "Mine" }), incoming, keys)).toBe(incoming);
  });

  it("replaces matching pages, creates missing ones, never touches the others", () => {
    const current: DraftSite = {
      designSystem: { colors: { primary: "#ff0000" }, typography: {}, spacing: {} },
      header: section("classic-header", "classic-header", {}),
      footer: null,
      pages: [
        { slug: "home", isHome: true, content: { sections: [section("hero", "hero-banner", { title: "Home title" })] } },
        { slug: "about", isHome: false, content: { sections: [section("txt", "rich-text", { title: "About us" })] } },
      ],
    };
    const template = siteConfigSchema.parse({
      schemaVersion: 1,
      designSystem: { colors: { primary: "#00ff00" }, typography: {}, spacing: {} },
      header: { id: "hdr", sectionId: "store-header", version: 1, props: {} },
      footer: { id: "ftr", sectionId: "store-footer", version: 1, props: {} },
      pages: [
        { slug: "start", isHome: true, name: "Home", content: { sections: [{ id: "hero", sectionId: "hero-banner", version: 1, props: { title: "T", height: "lg" } }] } },
        { slug: "faq", isHome: false, name: "FAQ", content: { sections: [{ id: "q", sectionId: "faq", version: 1, props: {} }] } },
      ],
    });
    const result = mergeTemplateIntoDraft(current, template, keys);
    expect(result.designSystem.colors.primary).toBe("#00ff00");
    expect(result.header?.sectionId).toBe("store-header");
    expect(result.footer?.sectionId).toBe("store-footer");
    expect(result.pages.map((p) => [p.targetSlug, p.slug])).toEqual([
      ["home", "home"],
      [null, "faq"],
    ]);
    expect(result.pages[0]!.content.sections[0]!.props).toEqual({ title: "Home title", height: "lg" });
    // "about" is not in the result: it stays as it is.
    expect(result.pages.some((p) => p.slug === "about")).toBe(false);
  });

  it("re-applying Tallaby Classic to a Classic store keeps its category title", () => {
    const classic = siteConfigSchema.parse(tallabyClassicConfig());
    const home = classic.pages[0]!;
    const edited = {
      ...home.content,
      sections: home.content.sections.map((s) => (s.id === "classic-categories" ? { ...s, props: { title: "Shop by type" } } : s)),
    };
    const result = mergeTemplateIntoDraft(
      { designSystem: classic.designSystem, header: classic.header, footer: classic.footer, pages: [{ slug: "home", isHome: true, content: edited }] },
      classic,
      keys,
    );
    expect(result.pages[0]!.content.sections.find((s) => s.id === "classic-categories")!.props).toEqual({ title: "Shop by type" });
  });
});
