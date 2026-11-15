import { describe, expect, it } from "vitest";
import { AI_SEO_LIMITS } from "./ai-seo.dto";
import { AI_SEO_SYSTEM_RULES, aiSeoRequestText, aiSeoTitleMax, capAiSeoInput, capText, cleanAiSeoOutput, pageTextExcerpt } from "./ai-seo.lib";

describe("capAiSeoInput", () => {
  it("cuts every input to its limit and flattens it", () => {
    const input = capAiSeoInput({
      language: "fr",
      target: "page",
      storeName: "x".repeat(200),
      storeDescription: "<b>Hand</b>made\n\n bags ".repeat(100),
      storeCategory: "c".repeat(90),
      categories: ["Bags", "bags", "Wallets", "A", "B", "C", "D", "E"],
      pageName: "About",
      pageText: "word ".repeat(400),
    });
    expect(input.language).toBe("ar");
    expect(input.storeName).toHaveLength(AI_SEO_LIMITS.storeName);
    expect(input.storeDescription.length).toBeLessThanOrEqual(AI_SEO_LIMITS.storeDescription);
    expect(input.storeDescription).not.toContain("<b>");
    expect(input.storeCategory.length).toBeLessThanOrEqual(AI_SEO_LIMITS.category);
    expect(input.categories).toEqual(["Bags", "Wallets", "A", "B", "C"]);
    expect(input.pageText.length).toBeLessThanOrEqual(AI_SEO_LIMITS.pageText);
  });

  it("sends no page data for the store target", () => {
    const input = capAiSeoInput({ language: "en", target: "store", storeName: "Sara", pageName: "About", pageText: "Hi there" });
    expect(input.pageName).toBe("");
    expect(input.pageText).toBe("");
  });

  it("cuts at a word", () => {
    expect(capText("hello wonderful world", 17)).toBe("hello wonderful");
    expect(capText(5, 10)).toBe("");
  });
});

describe("aiSeoRequestText", () => {
  it("puts only the per-call data after the fixed rules, leaving empty fields out", () => {
    const text = aiSeoRequestText(capAiSeoInput({ language: "en", target: "page", storeName: "Sara", pageName: "About us", pageText: "" , categories: ["Bags"] }));
    expect(text).toBe(["LANGUAGE: en", "TARGET: PAGE", "TITLE_MAX: 53", "STORE_NAME: Sara", "PRODUCT_CATEGORIES: Bags", "PAGE_NAME: About us"].join("\n"));
    expect(AI_SEO_SYSTEM_RULES).not.toContain("Sara");
    // The rules stay short: they are billed on every call.
    expect(AI_SEO_SYSTEM_RULES.length).toBeLessThan(1000);
  });

  it("keeps a page title room for the store name the template adds", () => {
    expect(aiSeoTitleMax({ target: "store", storeName: "Sara" })).toBe(AI_SEO_LIMITS.storeTitle);
    expect(aiSeoTitleMax({ target: "page", storeName: "x".repeat(50) })).toBe(25);
  });
});

describe("pageTextExcerpt", () => {
  it("reads only text props of the tree, skipping links and duplicates", () => {
    const tree = {
      sections: [
        { type: "custom-section", props: { title: { ar: "قصتنا", en: "Our story" }, href: "https://x.test", image: "/a.png" } },
        { children: [{ props: { text: "We make bags by hand." } }, { props: { text: "We make bags by hand." } }, { props: { label: "/shop" } }] },
      ],
    };
    expect(pageTextExcerpt(tree)).toBe("قصتنا. Our story. We make bags by hand.");
    expect(pageTextExcerpt(null)).toBe("");
    expect(pageTextExcerpt({ props: { text: "a ".repeat(2000) } }, 50).length).toBeLessThanOrEqual(50);
  });
});

describe("cleanAiSeoOutput", () => {
  it("clamps every field and takes the store name off a page title", () => {
    const out = cleanAiSeoOutput(
      { title: "About our bags | Sara", description: "d".repeat(300), keywords: ["#bags", "Bags", ...Array.from({ length: 20 }, (_, i) => `k${i}`)] },
      { target: "page", storeName: "Sara" },
    );
    expect(out.title).toBe("About our bags");
    expect(out.description.length).toBeLessThanOrEqual(AI_SEO_LIMITS.description);
    expect(out.keywords[0]).toBe("bags");
    expect(out.keywords).toHaveLength(AI_SEO_LIMITS.keywords);
  });

  it("never returns a title token", () => {
    expect(cleanAiSeoOutput({ title: "%s Sara bags", description: "", keywords: [] }, { target: "store", storeName: "Sara" }).title).toBe("Sara bags");
  });
});
