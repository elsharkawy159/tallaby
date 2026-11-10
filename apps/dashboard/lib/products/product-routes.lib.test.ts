import { describe, expect, it } from "vitest";
import {
  inStoreProductsHref,
  legacyProductsTarget,
  searchParamsQuery,
  storeIdOfProductsPath,
  storeProductsHref,
} from "./product-routes.lib";

/** Products under their store, and the old /products URLs (ROADMAP.md F-87c slice 2). */
const STORE = "22222222-2222-4222-8222-222222222222";
const P = `/stores/${STORE}/products`;

describe("storeProductsHref", () => {
  it("builds the store's Products paths", () => {
    expect(storeProductsHref(STORE)).toBe(P);
    expect(storeProductsHref(STORE, "/add")).toBe(`${P}/add`);
    expect(storeProductsHref(STORE, "add")).toBe(`${P}/add`);
    expect(storeProductsHref(STORE, "?tab=draft")).toBe(`${P}?tab=draft`);
    expect(storeProductsHref(STORE, "#x")).toBe(`${P}#x`);
  });

  it("keeps the old path when there is no store (the redirect page handles it)", () => {
    expect(storeProductsHref(null, "/add")).toBe("/products/add");
    expect(storeProductsHref("", "")).toBe("/products");
  });
});

describe("legacyProductsTarget (old /products URL → the selected store)", () => {
  it("maps the list, keeping the query string, repeated keys included", () => {
    expect(legacyProductsTarget(STORE, undefined, {})).toBe(P);
    const url = new URL(legacyProductsTarget(STORE, [], { tab: "draft", q: "طقم & كوب" }), "https://x.test");
    expect(url.pathname).toBe(P);
    expect(Object.fromEntries(url.searchParams)).toEqual({ tab: "draft", q: "طقم & كوب" });
    expect(legacyProductsTarget(STORE, [], { a: ["1", "2"], skip: undefined })).toBe(`${P}?a=1&a=2`);
  });

  it("maps every sub-path segment for segment", () => {
    expect(legacyProductsTarget(STORE, ["add"])).toBe(`${P}/add`);
    expect(legacyProductsTarget(STORE, ["add", "from-file"])).toBe(`${P}/add/from-file`);
    expect(legacyProductsTarget(STORE, ["abc", "edit"])).toBe(`${P}/abc/edit`);
    expect(legacyProductsTarget(STORE, ["inventory"], { product: "p1" })).toBe(`${P}/inventory?product=p1`);
    expect(legacyProductsTarget(STORE, ["trash"])).toBe(`${P}/trash`);
  });

  it("encodes segments again, so a decoded segment can't escape the store's path", () => {
    expect(legacyProductsTarget(STORE, ["a/b"])).toBe(`${P}/a%2Fb`);
    expect(legacyProductsTarget(STORE, ["..", ".", "x"])).toBe(`${P}/x`);
    expect(legacyProductsTarget(STORE, ["كوب"])).toBe(`${P}/${encodeURIComponent("كوب")}`);
    expect(legacyProductsTarget(STORE, ["x?y=1"])).toBe(`${P}/x%3Fy%3D1`);
  });
});

describe("helpers", () => {
  it("writes Next searchParams back as a query", () => {
    expect(searchParamsQuery(undefined)).toBe("");
    expect(searchParamsQuery({ page: "2" })).toBe("?page=2");
  });

  it("moves only old Products links into a store", () => {
    expect(inStoreProductsHref("/products", STORE)).toBe(P);
    expect(inStoreProductsHref("/products/add?method=choose", STORE)).toBe(`${P}/add?method=choose`);
    expect(inStoreProductsHref("/productsx", STORE)).toBe("/productsx");
    expect(inStoreProductsHref("/orders", STORE)).toBe("/orders");
    expect(inStoreProductsHref("/products/add", null)).toBe("/products/add");
  });

  it("reads the store of a Products path", () => {
    expect(storeIdOfProductsPath(`${P}/abc/edit`)).toBe(STORE);
    expect(storeIdOfProductsPath(P)).toBe(STORE);
    expect(storeIdOfProductsPath(`/stores/${STORE}/settings`)).toBeNull();
    expect(storeIdOfProductsPath("/products")).toBeNull();
  });
});
