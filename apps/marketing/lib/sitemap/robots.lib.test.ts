import { describe, expect, it } from "vitest";
import { crawlRules, marketplaceRobots, serializeRobots, storeRobots, TRAINING_CRAWLERS } from "./robots.lib";

const disallowed = (rules: ReturnType<typeof crawlRules>) => {
  const first = (Array.isArray(rules) ? rules[0] : rules) as { disallow?: string | string[] };
  return ([] as string[]).concat(first.disallow ?? []);
};

describe("robots private paths per default language", () => {
  it("blocks the /en copies on tallaby.com and Arabic-default stores, as before", () => {
    const list = disallowed(crawlRules());
    expect(list).toEqual(expect.arrayContaining(["/cart", "/en/cart", "/en/orders/"]));
    expect(list).not.toContain("/ar/cart");
    expect(disallowed(storeRobots("https://x.com", { indexable: true, defaultLocale: "ar" }).rules)).toEqual(list);
    expect(disallowed(marketplaceRobots("https://www.tallaby.com").rules)).toEqual(list);
  });

  it("blocks the /ar copies on an English-default store", () => {
    const list = disallowed(storeRobots("https://x.com", { indexable: true, defaultLocale: "en" }).rules);
    expect(list).toEqual(expect.arrayContaining(["/cart", "/ar/cart", "/ar/profile"]));
    expect(list).not.toContain("/en/cart");
  });
});

describe("model-training crawlers", () => {
  it("may read tallaby.com's public pages, under the same private-path rules as everyone", () => {
    const text = serializeRobots(marketplaceRobots("https://www.tallaby.com"));
    for (const agent of TRAINING_CRAWLERS) expect(text).not.toContain(`User-Agent: ${agent}`);
    expect(text.startsWith("User-Agent: *\nAllow: /\nDisallow: /cart\n")).toBe(true);
    expect(text.match(/^User-Agent:/gm)).toHaveLength(1);
    expect(text).toContain("Sitemap: https://www.tallaby.com/sitemap.xml");
  });

  it("stay fully blocked on a store host", () => {
    const text = serializeRobots(storeRobots("https://shop.example", { indexable: true }));
    expect(text).toContain(`${TRAINING_CRAWLERS.map((agent) => `User-Agent: ${agent}`).join("\n")}\nDisallow: /\n`);
  });
});
