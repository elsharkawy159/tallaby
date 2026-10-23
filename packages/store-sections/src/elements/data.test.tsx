import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../config/schema";
import { collectCatalogQueries, collectContentQueries, collectFormIds } from "../core/registry";
import { DEMO_PRODUCT } from "../core/demo-product";
import type { RenderContext } from "../core/types";
import { storeSectionRegistry } from "../sections";
import { customSection } from "../sections/custom";
import { CATALOG_LIST_ID, boundValue, listRecords, nodeCatalogQuery, nodeContentQuery, nodeFormId, productCatalogSection, treeDataNeeds } from "./data";
import { renderElementTree } from "./render";
import { canContain, createNode } from "./tree";

const node = (type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = [], id = type): ComponentNode =>
  ({ id, type, props, children }) as ComponentNode;

const ctx = (over: Partial<RenderContext> = {}): RenderContext => ({
  mode: "public",
  locale: "en",
  dir: "ltr",
  store: { name: "Store", url: "https://x.tallaby.com" },
  pages: [],
  catalog: { products: {}, categories: [] },
  Link: ({ href, children }) => <a href={href}>{children}</a>,
  imageUrl: (src) => src || null,
  formatPrice: (n) => `EGP ${n}`,
  ...over,
});

const product = { id: "p1", title: "Earbuds", href: "/products/p1", image: "https://cdn.test/p1.jpg", price: 900, compareAtPrice: 1200 };

describe("data node queries", () => {
  it("builds a product query from checked props", () => {
    expect(nodeCatalogQuery(node("productList", { source: "best-sellers", limit: 99, sort: "nope" }))).toEqual({
      kind: "products",
      source: "best-sellers",
      sort: "default",
      limit: 24,
    });
    expect(nodeCatalogQuery(node("productList", { source: "bogus" }))).toMatchObject({ source: "newest", limit: 8 });
    // A category or hand-picked list without its pick asks for nothing.
    expect(nodeCatalogQuery(node("productList", { source: "category" }))).toBeNull();
    expect(nodeCatalogQuery(node("productList", { source: "selected", productIds: ["bad id!", 3] }))).toBeNull();
    expect(nodeCatalogQuery(node("productList", { source: "selected", productIds: ["p1", "p2"] }))).toMatchObject({ productIds: ["p1", "p2"] });
  });

  it("collects queries per node id from tree sections, with forms and blog posts", () => {
    const tree = [
      node("section", {}, [
        node("productList", { source: "newest", limit: 4 }, [], "list-a"),
        node("postList", { limit: 2, offset: 1 }, [], "posts"),
        node("storeForm", { formId: "f1" }, [], "form"),
      ]),
    ];
    const sections = [{ id: "s1", sectionId: "custom-section", version: 1, props: {}, componentTree: tree }];
    expect(collectCatalogQueries(sections, storeSectionRegistry)).toEqual({ "list-a": { kind: "products", source: "newest", sort: "default", limit: 4 } });
    expect(collectContentQueries(sections, storeSectionRegistry)).toEqual({ posts: { collection: "blog", limit: 3 } });
    expect(collectFormIds(sections, storeSectionRegistry)).toEqual(["f1"]);
    expect(treeDataNeeds(tree).sort()).toEqual(["articles", "forms", "products"]);
    expect(nodeContentQuery(node("text"))).toBeNull();
    expect(nodeFormId(node("storeForm", { formId: "../x" }))).toBeNull();
  });
});

