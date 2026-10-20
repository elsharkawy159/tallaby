import { describe, expect, it } from "vitest";
import { collectCatalogQueries } from "../core/registry";
import { storeSectionRegistry } from "../sections";
import { getCodeTemplate } from "./catalog";
import { resolveDemoCatalog } from "./demo-catalog";

describe("resolveDemoCatalog", () => {
  it("fills every product list of a template's home page from its demo store", () => {
    const template = getCodeTemplate("atelier")!;
    const home = template.config().pages.find((p) => p.isHome)!;
    const queries = collectCatalogQueries(home.content.sections, storeSectionRegistry);
    const catalog = resolveDemoCatalog(queries, template.demo, "en");

    const productLists = Object.entries(queries).filter(([, q]) => q.kind === "products");
    expect(productLists.length).toBeGreaterThan(0);
    for (const [id] of productLists) expect(catalog.products[id]!.length).toBeGreaterThan(0);
    expect(catalog.categories).toHaveLength(template.demo.categories.length);
    expect(catalog.categories[0]!.name).toBe(template.demo.categories[0]!.name.en);
  });

  it("gives empty lists without a demo store", () => {
    const catalog = resolveDemoCatalog({ a: { kind: "products", source: "all", limit: 4 } }, null, "ar");
    expect(catalog.products.a).toEqual([]);
    expect(catalog.categories).toEqual([]);
  });
});
