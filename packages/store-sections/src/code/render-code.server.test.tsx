import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import { collectCatalogQueries } from "../core/registry";
import type { CodeSectionsContext, ProductSummary, RenderContext } from "../core/types";
import { codeCollectionKey, codeProductsKey, nodeCodeCatalogQueries } from "../elements/data";
import { renderElementTree } from "../elements/render";
import { collectPageCss } from "../elements/style";
import { PageStyles, SITE_ROOT_CLASS, SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { toMinorUnits } from "./liquid-objects";
import { clearCodeRenderCache, codeLocalePrefix, codePageCss, codeRenderCacheSize, localizeCodePath, renderCodeNode } from "./render-code.server";

const SCHEMA = {
  name: "Promo",
  settings: [
    { id: "title", type: "text", label: "Title" },
    { id: "body", type: "richtext", label: "Body" },
    { id: "pick", type: "product", label: "Product" },
    { id: "picks", type: "product_list", label: "Products" },
    { id: "shelf", type: "collection", label: "Collection" },
  ],
  blocks: [{ type: "row", name: "Row", settings: [{ id: "label", type: "text", label: "Label" }] }],
};

const codeNode = (source: string, over: Record<string, unknown> = {}, id = "code1"): ComponentNode =>
  ({
    id,
    type: "code",
    props: {
      apiVersion: 1,
      source,
      schema: SCHEMA,
      settings: { title: { ar: "عرض", en: "Offer" }, body: { ar: "<p>نص</p>", en: "<p>Text</p>" } },
      blocks: [
        { id: "b1", type: "row", settings: { label: { ar: "أول", en: "First" } } },
        { id: "b2", type: "row", settings: { label: { ar: "ثاني", en: "Second" } } },
      ],
      ...over,
    },
    children: [],
  }) as ComponentNode;

const CODE_ON: CodeSectionsContext = { enabled: true, storeId: "store-a", pageType: "page", passThrough: false, currency: "EGP" };

const product = (id: string, price: number, extra: Partial<ProductSummary> = {}): ProductSummary => ({
  id,
  title: `Product ${id}`,
  href: `/products/slug-${id}`,
  image: `https://cdn.test/${id}.jpg`,
  price,
  inStock: true,
  ...extra,
});

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
  codeSections: CODE_ON,
  renderCodeNode,
  ...over,
});

const draw = (node: ComponentNode, c: RenderContext) => renderToStaticMarkup(<>{renderElementTree([node], c)}</>);

