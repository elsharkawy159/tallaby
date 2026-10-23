import { describe, expect, it } from "vitest";
import { CODE_TEMPLATES } from "@workspace/store-sections/templates";
import {
  blankTemplateConfig,
  prepareTemplateConfig,
  publishedPageNames,
  publishedTemplateMeta,
  studioPageNames,
  templateCreateSchema,
  templateKeySchema,
  templatePageNamesFor,
  withDraftPageNames,
} from "./templates-studio-admin.lib";

const NAME = { ar: "قالب", en: "Template" };

describe("blankTemplateConfig", () => {
  it("is valid: one empty home page, no header or footer", () => {
    const prepared = prepareTemplateConfig(blankTemplateConfig());
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.config.pages).toHaveLength(1);
    expect(prepared.config.pages[0]).toMatchObject({ isHome: true, content: { sections: [] } });
    expect(prepared.config.header).toBeNull();
    expect(prepared.config.footer).toBeNull();
  });
});

describe("prepareTemplateConfig", () => {
  it("accepts every code template config", () => {
    for (const template of CODE_TEMPLATES) expect(prepareTemplateConfig(template.config()).ok, template.key).toBe(true);
    // Building every template config (with its product page) takes a while.
  }, 60_000);

  it("refuses junk and a config without exactly one home page", () => {
    expect(prepareTemplateConfig(null).ok).toBe(false);
    expect(prepareTemplateConfig("x").ok).toBe(false);
    const noHome = blankTemplateConfig();
    noHome.pages[0]!.isHome = false;
    expect(prepareTemplateConfig(noHome).ok).toBe(false);
  });
});

describe("template input", () => {
  it("accepts a slug key and trims it", () => {
    expect(templateKeySchema.safeParse(" my-template-2 ").data).toBe("my-template-2");
  });

  it("refuses a bad key", () => {
    for (const key of ["A", "a", "Bad_Key", "-x", "x y", "../x", "", "a".repeat(64)]) expect(templateKeySchema.safeParse(key).success, key).toBe(false);
  });

  it("requires names in both languages and rejects extra fields", () => {
    const ok = { key: "my-tpl", name: NAME, description: { ar: "", en: "" }, category: "fashion" };
    expect(templateCreateSchema.safeParse(ok).success).toBe(true);
    expect(templateCreateSchema.safeParse({ ...ok, name: { ar: "", en: "x" } }).success).toBe(false);
    expect(templateCreateSchema.safeParse({ ...ok, extra: 1 }).success).toBe(false);
  });
});

describe("template page names", () => {
  const pages = [
    { slug: "home", name: "الرئيسية" },
    { slug: "about-us", name: "About" },
    { slug: "shop", name: "Shop" },
  ];
  const previous = { home: { ar: "الرئيسية", en: "Home" }, about: { ar: "من نحن", en: "About" }, shop: { ar: "المتجر", en: "Shop" } };

  it("publish: the draft's names, else the previous ones, else the page name; removed slugs dropped", () => {
    const draft = { "about-us": { ar: "من نحن", en: "About us" } };
    expect(publishedPageNames(previous, draft, pages)).toEqual({
      home: { ar: "الرئيسية", en: "Home" },
      "about-us": { ar: "من نحن", en: "About us" },
      shop: { ar: "المتجر", en: "Shop" },
    });
    expect(publishedPageNames({}, {}, [{ slug: "faq", name: "FAQ" }])).toEqual({ faq: { ar: "FAQ", en: "FAQ" } });
  });

  it("cleans untrusted names: valid entries for known slugs only, trimmed, empty sides fall back", () => {
    const raw = { home: { ar: "  بداية ", en: "" }, shop: { ar: 1, en: "x" }, ghost: { ar: "a", en: "b" }, "about-us": { ar: "x".repeat(90), en: "About" } };
    expect(templatePageNamesFor(raw, pages)).toEqual({ home: { ar: "بداية", en: "الرئيسية" }, "about-us": { ar: "x".repeat(80), en: "About" } });
    expect(templatePageNamesFor(null, pages)).toEqual({});
    expect(templatePageNamesFor({}, [{ slug: "constructor", name: "C" }])).toEqual({});
  });

  it("meta after publish keeps the other fields and drops the draft names", () => {
    const raw = { demo: { x: 1 }, palette: ["#000"], pageNames: previous, draftPageNames: { home: { ar: "بداية", en: "Start" } } };
    expect(publishedTemplateMeta(raw, previous, pages.slice(0, 1))).toEqual({
      demo: { x: 1 },
      palette: ["#000"],
      pageNames: { home: { ar: "بداية", en: "Start" } },
    });
  });

  it("draft names are stored beside the published meta and overlay it only while there is a draft", () => {
    const meta = withDraftPageNames({ pageNames: previous }, { home: { ar: "بداية", en: "Start" } });
    expect(meta).toEqual({ pageNames: previous, draftPageNames: { home: { ar: "بداية", en: "Start" } } });
    expect(withDraftPageNames(meta, null)).toEqual({ pageNames: previous });
    expect(studioPageNames(meta, previous, pages, true).home).toEqual({ ar: "بداية", en: "Start" });
    expect(studioPageNames(meta, previous, pages, false).home).toEqual(previous.home);
  });
});
