import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CODE_TEMPLATES } from "@workspace/store-sections/templates";
import type { NeedMessages } from "@/components/marketing/industries/industry-page";
import { contentPagePaths } from "./content-routes.lib";
import { INDUSTRIES, INDUSTRY_GROUPS, industryTemplates, STORE_KIND_LINKS, type IndustryNeedVisual } from "./industries.lib";
import { CONTENT_PAGE_LASTMOD, pageLastModified, STATIC_PAGE_LASTMOD } from "./sitemap.lib";
import { categoryCode } from "./templates.lib";

type Json = Record<string, unknown>;
const load = (locale: string) => JSON.parse(readFileSync(path.resolve(__dirname, `../../messages/marketing/industries.${locale}.json`), "utf8")) as Json;

/** The code catalog as the gallery sees it: key and filter code. */
const catalog = CODE_TEMPLATES.map((template) => ({ id: template.key, category: categoryCode(template.category) }));

/** What each picture reads from the need's words, so a page never draws an empty mock. */
const NEEDS_FIELDS: Partial<Record<IndustryNeedVisual, (keyof NeedMessages)[]>> = {
  variants: ["stock"],
  countdown: ["offer", "lead"],
  catalog: ["handle", "tag", "viewProducts"],
  sizes: ["label", "options"],
  specs: ["rows"],
  zones: ["rows"],
  offers: ["label", "tiers"],
  reviews: ["reviews"],
  notes: ["label", "text"],
  alert: ["app", "time", "label", "body"],
  restock: ["label", "placeholder", "button"],
};

describe("industries", () => {
  it("has unique slugs ending in -store, each in a hub group", () => {
    const slugs = INDUSTRIES.map((industry) => industry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const industry of INDUSTRIES) {
      expect(industry.slug).toMatch(/^[a-z-]+-store$/);
      expect(INDUSTRY_GROUPS).toContain(industry.group);
    }
    expect(INDUSTRIES.filter((industry) => industry.featured)).toHaveLength(3);
  });

  it("shows at least 3 real templates of its own niche on every page (SEO_PLAN.md §16.5)", () => {
    for (const industry of INDUSTRIES) {
      const shown = industryTemplates(industry, catalog);
      expect(shown.length, industry.slug).toBeGreaterThanOrEqual(3);
      for (const key of industry.templateKeys ?? []) expect(catalog.some((entry) => entry.id === key), `${industry.slug}: ${key}`).toBe(true);
      for (const entry of shown) expect(entry.category, `${industry.slug}: ${entry.id}`).toBe(industry.templateCategory);
    }
  });

  it("uses only product photos from public/ or Pexels, one per demo product", () => {
    for (const industry of INDUSTRIES) {
      for (const photo of [industry.photo, ...(industry.productPhotos ?? [])]) expect(photo, industry.slug).toMatch(/^(\/[\w-]+\.(png|jpg|webp)|https:\/\/images\.pexels\.com\/photos\/\d+\/)/);
      if (industry.productPhotos) expect(industry.productPhotos, industry.slug).toHaveLength(industry.productFocus.length);
      expect(industry.productColors, industry.slug).toHaveLength(industry.productFocus.length);
    }
  });

  it("points every store-kind chip at a real industry page", () => {
    const pages = new Set(INDUSTRIES.map((industry) => `/industries/${industry.slug}`));
    expect(STORE_KIND_LINKS.map((kind) => kind.href).sort()).toEqual([...pages].sort());
  });

  it("lists the hub and every industry in the sitemap with this change's date", () => {
    const paths = contentPagePaths(false);
    expect(paths).toContain("/industries");
    for (const industry of INDUSTRIES) {
      expect(paths).toContain(`/industries/${industry.slug}`);
      expect(pageLastModified(`/industries/${industry.slug}`)).toBe(CONTENT_PAGE_LASTMOD[`/industries/${industry.slug}`]);
    }
  });

  it("keeps per-page content dates real, past and out of the static list", () => {
    const content = new Set(contentPagePaths(true));
    for (const [page, date] of Object.entries(CONTENT_PAGE_LASTMOD)) {
      expect(content.has(page), page).toBe(true);
      expect(STATIC_PAGE_LASTMOD[page], page).toBeUndefined();
      expect(date, page).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Date.parse(date) <= Date.now(), page).toBe(true);
    }
  });
});

describe.each(["ar", "en"])("industry messages (%s)", (locale) => {
  const m = load(locale) as Record<string, Record<string, Json>>;

  it("names every industry on the hub, and every chip", () => {
    for (const industry of INDUSTRIES) {
      expect(m.industriesHub!.items![industry.slug as never], industry.slug).toBeTruthy();
      expect(m.industriesHub!.categories![industry.group as never], industry.group).toBeTruthy();
      expect(m.meta![`industry-${industry.slug}`], industry.slug).toBeTruthy();
    }
    for (const kind of STORE_KIND_LINKS) expect(m.storeKinds![kind.key], kind.key).toBeTruthy();
    expect(m.meta!.industries).toBeTruthy();
  });

  it("gives each need picture the words it draws", () => {
    for (const industry of INDUSTRIES) {
      const words = m.industryPages![industry.slug] as unknown as { needs: NeedMessages[]; callouts: unknown[]; faq: unknown[] };
      expect(words.callouts, industry.slug).toHaveLength(5);
      expect(words.faq.length, industry.slug).toBeGreaterThanOrEqual(5);
      industry.needs.forEach(({ visual }, i) => {
        for (const field of NEEDS_FIELDS[visual] ?? []) expect(words.needs[i]![field], `${industry.slug} need ${i} ${field}`).toBeTruthy();
      });
    }
  });

  it("writes each industry's own copy (no shared H1, lead or FAQ)", () => {
    const pages = INDUSTRIES.map((industry) => m.industryPages![industry.slug] as unknown as { title: string; lead: string; faq: { q: string }[] });
    for (const key of ["title", "lead"] as const) expect(new Set(pages.map((page) => page[key])).size).toBe(pages.length);
    const questions = pages.flatMap((page) => page.faq.map((item) => item.q));
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("states no Tallaby price as a literal and uses the house words", () => {
    const text = JSON.stringify(m);
    expect(text).not.toMatch(/\$\s?\d|\d\s?\$|USD/);
    if (locale === "ar") expect(text).not.toMatch(/ج\.م|موبايل|إزاي|عشان|دومين|البائع|الجوال/);
  });
});