const section = (tree: ComponentNode[], extra: Partial<SectionInstance> = {}): SectionInstance =>
  ({ id: "s1", sectionId: "custom-section", version: 1, props: {}, componentTree: [{ id: "root", type: "section", props: {}, children: tree }], ...extra }) as SectionInstance;

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  clearCodeRenderCache();
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe("code node render", () => {
  const source = `<h2>{{ section.settings.title }}</h2>{{ section.settings.body }}<ul>{% for block in section.blocks %}<li {{ block.attributes }}>{{ block.settings.label }}</li>{% endfor %}</ul>`;

  it("draws settings and blocks in English and Arabic, in one wrapper", () => {
    expect(draw(codeNode(source), ctx())).toBe(
      `<div data-node-id="code1" class="code-node"><h2>Offer</h2><p>Text</p><ul><li data-block-id="b1">First</li><li data-block-id="b2">Second</li></ul></div>`,
    );
    expect(draw(codeNode(source), ctx({ locale: "ar", dir: "rtl" }))).toContain("<h2>عرض</h2><p>نص</p><ul><li data-block-id=\"b1\">أول</li>");
  });

  it("falls back to the other language when the request's is empty", () => {
    const node = codeNode(`{{ section.settings.title }}`, { settings: { title: { ar: "", en: "Only English" } } });
    expect(draw(node, ctx({ locale: "ar", dir: "rtl" }))).toContain("Only English");
  });

  it("escapes text settings and removes a script Liquid builds", () => {
    const node = codeNode(`<p>{{ section.settings.title }}</p><scr{% if true %}ipt{% endif %}>alert(1)</script><p>after</p>`, {
      settings: { title: { ar: "<b>x</b>", en: "<img src=x onerror=alert(1)>" } },
    });
    const html = draw(node, ctx());
    expect(html).not.toMatch(/<script|<img/i);
    expect(html).not.toContain("</script>");
    expect(html).toContain("&lt;img");
    expect(html).toContain("<p>after</p>");
  });

  it("resolves a product setting from the page catalog, in minor units", () => {
    const node = codeNode(`{{ section.settings.pick.title }}|{{ section.settings.pick.price }}|{{ section.settings.pick.handle }}|{{ section.settings.picks.size }}`, {
      settings: { pick: "p1", picks: ["p1", "p2"] },
    });
    const c = ctx({ catalog: { products: { [codeProductsKey("code1")]: [product("p1", 249.5), product("p2", 1.1)] }, categories: [] } });
    expect(draw(node, c)).toContain("Product p1|24950|slug-p1|2");
    expect(toMinorUnits(1.1)).toBe(110);
    expect(toMinorUnits(19.99)).toBe(1999);
    expect(toMinorUnits(-2.5)).toBe(-250);
  });

  it("renders nothing for a product id the store did not return", () => {
    const node = codeNode(`[{{ section.settings.pick.title }}]{% if section.settings.pick == blank %}none{% endif %}[{{ section.settings.picks.size }}]`, {
      settings: { pick: "foreign", picks: ["foreign", "p1"] },
    });
    const c = ctx({ catalog: { products: { [codeProductsKey("code1")]: [product("p1", 10)] }, categories: [] } });
    expect(draw(node, c)).toContain("[]none[1]");
  });

  it("resolves a collection only when it is one of the store's categories", () => {
    const node = codeNode(`{{ section.settings.shelf.title }}:{% for p in section.settings.shelf.products %}{{ p.id }},{% endfor %}`, { settings: { shelf: "c1" } });
    const products = { [codeCollectionKey("code1", "c1")]: [product("p3", 5)] };
    const mine = ctx({ catalog: { products, categories: [{ id: "c1", key: "c1", name: "Mugs", href: "/products?category=c1", image: null }] } });
    expect(draw(node, mine)).toContain("Mugs:p3,");
    expect(draw(node, ctx({ catalog: { products, categories: [] } }))).toBe(`<div data-node-id="code1" class="code-node">:</div>`);
  });

  it("gets the list card's product inside a product list", () => {
    const list = { id: "list", type: "productList", props: { source: "newest", limit: 2 }, children: [codeNode(`<i>{{ product.title }}={{ product.price }}</i>`)] } as ComponentNode;
    const html = draw(list, ctx({ catalog: { products: { list: [product("p1", 3), product("p2", 4)] }, categories: [] } }));
    expect(html).toContain("<i>Product p1=300</i>");
    expect(html).toContain("<i>Product p2=400</i>");
  });

  it("draws nothing and logs one line without the template on a render error", () => {
    const html = draw(codeNode(`{% if %}secret-template{% endif %}`), ctx());
    expect(html).toBe("");
    expect(warn).toHaveBeenCalledTimes(1);
    const line = String(warn.mock.calls[0]?.[0]);
    expect(line).toBe("[code-section] render failed store=store-a node=code1 kind=parse");
    expect(line).not.toContain("secret-template");
  });

  it("draws nothing when the switch is off, on a pass-through route or another page type", () => {
    const node = codeNode(source);
    expect(draw(node, ctx({ codeSections: { ...CODE_ON, enabled: false } }))).toBe("");
    expect(draw(node, ctx({ codeSections: { ...CODE_ON, passThrough: true } }))).toBe("");
    expect(draw(node, ctx({ codeSections: { ...CODE_ON, pageType: "catalog" } }))).toBe("");
    expect(draw(node, ctx({ codeSections: { ...CODE_ON, pageType: "product" } }))).toContain("<h2>Offer</h2>");
    expect(draw(node, ctx({ codeSections: undefined }))).toBe("");
    // Wrong API version or no source: nothing.
    expect(draw(codeNode(source, { apiVersion: 2 }), ctx())).toBe("");
    expect(draw(codeNode("", {}), ctx())).toBe("");
  });

  it("shows a still box in the editor canvas and nothing on a public page without the server renderer", () => {
    const edit = draw(codeNode(source), ctx({ mode: "edit", renderCodeNode: undefined }));
    expect(edit).toContain("Code section, preview coming soon");
    expect(edit).not.toContain("Offer");
    expect(draw(codeNode(source), ctx({ renderCodeNode: undefined }))).toBe("");
  });

  it("caches per store and never in a preview", () => {
    const node = codeNode(source);
    draw(node, ctx());
    draw(node, ctx());
    expect(codeRenderCacheSize()).toBe(1);
    draw(node, ctx({ codeSections: { ...CODE_ON, storeId: "store-b" } }));
    expect(codeRenderCacheSize()).toBe(2);
    clearCodeRenderCache();
    draw(node, ctx({ codeSections: { ...CODE_ON, preview: true } }));
    expect(codeRenderCacheSize()).toBe(0);
  });
});

