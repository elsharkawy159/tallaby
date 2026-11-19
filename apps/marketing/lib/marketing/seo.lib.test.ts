import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import { loadAllMessages } from "@/i18n/messages";
import { FREE_ORDER_FEE_USD_CENTS, PRO_MONTHLY_USD_CENTS } from "@workspace/lib/billing";
import { hreflangMap, localizedUrl, sitemapEntries, templateMetaDesc } from "./seo.lib";
import { SITE_URL } from "./site.lib";
import { breadcrumbSchema, faqSchema, organizationReference, serializeJsonLd, siteGraph, softwareApplicationSchema } from "./structured-data.lib";
import { metaUsdPriceVars } from "./pricing.lib";

describe("localized URLs and hreflang", () => {
  it("leaves Arabic unprefixed and has no trailing slash on the home page", () => {
    expect(localizedUrl("ar", "/")).toBe(SITE_URL);
    expect(localizedUrl("en", "/")).toBe(`${SITE_URL}/en`);
    expect(localizedUrl("ar", "/pricing")).toBe(`${SITE_URL}/pricing`);
    expect(localizedUrl("en", "/pricing")).toBe(`${SITE_URL}/en/pricing`);
  });

  it("points x-default at Arabic, or at the only language of a one-language post", () => {
    expect(hreflangMap("/faq")).toEqual({
      en: `${SITE_URL}/en/faq`,
      ar: `${SITE_URL}/faq`,
      "x-default": `${SITE_URL}/faq`,
    });
    expect(hreflangMap("/blog/a", ["en"])).toEqual({
      en: `${SITE_URL}/en/blog/a`,
      "x-default": `${SITE_URL}/en/blog/a`,
    });
  });
});

describe("sitemap entries", () => {
  it("lists every language version as its own URL with the same alternates", () => {
    const entries = sitemapEntries("/pricing");
    expect(entries.map((e) => e.url).sort()).toEqual([`${SITE_URL}/en/pricing`, `${SITE_URL}/pricing`]);
    expect(entries[0]!.alternates).toEqual(entries[1]!.alternates);
    expect(entries[0]!.alternates.languages["x-default"]).toBe(`${SITE_URL}/pricing`);
  });

  it("lists a one-language post once and keeps its date", () => {
    expect(sitemapEntries("/blog/a", ["ar"], "2026-10-01")).toEqual([
      {
        url: `${SITE_URL}/blog/a`,
        lastModified: "2026-10-01",
        alternates: { languages: { ar: `${SITE_URL}/blog/a`, "x-default": `${SITE_URL}/blog/a` } },
      },
    ]);
  });
});

describe("templateMetaDesc", () => {
  it("drops closing punctuation so the message never renders two periods", () => {
    expect(templateMetaDesc("Four ready pages.")).toBe("Four ready pages");
    expect(templateMetaDesc("أربع صفحات جاهزة. ")).toBe("أربع صفحات جاهزة");
  });

  it("cuts a long blurb on a word boundary", () => {
    const out = templateMetaDesc(`${"word ".repeat(40)}end.`);
    expect(out.length).toBeLessThanOrEqual(115);
    expect(out.endsWith("word")).toBe(true);
  });
});

describe("meta messages", () => {
  const pages = (meta: Record<string, unknown>) =>
    Object.entries(meta).filter((e): e is [string, { title: string; description: string }] => typeof e[1] === "object");

  for (const [locale, base, brand] of [
    ["ar", ar.meta, "طلبي"],
    ["en", en.meta, "Tallaby"],
  ] as const) {
    it(`${locale}: titles and descriptions fit search results and do not repeat the brand`, async () => {
      // What tallaby.com really renders: the marketing groups win over the base strings.
      const meta = { ...base, ...((await loadAllMessages(locale)).meta as Record<string, unknown>) };
      for (const [page, { title, description }] of pages(meta)) {
        if (page === "template") continue; // Filled in per template.
        if (page.startsWith("compare")) continue; // "Tallaby vs X" names the brand on purpose (not public yet).
        const full = page === "home" ? title : `${title} | ${brand}`;
        expect(full.length, `${page} title`).toBeLessThanOrEqual(62);
        expect(description.length, `${page} description`).toBeGreaterThanOrEqual(50);
        expect(description.length, `${page} description`).toBeLessThanOrEqual(165);
        if (page !== "home") expect(title, `${page} title`).not.toContain(brand);
      }
    });
  }

  it("has the same pages in both languages", () => {
    expect(pages(ar.meta).map(([k]) => k)).toEqual(pages(en.meta).map(([k]) => k));
  });
});

