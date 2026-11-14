import { describe, expect, it } from "vitest";
import { crawlRules, storeRobots } from "./robots.lib";

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
  });

  it("blocks the /ar copies on an English-default store", () => {
    const list = disallowed(storeRobots("https://x.com", { indexable: true, defaultLocale: "en" }).rules);
    expect(list).toEqual(expect.arrayContaining(["/cart", "/ar/cart", "/ar/profile"]));
    expect(list).not.toContain("/en/cart");
  });
});