describe("code node data", () => {
  it("adds its picks to the page's up-front queries only when asked", () => {
    const node = codeNode("x", { settings: { pick: "p1", picks: ["p2", "p1", "bad id!"], shelf: "c1" } });
    expect(nodeCodeCatalogQueries(node)).toEqual({
      [codeProductsKey("code1")]: { kind: "products", source: "selected", productIds: ["p1", "p2"], sort: "default", limit: 2 },
      [codeCollectionKey("code1", "c1")]: { kind: "products", source: "category", categoryId: "c1", sort: "default", limit: 24 },
      "code1~categories": { kind: "categories", limit: 200 },
    });
    const sections = [section([node])];
    expect(collectCatalogQueries(sections, storeSectionRegistry)).toEqual({});
    expect(Object.keys(collectCatalogQueries(sections, storeSectionRegistry, { codeSections: true }))).toHaveLength(3);
  });
});

describe("code node URLs follow the page language", () => {
  const LINKS =
    "{{ routes.root_url }}|{{ routes.collections_url }}|{{ routes.cart_url }}|{{ routes.search_url }}|{{ section.settings.pick.url }}|{{ section.settings.shelf.url }}|{{ section.settings.link }}|{{ section.settings.away }}";
  const schema = {
    ...SCHEMA,
    settings: [...SCHEMA.settings, { id: "link", type: "url", label: "Link" }, { id: "away", type: "url", label: "Away" }],
  };
  const node = codeNode(`<p>${LINKS}</p>`, { schema, settings: { pick: "p1", shelf: "c1", link: "/pages/about", away: "https://x.example/a" } });
  const catalog = {
    products: { [codeProductsKey("code1")]: [product("p1", 10)], [codeCollectionKey("code1", "c1")]: [] },
    categories: [{ id: "c1", key: "shoes", name: "Shoes", href: "/products?category=shoes", image: null }],
  } as unknown as RenderContext["catalog"];
  const linksOf = (locale: "ar" | "en", defaultLocale?: "ar" | "en") =>
    /<p>([^<]*)<\/p>/.exec(draw(node, ctx({ locale, dir: locale === "ar" ? "rtl" : "ltr", catalog, codeSections: { ...CODE_ON, defaultLocale } })))?.[1]?.split("|");

  it("prefixes /en on the English page of an Arabic-default store", () => {
    expect(linksOf("en", "ar")).toEqual([
      "/en", "/en/products", "/en/cart", "/en/products", "/en/products/slug-p1", "/en/products?category=shoes", "/en/pages/about", "https://x.example/a",
    ]);
    // No defaultLocale is an Arabic-default store, as the storefront's routing.
    expect(linksOf("en")).toEqual(linksOf("en", "ar"));
  });

  it("keeps the default language unprefixed", () => {
    expect(linksOf("ar", "ar")).toEqual(["/", "/products", "/cart", "/products", "/products/slug-p1", "/products?category=shoes", "/pages/about", "https://x.example/a"]);
    expect(linksOf("en", "en")).toEqual(linksOf("ar", "ar"));
  });

  it("prefixes /ar on the Arabic page of an English-default store", () => {
    expect(linksOf("ar", "en")?.slice(0, 4)).toEqual(["/ar", "/ar/products", "/ar/cart", "/ar/products"]);
  });

  it("leaves links that already name a language, or point elsewhere, alone", () => {
    expect(localizeCodePath("/en/products", "/en")).toBe("/en/products");
    expect(localizeCodePath("/ar", "/en")).toBe("/ar");
    expect(localizeCodePath("//evil.example/x", "/en")).toBe("//evil.example/x");
    expect(localizeCodePath("#top", "/en")).toBe("#top");
    expect(localizeCodePath("mailto:a@b.c", "/en")).toBe("mailto:a@b.c");
    expect(localizeCodePath("/arabic", "/en")).toBe("/en/arabic");
    expect(codeLocalePrefix("en", null)).toBe("/en");
    expect(codeLocalePrefix("ar", "en")).toBe("/ar");
  });
});