describe("USD figures in search snippets", () => {
  it("come from the billing module in both languages", async () => {
    expect(metaUsdPriceVars("en")).toEqual({ orderFeeUsd: `$${(FREE_ORDER_FEE_USD_CENTS / 100).toFixed(2)}`, proUsd: `$${PRO_MONTHLY_USD_CENTS / 100}` });
    expect(metaUsdPriceVars("ar")).toEqual({ orderFeeUsd: `${(FREE_ORDER_FEE_USD_CENTS / 100).toFixed(2)} دولار`, proUsd: `${PRO_MONTHLY_USD_CENTS / 100} دولار` });
    for (const locale of ["ar", "en"] as const) {
      const meta = (await loadAllMessages(locale)).meta as Record<string, { description: string }>;
      expect(meta.home!.description, `${locale} home`).toContain("{orderFeeUsd}");
      expect(meta.pricing!.description, `${locale} pricing`).toContain("{orderFeeUsd}");
      expect(meta.pricing!.description, `${locale} pricing`).toContain("{proUsd}");
    }
  });
});

describe("structured data", () => {
  const graphInput = { description: "Tallaby is an online store builder.", knowsAbout: ["E-commerce"] };

  it("names the brand in both languages and invents no ratings or reviews", () => {
    const graph = JSON.stringify(siteGraph(graphInput));
    const app = JSON.stringify(softwareApplicationSchema({ url: SITE_URL, description: "d", inLanguage: "ar" }));
    expect(graph).toContain("طلبي");
    expect(graph).toContain("+201003272830");
    for (const json of [graph, app]) expect(json).not.toMatch(/aggregateRating|"review"|founder/);
    expect(graph).not.toContain("SearchAction"); // tallaby.com has no site search.
  });

  it("describes the organization: Cairo address, served worldwide, no Egypt-only area", () => {
    const org = siteGraph(graphInput)["@graph"][0] as Record<string, unknown>;
    expect(org.description).toBe(graphInput.description);
    expect(org.address).toEqual({ "@type": "PostalAddress", addressLocality: "Cairo", addressCountry: "EG" });
    expect(org.areaServed).toBe("Worldwide");
    expect(org.knowsAbout).toEqual(["E-commerce"]);
    expect(JSON.stringify(org.contactPoint)).not.toContain("areaServed");
    expect(org).not.toHaveProperty("foundingDate"); // Not stated anywhere in the repo.
  });

  it("names the blog publisher exactly as the Organization", () => {
    const org = siteGraph(graphInput)["@graph"][0] as Record<string, unknown>;
    const ref = organizationReference();
    expect([ref["@id"], ref.name, ref.alternateName]).toEqual([org["@id"], org.name, org.alternateName]);
  });

  it("offers both plans in USD from the billing module, whatever the EGP rate", () => {
    const { offers } = softwareApplicationSchema({ url: SITE_URL, description: "d", inLanguage: "en" });
    const free = offers[0]!;
    const pro = offers[1]!;
    expect([free.name, free.price, free.priceCurrency]).toEqual(["Free", "0", "USD"]);
    expect(free.priceSpecification).toEqual({
      "@type": "UnitPriceSpecification",
      price: (FREE_ORDER_FEE_USD_CENTS / 100).toFixed(2),
      priceCurrency: "USD",
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitText: "order" },
    });
    expect([pro.name, pro.price, pro.priceCurrency]).toEqual(["Pro", String(PRO_MONTHLY_USD_CENTS / 100), "USD"]);
    expect(pro.priceSpecification).toMatchObject({ price: String(PRO_MONTHLY_USD_CENTS / 100), priceCurrency: "USD", billingDuration: "P1M" });
  });

  it("builds FAQPage data from the strings shown, prices filled and isolates removed", () => {
    const data = faqSchema([{ q: "Cost?", a: "{orderFee} per order, top up within {days} days." }], { orderFee: "\u2068≈ 1.62 EGP\u2069" });
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Cost?",
      acceptedAnswer: { "@type": "Answer", text: expect.stringMatching(/^≈ 1\.62 EGP per order, top up within \d+ days\.$/) },
    });
  });

  it("numbers breadcrumbs from 1", () => {
    const crumbs = breadcrumbSchema([
      { name: "a", url: "u1" },
      { name: "b", url: "u2" },
    ]);
    expect(crumbs.itemListElement.map((x) => x.position)).toEqual([1, 2]);
  });

  it("escapes < so text cannot close the script tag", () => {
    expect(serializeJsonLd({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}');
  });
});