describe("bindings", () => {
  it("fills record fields and skips missing ones", () => {
    const scope = { kind: "productList" as const, record: product };
    const c = ctx();
    expect(boundValue(scope, "price", c)).toBe("EGP 900");
    expect(boundValue(scope, "compareAtPrice", c)).toBe("EGP 1200");
    expect(boundValue(scope, "discount", c)).toBe("-25%");
    expect(boundValue({ kind: "productList", record: { ...product, compareAtPrice: null } }, "compareAtPrice", c)).toBeNull();
    expect(boundValue(scope, "nope", c)).toBeNull();
  });

  it("repeats the template per record and keeps placeholders out", () => {
    const list = node("productList", { source: "newest" }, [
      node("vFlex", { label: "Card" }, [
        node("text", { bind: "title", text: "Product name" }),
        node("text", { bind: "compareAtPrice", text: "was" }),
        node("addToCart"),
      ]),
    ]);
    const html = renderToStaticMarkup(
      <>
        {renderElementTree(
          [list],
          ctx({
            catalog: { products: { productList: [product, { ...product, id: "p2", title: "Charger", compareAtPrice: null }] }, categories: [] },
            renderAddToCart: (p) => <button>add {p.id}</button>,
          }),
        )}
      </>,
    );
    expect(html).toContain("Earbuds");
    expect(html).toContain("Charger");
    expect(html).toContain("add p2");
    expect(html).not.toContain("Product name");
    expect(html.match(/EGP 1200/g)).toHaveLength(1);
  });

  it("shows picked categories in the seller's order", () => {
    const categories = ["a", "b", "c"].map((id) => ({ id, key: id, name: id.toUpperCase(), href: `/c/${id}`, image: null }));
    const records = listRecords(node("categoryList", { categoryIds: ["c", "a", "zz"] }), ctx({ catalog: { products: {}, categories } }));
    expect(records.map((r) => r.record.id)).toEqual(["c", "a"]);
  });

  it("skips the first records of a list with an offset (lead and rest designs)", () => {
    const products = ["p1", "p2", "p3", "p4"].map((id) => ({ ...product, id }));
    const rest = node("productList", { source: "featured", limit: 2, offset: 1 }, [], "rest");
    expect(nodeCatalogQuery(rest)).toMatchObject({ limit: 3 });
    expect(listRecords(rest, ctx({ catalog: { products: { rest: products }, categories: [] } })).map((r) => r.record.id)).toEqual(["p2", "p3"]);
    const categories = ["a", "b", "c"].map((id) => ({ id, key: id, name: id, href: `/c/${id}`, image: null }));
    const more = node("categoryList", { limit: 6, offset: 1 });
    expect(nodeCatalogQuery(more)).toEqual({ kind: "categories", limit: 7 });
    expect(listRecords(more, ctx({ catalog: { products: {}, categories } })).map((r) => r.record.id)).toEqual(["b", "c"]);
  });
});

describe("nesting", () => {
  it("never puts a list inside another list", () => {
    let n = 0;
    const makeId = () => `n${++n}`;
    const outer = createNode("productList", makeId);
    const tree = [node("section", {}, [outer], "root")];
    expect(canContain(tree, outer.id, createNode("postList", makeId))).toBe(false);
    expect(canContain(tree, outer.id, createNode("text", makeId))).toBe(true);
    expect(canContain(tree, "root", createNode("postList", makeId))).toBe(true);
  });
});

describe("productCatalogSection", () => {
  const page = (isHome: boolean, tree: ComponentNode[]) =>
    ({ slug: isHome ? "home" : "about", isHome, name: "p", seo: {}, content: { sections: [{ id: `s-${isHome}`, sectionId: "custom-section", version: 1, props: {}, componentTree: tree }] } }) as never;

  it("reuses the home page's product card in a catalog grid", () => {
    const homeCard = node("text", { bind: "title" }, [], "home-title");
    const otherCard = node("text", { bind: "title" }, [], "other-title");
    const homeList = { ...node("productList", { source: "featured", limit: 4 }, [homeCard], "home-list"), style: { gap: 20 }, breakpointStyles: { mobile: { gap: 12 } } } as ComponentNode;
    const instance = productCatalogSection([page(false, [node("section", {}, [node("productList", {}, [otherCard], "other-list")])]), page(true, [node("section", {}, [homeList])])]);
    const list = instance?.componentTree?.[0]?.children[0];
    expect(list?.id).toBe(CATALOG_LIST_ID);
    expect(list?.children).toEqual([homeCard]);
    expect(list?.style).toEqual({ columns: 4, gap: 20 });
    expect(list?.breakpointStyles).toEqual({ tablet: { columns: 3 }, mobile: { columns: 2, gap: 12 } });

    const html = renderToStaticMarkup(<>{renderElementTree(instance!.componentTree, ctx({ catalog: { products: { [CATALOG_LIST_ID]: [product] }, categories: [] } }))}</>);
    expect(html).toContain("Earbuds");
  });

  it("is null when the site has no product list", () => {
    expect(productCatalogSection([page(true, [node("section", {}, [node("heading", { text: "Hi" })])])])).toBeNull();
  });
});

