import { describe, expect, it } from "vitest";
import {
  PRODUCT_PAGE_PATH_REGEX,
  buildSlugIndex,
  mapViewsToProducts,
  parseProductPagePath,
  parseProductViewsReport,
  productViewsReportBody,
  viewsToOrdersPercent,
} from "./product-views.lib";

describe("productViewsReportBody", () => {
  it("asks for page paths of only the given stores' product pages", () => {
    const body = productViewsReportBody(["s1", "s2"], 30);
    expect(body.dateRanges).toEqual([{ startDate: "29daysAgo", endDate: "today" }]);
    expect(body.dimensions).toEqual([{ name: "pagePath" }]);
    const [stores, paths] = body.dimensionFilter.andGroup.expressions;
    expect(stores!.filter).toMatchObject({
      fieldName: "customEvent:store_id",
      inListFilter: { values: ["s1", "s2"], caseSensitive: true },
    });
    expect(paths!.filter).toMatchObject({ fieldName: "pagePath", stringFilter: { matchType: "FULL_REGEXP" } });
  });

  it("the regex matches product pages only", () => {
    const re = new RegExp(PRODUCT_PAGE_PATH_REGEX);
    for (const ok of ["/products/a", "/en/products/a", "/ar/products/a/", "/products/%D8%B4"]) expect(re.test(ok)).toBe(true);
    for (const no of ["/products", "/products/", "/products/a/b", "/fr/products/a", "/cart", "/about"]) expect(re.test(no)).toBe(false);
  });
});

describe("parseProductViewsReport", () => {
  it("keeps rows with a path and positive views", () => {
    expect(
      parseProductViewsReport({
        rows: [
          { dimensionValues: [{ value: "/products/a" }], metricValues: [{ value: "12" }] },
          { dimensionValues: [{ value: "/products/b" }], metricValues: [{ value: "0" }] },
          { dimensionValues: [{ value: "" }], metricValues: [{ value: "3" }] },
          { metricValues: [{ value: "x" }] },
        ],
      }),
    ).toEqual([{ path: "/products/a", views: 12 }]);
    expect(parseProductViewsReport(null)).toEqual([]);
  });
});

describe("parseProductPagePath", () => {
  it("reads the locale prefix and decodes the slug", () => {
    expect(parseProductPagePath("/products/red-mug")).toEqual({ locale: "ar", slug: "red-mug" });
    expect(parseProductPagePath("/ar/products/red-mug/")).toEqual({ locale: "ar", slug: "red-mug" });
    expect(parseProductPagePath("/en/products/red-mug")).toEqual({ locale: "en", slug: "red-mug" });
    expect(parseProductPagePath("/products/%D9%83%D9%88%D8%A8")).toEqual({ locale: "ar", slug: "كوب" });
    expect(parseProductPagePath("/products/%E0%A4%A")).toEqual({ locale: "ar", slug: "%E0%A4%A" });
  });

  it("rejects other paths", () => {
    expect(parseProductPagePath("/products")).toBeNull();
    expect(parseProductPagePath("/products/a/b")).toBeNull();
    expect(parseProductPagePath("/blog/a")).toBeNull();
    expect(parseProductPagePath("/fr/products/a")).toBeNull();
  });
});

describe("buildSlugIndex + mapViewsToProducts", () => {
  const rows = [
    { productId: "p1", locale: "ar", slug: "kob", createdAt: "2026-01-01" },
    { productId: "p1", locale: "en", slug: "mug", createdAt: "2026-01-01" },
    { productId: "p2", locale: "ar", slug: "shared", createdAt: "2026-03-01" },
    { productId: "p3", locale: "ar", slug: "shared", createdAt: "2026-02-01" },
    { productId: "p4", locale: "en", slug: null, createdAt: "2026-01-01" },
    { productId: "p5", locale: "en", slug: "  ", createdAt: "2026-01-01" },
  ];

  it("ties on a slug go to the oldest product", () => {
    const index = buildSlugIndex(rows);
    expect(index.get("ar:shared")).toBe("p3");
    expect(index.size).toBe(3);
  });

  it("sums views per product across locales and stores, own locale first then the other", () => {
    const views = mapViewsToProducts(
      [
        { path: "/products/kob", views: 5 },
        { path: "/en/products/mug", views: 3 },
        { path: "/en/products/kob", views: 2 }, // en page with only an ar slug: storefront falls back
        { path: "/products/mug", views: 1 }, // ar page with only an en slug
        { path: "/products/shared", views: 4 },
        { path: "/products/someone-else", views: 99 },
        { path: "/cart", views: 7 },
      ],
      buildSlugIndex(rows),
    );
    expect(Object.fromEntries(views)).toEqual({ p1: 11, p3: 4 });
  });
});

describe("viewsToOrdersPercent", () => {
  it("is null without views and a percentage otherwise", () => {
    expect(viewsToOrdersPercent(0, 3)).toBeNull();
    expect(viewsToOrdersPercent(200, 3)).toBe(1.5);
    expect(viewsToOrdersPercent(10, 0)).toBe(0);
    expect(viewsToOrdersPercent(4, -1)).toBe(0);
  });
});
