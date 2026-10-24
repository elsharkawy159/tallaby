import { describe, expect, it } from "vitest";
import { findNode, findParent } from "../elements/tree";
import { chromeHasThemeToggle, chromeOptionOn, drawChrome, flushHeaderOnMobile, setChromeOption, withLanguageSwitcher } from "./header";
import { sanitizeSiteConfig } from "./sanitize";
import type { SectionInstance, SiteConfig } from "./schema";
import { CODE_TEMPLATES } from "../templates/catalog";

const header = (mobile?: Record<string, unknown>): SectionInstance => ({
  id: "hdr",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [
    {
      id: "root",
      type: "section",
      props: {},
      style: { paddingTop: 16, paddingBottom: 16 },
      ...(mobile && { breakpointStyles: { mobile, tablet: { paddingTop: 12 } } }),
      children: [],
    },
  ],
});

describe("flushHeaderOnMobile", () => {
  it("zeroes the root section's mobile padding-y (a pre-0084 header's 40px)", () => {
    const out = flushHeaderOnMobile(header({ paddingTop: 40, paddingBottom: 40, gap: 8 }));
    const root = out.componentTree![0]!;
    expect(root.breakpointStyles).toEqual({ mobile: { paddingTop: 0, paddingBottom: 0, gap: 8 }, tablet: { paddingTop: 12 } });
    expect(root.style).toEqual({ paddingTop: 16, paddingBottom: 16 });
  });

  it("adds a mobile style when the header has none, and never mutates its input", () => {
    const input = header();
    const out = flushHeaderOnMobile(input);
    expect(out.componentTree![0]!.breakpointStyles).toEqual({ mobile: { paddingTop: 0, paddingBottom: 0 } });
    expect(input.componentTree![0]!.breakpointStyles).toBeUndefined();
  });

  it("returns a flush header as it is", () => {
    const input = header({ paddingTop: 0, paddingBottom: 0 });
    expect(flushHeaderOnMobile(input)).toBe(input);
    expect(flushHeaderOnMobile(null)).toBeNull();
  });

  it("runs on save (sanitizeSiteConfig)", () => {
    const config = { ...CODE_TEMPLATES[0]!.config(), header: header({ paddingTop: 40, paddingBottom: 40 }) } as SiteConfig;
    expect(sanitizeSiteConfig(config).header!.componentTree![0]!.breakpointStyles?.mobile).toEqual({ paddingTop: 0, paddingBottom: 0 });
  });

  it.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s: the header is already flush on mobile", (_key, template) => {
    const h = template.config().header!;
    expect(flushHeaderOnMobile(h)).toBe(h);
  });
});

describe("withLanguageSwitcher", () => {
  const node = (id: string, props: Record<string, unknown> = {}, children: SectionInstance["componentTree"] = []) => ({
    id,
    type: "linkBlock" as const,
    props,
    children: children!,
  });
  const bar = (...children: NonNullable<SectionInstance["componentTree"]>): SectionInstance => ({
    ...header(),
    componentTree: [{ id: "root", type: "section", props: {}, children: [{ id: "bar", type: "hFlex", props: {}, children }] }],
  });
  const placeOf = (h: SectionInstance) => {
    const tree = h.componentTree!;
    expect(findNode(tree, "hdr-language")?.type).toBe("languageSwitcher");
    return findParent(tree, "hdr-language");
  };

  it("goes before the cart link", () => {
    const out = withLanguageSwitcher(bar(node("logo", { role: "logo" }), node("actions", {}, [node("search"), node("cart", { href: "/cart" })])), true);
    expect(placeOf(out)).toEqual({ parentId: "actions", index: 1 });
  });

  it("goes after the menu, else after the logo, else at the end of the header", () => {
    expect(placeOf(withLanguageSwitcher(bar(node("menu", { role: "menu" }), node("x")), true))).toEqual({ parentId: "bar", index: 1 });
    expect(placeOf(withLanguageSwitcher(bar(node("logo", { role: "logo" }), node("x")), true))).toEqual({ parentId: "bar", index: 1 });
    expect(placeOf(withLanguageSwitcher(bar(node("x")), true))).toEqual({ parentId: "root", index: 1 });
  });

  it("is left out for one-language stores, when the seller hid it, and when the header has one", () => {
    const input = bar(node("cart", { href: "/cart" }));
    expect(withLanguageSwitcher(input, false)).toBe(input);
    const hidden = { ...input, props: { languageSwitcher: false } };
    expect(withLanguageSwitcher(hidden, true)).toBe(hidden);
    const once = withLanguageSwitcher(input, true);
    expect(withLanguageSwitcher(once, true)).toBe(once);
    expect(withLanguageSwitcher(null, true)).toBeNull();
    expect(findNode(input.componentTree!, "hdr-language")).toBeNull();
  });

  it.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s: the header gets one, beside the cart", (_key, template) => {
    const h = template.config().header!;
    const out = withLanguageSwitcher(h, true);
    const place = findParent(out.componentTree!, `${h.id}-language`)!;
    const parent = findNode(out.componentTree!, place.parentId!)!;
    expect(parent.children[place.index + 1]?.props.href).toBe("/cart");
  });
});