describe("paginated product lists", () => {
  const card = node("text", { bind: "title", text: "Name" }, [], "title");
  const list = node("productList", { source: "newest", limit: 12, offset: 2, paginate: true }, [card], "grid");

  it("asks for one page of `limit` products and skips no lead record", () => {
    expect(nodeCatalogQuery(list)).toEqual({ kind: "products", source: "newest", sort: "default", limit: 12, paginate: true });
    const records = Array.from({ length: 12 }, (_, i) => ({ ...product, id: `p${i}`, title: `P${i}` }));
    expect(listRecords(list, ctx({ catalog: { products: { grid: records }, categories: [] } }))[0]?.record).toMatchObject({ id: "p0" });
  });

  it("draws page links from the host's page state", () => {
    const html = renderToStaticMarkup(
      <>
        {renderElementTree(
          [list],
          ctx({
            catalog: { products: { grid: [product] }, categories: [], productPages: { grid: { page: 2, totalPages: 5 } } },
            productPageHref: (n) => (n > 1 ? `/?page=${n}` : "/"),
          }),
        )}
      </>,
    );
    expect(html).toContain('data-part="pager"');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/?page=3"');
    expect(html).toContain('href="/?page=5"');
    expect(html).toContain('aria-current="page"');
    // One page, or no page links from the host: no pager.
    const single = ctx({ catalog: { products: { grid: [product] }, categories: [], productPages: { grid: { page: 1, totalPages: 1 } } }, productPageHref: () => "/" });
    expect(renderToStaticMarkup(<>{renderElementTree([list], single)}</>)).not.toContain("pager");
    expect(renderToStaticMarkup(<>{renderElementTree([list], ctx({ catalog: { products: { grid: [product] }, categories: [] } }))}</>)).not.toContain("pager");
  });
});

describe("product scope", () => {
  const detail = { ...DEMO_PRODUCT, title: "Pro Headset", price: 900, compareAtPrice: 1200 };
  const page = (tree: ComponentNode[], over: Partial<RenderContext> = {}) =>
    renderToStaticMarkup(
      <customSection.Component props={{}} instance={{ id: "s", sectionId: "custom-section", version: 1, props: {}, componentTree: tree }} ctx={ctx(over)} />,
    );

  it("bound heading inside a section shows ctx.product title", () => {
    const html = page([node("section", {}, [node("heading", { bind: "title", text: "Product name" })])], { product: detail });
    expect(html).toContain("Pro Headset");
    expect(html).not.toContain("Product name");
  });

  it("bound price null compareAt hides the node", () => {
    const tree = [node("section", {}, [node("text", { bind: "price", text: "p" }), node("text", { bind: "compareAtPrice", text: "was" })])];
    const html = page(tree, { product: { ...detail, compareAtPrice: null } });
    expect(html).toContain("EGP 900");
    expect(html).not.toContain("was");
    expect(boundValue({ kind: "product", record: detail }, "discount", ctx())).toBe("-25%");
    expect(boundValue({ kind: "product", record: detail }, "brand", ctx())).toBe(detail.brand);
    expect(boundValue({ kind: "product", record: { ...detail, reviewCount: 0 } }, "reviewCount", ctx())).toBeNull();
  });

  it("no ctx.product: bound nodes render nothing in public, authored text in edit", () => {
    const tree = [node("section", {}, [node("heading", { bind: "title", text: "Product name" })])];
    expect(page(tree)).not.toContain("Product name");
    expect(page(tree, { mode: "edit" })).toContain("Product name");
  });

  it("addToCart in product scope calls renderAddToCart with a product without variants", () => {
    const html = page([node("section", {}, [node("addToCart")])], { product: { ...detail, variants: [] }, renderAddToCart: (p) => <button>add {p.id}</button> });
    expect(html).toContain("add demo-product");
  });

  it("a productList inside still re-scopes its children", () => {
    const tree = [node("section", {}, [node("productList", { source: "newest" }, [node("text", { bind: "title" })])])];
    const html = page(tree, { product: detail, catalog: { products: { productList: [product] }, categories: [] } });
    expect(html).toContain("Earbuds");
    expect(html).not.toContain("Pro Headset");
  });
});
