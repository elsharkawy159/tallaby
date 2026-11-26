import { describe, expect, it } from "vitest";
import { normalizeCodeNodeProps } from "../code/code-node";
import { readCodeProps } from "../code/code-props";
import { toLiquidBlock, toLiquidProduct } from "../code/liquid-objects";
import { ALLOWED_TAGS, checkLiquidSource, DROPPED_TAG_NAMES, LIQUID_MAX_LIST_ITEMS, REMOVED_FILTER_NAMES } from "../code/liquid.server";
import { CODE_FILTER_NAMES } from "../code/liquid-filters";
import { buildCodeScope } from "../code/render-code.server";
import { sanitizeCodeHtml } from "../code/sanitize-code";
import { SETTING_TYPES } from "../code/section-schema";
import { STYLE_KEYS } from "../elements/style";
import type { SectionInstance } from "../config/schema";
import {
  buildEditorAgentSystemPrompt,
  buildEditorAgentTurnText,
  historyText,
  LIQUID_OBJECT_FIELDS,
  MAX_AGENT_HISTORY_BYTES,
  REMOVED_HTML_TAGS_FOR_PROMPT,
  SAFE_HTML_TAGS_FOR_PROMPT,
  STANDARD_FILTERS_FOR_PROMPT,
  storefrontCssVars,
} from "./prompt.lib";

const OTHER_PLATFORMS = /shopify|wix|woocommerce|salla|zid\b|youcan|expandcart|squarespace|bigcommerce|magento|wordpress/i;

const sorted = (values: Iterable<string>) => [...values].sort();

describe("editor agent system prompt", () => {
  const withCode = buildEditorAgentSystemPrompt({ allowCode: true });
  const plain = buildEditorAgentSystemPrompt({ allowCode: false });

  it("never names another platform", () => {
    expect(withCode).not.toMatch(OTHER_PLATFORMS);
    expect(plain).not.toMatch(OTHER_PLATFORMS);
  });

  it("is a constant per variant (cache-friendly prefix)", () => {
    expect(buildEditorAgentSystemPrompt({ allowCode: true })).toBe(withCode);
    expect(withCode).not.toBe(plain);
  });

  it("offers code ops only when code sections are on", () => {
    expect(withCode).toContain("add_code_section");
    expect(withCode).toContain("{% schema %}");
    expect(plain).not.toContain("add_code_section");
    expect(plain).not.toContain("{% schema %}");
  });

  it("lists the code's own tags, filters, setting types and style keys", () => {
    for (const tag of ALLOWED_TAGS.filter((t) => t !== "#")) expect(withCode).toContain(tag);
    for (const tag of DROPPED_TAG_NAMES) expect(withCode).toContain(tag);
    for (const filter of CODE_FILTER_NAMES) expect(withCode).toContain(filter);
    for (const type of SETTING_TYPES) expect(withCode).toContain(type);
    for (const key of STYLE_KEYS) expect(plain).toContain(key);
  });

  it("states the render limits and never teaches a removed filter", () => {
    expect(withCode).toContain(`at most ${LIQUID_MAX_LIST_ITEMS} items`);
    expect(withCode).toContain("128 KB, 4000 tags and 128 levels");
    for (const filter of REMOVED_FILTER_NAMES) expect(withCode).not.toContain(filter);
  });

  it("teaches RTL-safe, mobile-first CSS with the store's variables", () => {
    expect(withCode).toContain("margin-inline-start");
    expect(withCode).toContain("min-width: 768px");
    for (const name of ["--sf-brand", "--sf-ink", "--sf-paper", "--sf-font-heading", "--sf-radius"]) expect(withCode).toContain(`var(${name})`);
  });
});