describe("code CSS", () => {
  const styled = section(
    [
      { id: "box", type: "div", props: {}, children: [], customCss: ".x{color:red}" } as ComponentNode,
      codeNode("<p>hi</p>", { css: "p{color:blue}@keyframes spin{to{opacity:0}}.p{animation:spin 1s}" }),
      { id: "bad id", type: "div", props: {}, children: [], customCss: "a{color:green}" } as ComponentNode,
    ],
    { customCss: "h2{margin:0}" },
  );

  it("scopes section, element and code node CSS into the page style block", () => {
    const css = codePageCss([styled], CODE_ON);
    expect(css).toContain(`.${SITE_ROOT_CLASS} [data-section-id="s1"] h2`);
    expect(css).toContain(`.${SITE_ROOT_CLASS} [data-node-id="box"] .x`);
    expect(css).toContain(`.${SITE_ROOT_CLASS} [data-node-id="code1"] p`);
    expect(css).toContain("ccode1-spin");
    expect(css).not.toContain("green");
    const html = renderToStaticMarkup(<PageStyles sections={[styled]} extraCss={css} />);
    expect(html).toContain(`.${SITE_ROOT_CLASS} [data-node-id="box"] .x`);
  });

  it("adds no CSS when code sections are off or on a pass-through route", () => {
    expect(codePageCss([styled], { ...CODE_ON, enabled: false })).toBe("");
    expect(codePageCss([styled], { ...CODE_ON, passThrough: true })).toBe("");
    expect(codePageCss([styled], undefined)).toBe("");
    // Custom CSS still applies on a page type that draws no code, but the code node's own CSS doesn't.
    const catalog = codePageCss([styled], { ...CODE_ON, pageType: "catalog" });
    expect(catalog).toContain(`[data-node-id="box"]`);
    expect(catalog).not.toContain(`[data-node-id="code1"]`);
  });

  it("leaves a page with no code and no custom CSS unchanged", () => {
    const plain = section([{ id: "t", type: "text", props: { text: "Hello" }, style: { color: "brand" }, children: [] } as ComponentNode]);
    expect(codePageCss([plain], CODE_ON)).toBe("");
    const before = renderToStaticMarkup(<PageStyles sections={[plain]} />);
    expect(renderToStaticMarkup(<PageStyles sections={[plain]} extraCss={codePageCss([plain], CODE_ON)} />)).toBe(before);
    expect(before).toContain(collectPageCss([plain]).slice(0, 20));
    const base = ctx({ codeSections: undefined, renderCodeNode: undefined });
    const page = (c: RenderContext) => renderToStaticMarkup(<SectionRenderer instance={plain} registry={storeSectionRegistry} ctx={c} />);
    expect(page(ctx())).toBe(page(base));
  });
});