describe("header and footer options (drawChrome)", () => {
  type Tree = NonNullable<SectionInstance["componentTree"]>;
  const n = (id: string, type: string, props: Record<string, unknown> = {}, children: Tree = []): Tree[number] =>
    ({ id, type, props, children }) as Tree[number];
  const chrome = (children: Tree, props: Record<string, unknown> = {}): SectionInstance => ({
    id: "c",
    sectionId: "custom-section",
    version: 1,
    props,
    componentTree: [n("root", "section", {}, children)],
  });
  const classicLogo = () =>
    n("logo", "linkBlock", { role: "logo", href: "/" }, [
      n("row", "hFlex", {}, [n("mark", "div", {}, [n("initial", "text", { role: "storeInitial" })]), n("name", "text", { role: "storeName" })]),
    ]);
  const typesIn = (h: SectionInstance | null | undefined) => {
    const out: string[] = [];
    const walk = (list: Tree) => list.forEach((node) => (out.push(node.type), walk(node.children)));
    walk(h?.componentTree ?? []);
    return out;
  };
  const off = { translated: false, hasLogo: false };

  it("puts the uploaded logo in place of the header's mark, beside the store name", () => {
    const out = drawChrome(chrome([classicLogo()]), "header", { translated: false, hasLogo: true })!;
    const row = findNode(out.componentTree!, "row")!;
    expect(row.children.map((c) => c.type)).toEqual(["storeLogo", "text"]);
    expect(findNode(out.componentTree!, "mark")).toBeNull();
  });

  it("can hide the store name next to the logo, and leaves everything as authored without a logo", () => {
    const input = chrome([classicLogo()], { storeName: false });
    const row = findNode(drawChrome(input, "header", { translated: false, hasLogo: true })!.componentTree!, "row")!;
    expect(row.children.map((c) => c.type)).toEqual(["storeLogo"]);
    expect(drawChrome(input, "header", off)).toBe(input);
    const hidden = chrome([classicLogo()], { logo: false });
    expect(drawChrome(hidden, "header", { translated: false, hasLogo: true })).toBe(hidden);
  });

  it("keeps the logo's place for the editor's uploader without a logo, and never hides the store name for it", () => {
    const input = chrome([classicLogo()], { storeName: false });
    const placeholder = { translated: false, hasLogo: false, logoPlaceholder: true };
    const row = findNode(drawChrome(input, "header", placeholder)!.componentTree!, "row")!;
    expect(row.children.map((c) => c.type)).toEqual(["storeLogo", "text"]);
    const hidden = chrome([classicLogo()], { logo: false });
    expect(drawChrome(hidden, "header", placeholder)).toBe(hidden);
  });

  it("goes before a footer's store name heading when there is no logo link", () => {
    const out = drawChrome(chrome([n("col", "vFlex", {}, [n("name", "heading", { role: "storeName" })])]), "footer", { translated: false, hasLogo: true })!;
    expect(findNode(out.componentTree!, "col")!.children.map((c) => c.type)).toEqual(["storeLogo", "heading"]);
  });

  it("adds the theme toggle and sign-in before the header's cart, in order", () => {
    const input = chrome([n("actions", "hFlex", {}, [n("cart", "linkBlock", { href: "/cart" })])], { themeToggle: true, account: true });
    const out = drawChrome(input, "header", { translated: true, hasLogo: false })!;
    expect(findNode(out.componentTree!, "actions")!.children.map((c) => c.type)).toEqual(["languageSwitcher", "themeToggle", "accountLink", "linkBlock"]);
  });

  it("puts the footer's tools in one row after its social links", () => {
    const input = chrome([n("box", "container", {}, [n("social", "hFlex", { role: "social" }), n("copy", "text")])], { themeToggle: true });
    const out = drawChrome(input, "footer", { translated: true, hasLogo: false })!;
    const box = findNode(out.componentTree!, "box")!;
    expect(box.children.map((c) => c.id)).toEqual(["social", "c-tools", "copy"]);
    // The footer's language switcher is off by default.
    expect(box.children[1]!.children.map((c) => c.type)).toEqual(["themeToggle"]);
  });

  it("stores only changes from the defaults", () => {
    const h = chrome([]);
    expect(setChromeOption(h, "header", "languageSwitcher", true).props).toEqual({});
    expect(setChromeOption(h, "header", "themeToggle", true).props).toEqual({ themeToggle: true });
    expect(chromeOptionOn(setChromeOption(h, "footer", "languageSwitcher", true), "footer", "languageSwitcher")).toBe(true);
    expect(chromeHasThemeToggle(h, chrome([], { themeToggle: true }))).toBe(true);
    expect(chromeHasThemeToggle(h, null)).toBe(false);
  });

  it.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s: the logo and every tool find a place", (_key, template) => {
    const config = template.config();
    const all = { translated: true, hasLogo: true };
    const header = drawChrome({ ...config.header!, props: { themeToggle: true, account: true } }, "header", all);
    expect(typesIn(header)).toEqual(expect.arrayContaining(["storeLogo", "languageSwitcher", "themeToggle", "accountLink"]));
    const footer = drawChrome({ ...config.footer!, props: { themeToggle: true } }, "footer", all);
    expect(typesIn(footer)).toEqual(expect.arrayContaining(["themeToggle"]));
  });
});