describe("generated reference lists match the renderer", () => {
  it("every standard filter it teaches exists in the restricted engine", () => {
    for (const filter of STANDARD_FILTERS_FOR_PROMPT) {
      expect(checkLiquidSource(`{{ "a" | ${filter} }}`), filter).toEqual([]);
    }
  });

  it("the HTML it allows survives the cleaner and the HTML it forbids is removed", () => {
    for (const tag of SAFE_HTML_TAGS_FOR_PROMPT) {
      const html = sanitizeCodeHtml(`<${tag}>x</${tag}>`, { nodeId: "n1" });
      expect(html.toLowerCase(), tag).toContain(`<${tag}`);
    }
    for (const tag of REMOVED_HTML_TAGS_FOR_PROMPT) {
      const html = sanitizeCodeHtml(`<${tag}>secret</${tag}>`, { nodeId: "n1" });
      expect(html.toLowerCase(), tag).not.toContain(`<${tag}`);
      if (!["input", "link", "meta", "embed"].includes(tag)) expect(html, tag).not.toContain("secret");
    }
  });

  it("the CSS variables exist on a site", () => {
    const vars = storefrontCssVars();
    expect(vars).toEqual(expect.arrayContaining(["--sf-brand", "--sf-ink", "--sf-muted", "--sf-paper", "--sf-shelf", "--sf-line", "--sf-sun", "--sf-surface", "--sf-font-body", "--sf-radius", "--sf-max-width", "--sf-section-y"]));
  });

  it("the object fields are the ones a code section's Liquid really gets", () => {
    const { props } = normalizeCodeNodeProps({
      source: "<p>x</p>",
      schema: { name: "X", settings: [{ type: "collection", id: "c", label: "C" }] },
      settings: { c: "cat-1" },
    });
    const code = readCodeProps(props)!;
    const ctx = {
      locale: "ar" as const,
      dir: "rtl" as const,
      imageUrl: (src: string) => src,
      store: { name: "Store", url: "https://s.example", logoUrl: null },
      catalog: { products: {}, categories: [{ id: "cat-1", key: "cat-1", name: "Cat", href: "/c", image: null }] },
    };
    const cs = { pageType: "page", currency: "EGP", designSystem: null, defaultLocale: "ar" } as unknown as Parameters<typeof buildCodeScope>[3];
    const scope = buildCodeScope({ id: "n1" }, code, ctx as unknown as Parameters<typeof buildCodeScope>[2], cs, undefined);
    expect(sorted(Object.keys(scope.section))).toEqual(sorted(LIQUID_OBJECT_FIELDS.section));
    expect(sorted(Object.keys(scope.shop))).toEqual(sorted(LIQUID_OBJECT_FIELDS.shop));
    expect(sorted(Object.keys(scope.request))).toEqual(sorted(LIQUID_OBJECT_FIELDS.request));
    expect(sorted(Object.keys(scope.routes))).toEqual(sorted(LIQUID_OBJECT_FIELDS.routes));
    expect(sorted(Object.keys(scope.settings))).toEqual(sorted(LIQUID_OBJECT_FIELDS.settings));
    expect(sorted(Object.keys(scope.localization))).toEqual(sorted(LIQUID_OBJECT_FIELDS.localization));
    expect(sorted(Object.keys(scope.section.settings.c as object))).toEqual(sorted(LIQUID_OBJECT_FIELDS.collection));
    expect(sorted(Object.keys(toLiquidBlock({ id: "b", type: "t", settings: {} })))).toEqual(sorted(LIQUID_OBJECT_FIELDS.block));
    const product = toLiquidProduct({ id: "p", title: "P", slug: "p", url: "/p", price: 10, available: true, images: [{ url: "https://x/a.webp" }], variants: [{ id: "v", title: "V", price: 10, available: true }] });
    expect(sorted(Object.keys(product))).toEqual(sorted(LIQUID_OBJECT_FIELDS.product));
    expect(sorted(Object.keys(product.variants[0]!))).toEqual(sorted(LIQUID_OBJECT_FIELDS["product.variants[]"]));
    expect(sorted(Object.keys(product.featured_image!))).toEqual(sorted(LIQUID_OBJECT_FIELDS.image));
  });
});

describe("turn text", () => {
  const section: SectionInstance = {
    id: "s-1",
    sectionId: "custom-section",
    version: 1,
    props: {},
    componentTree: [{ id: "n-root", type: "section", props: {}, children: [{ id: "n-h", type: "heading", props: { text: "أهلا", translations: { en: { text: "Hi" } } }, children: [], style: { fontSize: "3xl" } }] }],
  };

  it("holds the store, outline, section, history and request, capped", () => {
    const text = buildEditorAgentTurnText({
      message: "x".repeat(5000),
      uiLocale: "ar",
      contentLocale: "ar",
      target: { kind: "page", sectionId: "s-1" },
      section,
      outline: [{ id: "s-1", name: "Hero", kind: "tree" }],
      history: [{ role: "user", text: "hello" }],
      store: { name: "متجري", defaultLocale: "ar", locales: ["ar", "en"], colors: { primary: "#145163" }, typography: { headingFont: "Cairo" } },
    });
    expect(text).toContain("متجري");
    expect(text).toContain("s-1 | \"Hero\"");
    expect(text).toContain("n-h heading");
    expect(text).toContain('text: ar="أهلا" en="Hi"');
    expect(text).toContain("fontSize=3xl");
    expect(text).toContain("Seller: \"hello\"");
    expect(text).not.toContain("x".repeat(1501));
  });

  it("keeps the newest history within its byte cap", () => {
    const history = Array.from({ length: 10 }, (_, i) => ({ role: "user" as const, text: `${i} ${"y".repeat(900)}` }));
    const text = historyText(history);
    expect(new TextEncoder().encode(text).length).toBeLessThanOrEqual(MAX_AGENT_HISTORY_BYTES);
    expect(text).toContain('"9 ');
    expect(text).not.toContain('"3 ');
  });
});
