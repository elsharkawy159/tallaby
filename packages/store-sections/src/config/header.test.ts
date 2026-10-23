import { describe, expect, it } from "vitest";
import { findNode, findParent } from "../elements/tree";
import { flushHeaderOnMobile, withLanguageSwitcher } from "./header";
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
