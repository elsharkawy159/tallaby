import { describe, expect, it } from "vitest";
import type { ProductSummary } from "../core/types";
import { codeProductsKey } from "../elements/data";
import { codePreviewQueries, prepareCodePreview, renderCodePreview, type CodePreviewEnv } from "./preview-code.server";
import { joinSectionFile } from "./section-file";

const SCHEMA = {
  name: "Promo",
  settings: [
    { id: "title", type: "text", label: "Title" },
    { id: "pick", type: "product", label: "Product" },
    { id: "shelf", type: "collection", label: "Collection" },
  ],
};

const file = (source: string, css = "") => joinSectionFile({ source, css, schema: SCHEMA });

const product = (id: string, price: number): ProductSummary => ({ id, title: `Product ${id}`, href: `/products/slug-${id}`, image: null, price, inStock: true });

const env = (over: Partial<CodePreviewEnv> = {}): CodePreviewEnv => ({
  locale: "en",
  pageType: "page",
  storeId: "store-a",
  store: { name: "Store", url: "https://x.tallaby.com" },
  currency: "EGP",
  catalog: { products: {}, categories: [] },
  imageUrl: (path) => path,
  ...over,
});

const preview = (source: string, settings: unknown = {}, over: Partial<CodePreviewEnv> = {}, css = "") =>
  renderCodePreview({ nodeId: "code1", file: file(source, css), settings, blocks: [], ...env(over) });

describe("renderCodePreview", () => {
  const title = { ar: "عرض", en: "Offer" };

  it("renders the settings in English and Arabic, and returns the normalised props", () => {
    const en = preview(`<h2>{{ section.settings.title }}</h2>`, { title });
    expect(en.html).toBe("<h2>Offer</h2>");
    expect(en.issues).toEqual([]);
    expect(en.props).toMatchObject({ apiVersion: 1, source: "<h2>{{ section.settings.title }}</h2>", settings: { title } });
    expect(preview(`<h2>{{ section.settings.title }}</h2>`, { title }, { locale: "ar" }).html).toBe("<h2>عرض</h2>");
  });

  it("drops settings the schema does not define", () => {
    expect(preview(`{{ section.settings.secret }}`, { secret: "x" }).props.settings).not.toHaveProperty("secret");
  });

  it("sets request.design_mode", () => {
    expect(preview(`{% if request.design_mode %}editing{% else %}live{% endif %}`).html).toBe("editing");
  });

  it("resolves a product pick from the store's catalog, and a foreign id to nothing", () => {
    const catalog = { products: { [codeProductsKey("code1")]: [product("p1", 10)] }, categories: [] };
    expect(preview(`[{{ section.settings.pick.title }}]`, { pick: "p1" }, { catalog }).html).toBe("[Product p1]");
    expect(preview(`[{{ section.settings.pick.title }}]`, { pick: "other-store" }, { catalog }).html).toBe("[]");
  });

  it("asks for the picks' catalog rows only", () => {
    const prepared = prepareCodePreview({ nodeId: "code1", file: file(`x`), settings: { pick: "p1", shelf: "c1" }, blocks: [] });
    expect(Object.keys(codePreviewQueries(prepared)).sort()).toEqual(["code1~categories", "code1~c~c1", "code1~products"].sort());
    expect(codePreviewQueries(prepareCodePreview({ nodeId: "code1", file: file(`x`), settings: {}, blocks: [] }))).toEqual({});
  });

  it("removes a script that Liquid builds", () => {
    const { html } = preview(`<p>a</p><scr{% if true %}ipt{% endif %}>alert(1)</script><p>b</p>`);
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain("<p>b</p>");
  });

  it("positions a Liquid parse error in the joined file and draws nothing", () => {
    // The stylesheet sits before the broken tag, so the stored source's lines differ from the file's.
    const text = `<div>\n{% stylesheet %}\n.a { color: red; }\n{% endstylesheet %}\n<p>ok</p>\n{% if %}\n</div>\n{% schema %}\n${JSON.stringify(SCHEMA)}\n{% endschema %}\n`;
    const result = renderCodePreview({ nodeId: "code1", file: text, settings: {}, blocks: [], ...env() });
    expect(result.html).toBe("");
    const issue = result.issues.find((i) => i.code === "liquid_syntax");
    expect(issue).toMatchObject({ line: 6 });
    // Stored-source line 3; the file's line 6 is the broken tag.
    expect(text.split("\n")[(issue?.line ?? 0) - 1]).toBe("{% if %}");
    expect(issue?.column).toBeGreaterThanOrEqual(1);
  });

  it("positions a schema JSON error in the file", () => {
    const text = `<p>x</p>\n{% schema %}\n{ "name": , }\n{% endschema %}\n`;
    const result = renderCodePreview({ nodeId: "code1", file: text, settings: {}, blocks: [], ...env() });
    expect(result.issues.find((i) => i.code === "schema_json")).toMatchObject({ line: 3 });
  });

  it("positions a stylesheet error in the file", () => {
    const text = `<p>x</p>\n{% stylesheet %}\n  .a { color: red; }\n  .b { color: \n{% endstylesheet %}\n`;
    const result = renderCodePreview({ nodeId: "code1", file: text, settings: {}, blocks: [], ...env() });
    const issue = result.issues.find((i) => i.code === "css_invalid");
    expect(issue?.line).toBeGreaterThanOrEqual(3);
  });

  it("scopes the css to the node on the canvas root and prefixes keyframes", () => {
    const { css } = preview(`<p class="a">x</p>`, {}, {}, `.a { color: red; } @keyframes spin { to { opacity: 0 } } .b { animation: spin 1s; }`);
    expect(css).toContain(`.sf-site [data-node-id="code1"] .a`);
    expect(css).toContain("@keyframes ccode1-spin");
    expect(css).not.toMatch(/(^|\})\s*\.a\s*\{/);
  });

  it("draws the page product on the product page, and the demo product without one", () => {
    const html = preview(`{{ product.title }}`, {}, { pageType: "product" }).html;
    expect(html.length).toBeGreaterThan(0);
    expect(preview(`[{{ product.title }}]`).html).toBe("[]");
  });

  it("never throws on a bad node id or garbage input", () => {
    const bad = renderCodePreview({ nodeId: "a b", file: file(`x`), settings: null, blocks: "x", ...env() });
    expect(bad.html).toBe("");
    expect(bad.issues.some((i) => i.code === "invalid_node")).toBe(true);
    const garbage = renderCodePreview({ nodeId: "code1", file: 42 as unknown as string, settings: [1], blocks: {}, ...env() });
    expect(garbage.html).toBe("");
  });
});
