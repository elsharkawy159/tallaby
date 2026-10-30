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
    expect(flushHeaderOnMobile(h).componentTree![0]!.breakpointStyles).toBe(h.componentTree![0]!.breakpointStyles);
  });

  it("centres header rows that set no alignItems, and keeps a chosen one", () => {
    const row = (id: string, style?: Record<string, unknown>) => ({ id, type: "hFlex" as const, props: {}, children: [], ...(style && { style }) });
    const header: SectionInstance = {
      id: "h",
      sectionId: "custom-section",
      version: 1,
      props: {},
      componentTree: [
        {
          id: "root",
          type: "section",
          props: {},
          breakpointStyles: { mobile: { paddingTop: 0, paddingBottom: 0 } },
          children: [row("a"), row("b", { alignItems: "end" }), { id: "s", type: "vFlex", props: {}, children: [row("c")] }],
        },
      ],
    };
    const [a, b, s] = flushHeaderOnMobile(header).componentTree![0]!.children;
    expect(a!.style).toEqual({ alignItems: "center" });
    expect(b!.style).toEqual({ alignItems: "end" });
    expect(s!.style).toBeUndefined();
    expect(s!.children[0]!.style).toEqual({ alignItems: "center" });
    // Already centred: the same instance back.
    const centred = flushHeaderOnMobile(header);
    expect(flushHeaderOnMobile(centred)).toBe(centred);
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

  it("puts the uploaded logo in place of the header's mark and the store name", () => {
    const out = drawChrome(chrome([classicLogo()]), "header", { translated: false, hasLogo: true })!;
    const row = findNode(out.componentTree!, "row")!;
    expect(row.children.map((c) => c.type)).toEqual(["storeLogo"]);
    expect(findNode(out.componentTree!, "mark")).toBeNull();
  });

  it("can show the store name next to the logo too", () => {
    const input = chrome([classicLogo()], { storeName: true });
    const row = findNode(drawChrome(input, "header", { translated: false, hasLogo: true })!.componentTree!, "row")!;
    expect(row.children.map((c) => c.type)).toEqual(["storeLogo", "text"]);
  });

  it("shows only the store name, without the mark, when no logo is drawn", () => {
    for (const [input, opts] of [
      [chrome([classicLogo()]), off],
      [chrome([classicLogo()], { logo: false }), { translated: false, hasLogo: true }],
    ] as const) {
      const out = drawChrome(input, "header", opts)!;
      expect(findNode(out.componentTree!, "row")!.children.map((c) => c.id)).toEqual(["name"]);
      expect(findNode(input.componentTree!, "mark")).not.toBeNull();
    }
    // Nothing else changes: only the burger menu (always added) goes in.
    const plain = chrome([n("logo", "linkBlock", { role: "logo" }, [n("name", "text", { role: "storeName" })])]);
    const drawn = drawChrome(plain, "header", off)!;
    expect(drawn.componentTree![0]!.children.map((c) => c.type)).toEqual(["mobileMenu", "linkBlock"]);
    expect(findNode(drawn.componentTree!, "logo")).toEqual(plain.componentTree![0]!.children[0]);
  });

  describe("mobile burger menu (docs/section-rules.md §5.6)", () => {
    const link = (id: string, href: string, text: string) => n(id, "linkBlock", { href, label: "Menu link" }, [n(`${id}-t`, "text", { text })]);
    const bar = () =>
      chrome([
        n("bar", "hFlex", {}, [
          classicLogo(),
          n("menu", "hFlex", { role: "menu" }, [link("home", "/", "Home"), link("shop", "/products", "Shop")]),
          n("cart", "linkBlock", { href: "/cart" }, [n("bag", "icon", { name: "shopping-bag" })]),
        ]),
      ]);

    it("goes first in the header's bar, in a phone-only start cell, holding plain copies of the menu links", () => {
      const out = drawChrome(bar(), "header", off)!;
      const row = findNode(out.componentTree!, "bar")!;
      const start = row.children[0]!;
      expect(start.id).toBe("c-mobile-start");
      expect(start.style?.hidden).toBe(true);
      expect(start.breakpointStyles).toMatchObject({ tablet: { hidden: true }, mobile: { hidden: false } });
      expect(start.children[0]!.type).toBe("mobileMenu");
      const copies = start.children[0]!.children;
      expect(copies.map((c) => c.props.href)).toEqual(["/", "/products"]);
      expect(copies.every((c) => c.id.startsWith("c-mm-") && !c.style)).toBe(true);
    });

    it("marks the header's menus to hide on phones, without mutating the input", () => {
      const input = bar();
      const out = drawChrome(input, "header", off)!;
      expect(findNode(out.componentTree!, "menu")!.props.collapse).toBe("mobile");
      expect(findNode(input.componentTree!, "menu")!.props.collapse).toBeUndefined();
    });

    it("draws a row bar as start · logo · end on phones, the cart in the end cell", () => {
      const out = drawChrome(bar(), "header", off)!.componentTree!;
      const row = findNode(out, "bar")!;
      expect(row.props.split).toBe("mobile");
      expect(row.children.map((c) => c.id)).toEqual(["c-mobile-start", "logo", "c-mobile-end"]);
      const end = findNode(out, "c-mobile-end")!;
      expect(end.props.group).toBe("mobile");
      expect(end.children.map((c) => c.id)).toEqual(["menu", "cart"]);
    });

    it("adds a grid bar's start cell shown on phones only, so the desktop column count stays", () => {
      const input = chrome([n("grid", "grid", {}, [n("menu", "hFlex", { role: "menu" }, [link("home", "/", "Home")]), classicLogo(), n("end", "hFlex", {}, [n("cart", "linkBlock", { href: "/cart" }, [n("bag", "icon", { name: "shopping-bag" })])])])]);
      input.componentTree![0]!.children[0]!.style = { columns: 3 };
      const grid = findNode(drawChrome(input, "header", off)!.componentTree!, "grid")!;
      expect(grid.children.map((c) => c.id)).toEqual(["c-mobile-start", "menu", "c-logo-cell", "end"]);
      expect(grid.style?.columns).toBe(3);
      // The menu cell hides; start, logo (the middle two of four columns) and cart remain.
      expect(grid.children[1]!.breakpointStyles?.mobile?.hidden).toBe(true);
      expect(grid.breakpointStyles?.mobile?.columns).toBe(4);
      expect(grid.children[2]!.breakpointStyles?.mobile?.colSpan).toBe(2);
    });

    it("moves the search icon and the language switch beside the burger on phones, and groups the tools with a spread-out cart", () => {
      const input = chrome(
        [
          n("bar", "hFlex", {}, [
            classicLogo(),
            n("search", "linkBlock", { href: "/products" }, [n("s-i", "icon", { name: "search" })]),
            n("cart", "linkBlock", { href: "/cart" }, [n("bag", "icon", { name: "shopping-bag" })]),
          ]),
        ],
        { themeToggle: true },
      );
      input.componentTree![0]!.children[0]!.style = { justifyContent: "between" };
      const out = drawChrome(input, "header", { translated: true, hasLogo: false })!.componentTree!;
      // Desktop: one group, so the language switch sits by the cart, not a share of the free space away.
      expect(findNode(out, "c-tools")!.children.map((c) => c.id)).toEqual(["c-language", "c-theme", "cart"]);
      expect(findNode(out, "c-language")!.breakpointStyles?.mobile?.hidden).toBe(true);
      expect(findNode(out, "search")!.breakpointStyles?.mobile?.hidden).toBe(true);
      // Phones: burger, search, language, theme at the start.
      expect(findNode(out, "c-mobile-start")!.children.map((c) => c.id)).toEqual(["c-mobile-menu", "c-mobile-search", "c-language-mobile", "c-theme-mobile"]);
    });

    it("goes into the start cell of the outermost bar, not beside a logo in its own cell", () => {
      const input = chrome([
        n("grid", "grid", {}, [
          n("start", "hFlex", {}, [n("fake", "linkBlock", { href: "/products" }, [n("fake-i", "icon", { name: "menu" })])]),
          n("logo-cell", "hFlex", {}, [classicLogo()]),
          n("end", "hFlex", {}, [n("cart", "linkBlock", { href: "/cart" }, [n("bag", "icon", { name: "shopping-bag" })])]),
        ]),
      ]);
      const out = drawChrome(input, "header", off)!.componentTree!;
      const grid = findNode(out, "grid")!;
      expect(grid.children.map((c) => c.id)).toEqual(["c-mobile-start", "start", "logo-cell", "end"]);
      expect(grid.children[0]!.children.map((c) => c.type)).toEqual(["mobileMenu"]);
      expect(findNode(out, "logo-cell")!.children.map((c) => c.type)).toEqual(["linkBlock"]);
      // The design's own menu icon hides on phones (the burger replaces it), and its emptied cell with it.
      expect(findNode(out, "fake")!.breakpointStyles?.mobile?.hidden).toBe(true);
      expect(findNode(out, "start")!.breakpointStyles?.mobile?.hidden).toBe(true);
      expect(grid.breakpointStyles?.mobile?.columns).toBe(4);
    });

    it("keeps phones to one row: rows after the bar hide, a wide search becomes an icon, the bar is at most 10px padded", () => {
      const input = chrome([
        n("bar", "hFlex", {}, [
          classicLogo(),
          n("box", "vFlex", {}, [n("search", "linkBlock", { href: "/products", role: "search" }, [n("s-i", "icon", { name: "search" }), n("s-t", "text", { text: "Search…" })])]),
          n("cart", "linkBlock", { href: "/cart" }, [n("bag", "icon", { name: "shopping-bag" })]),
        ]),
        n("cats", "hFlex", {}, [link("new", "/products", "New in")]),
      ]);
      input.componentTree![0]!.children[0]!.style = { paddingTop: 16, paddingBottom: 16 };
      const out = drawChrome(input, "header", { ...off, locale: "en" })!.componentTree!;
      const bar = findNode(out, "bar")!;
      expect(bar.breakpointStyles?.mobile).toMatchObject({ paddingTop: 10, paddingBottom: 10 });
      expect(findNode(out, "box")!.breakpointStyles?.mobile?.hidden).toBe(true);
      expect(findNode(out, "cats")!.breakpointStyles?.mobile?.hidden).toBe(true);
      expect(bar.style).toEqual(input.componentTree![0]!.children[0]!.style);
      expect(findNode(out, "c-mobile-start")!.children.map((c) => c.id)).toEqual(["c-mobile-menu", "c-mobile-search"]);
      expect(findNode(out, "c-mobile-search")!.props.label).toBe("Search");
      // The hidden row's links move into the burger sheet.
      expect(findNode(out, "c-mobile-menu")!.children.map((c) => c.props.href)).toEqual(["/products"]);
    });

    it("keeps Tallaby Classic's account icon on phones; other headers move it into the sheet", () => {
      type Tree = NonNullable<SectionInstance["componentTree"]>;
      const walkNodes = (nodes: Tree): Tree => nodes.flatMap((node) => [node, ...walkNodes(node.children)]);
      const accountLinks = (key: string) =>
        walkNodes(drawChrome(CODE_TEMPLATES.find((t) => t.key === key)!.config().header!, "header", off)!.componentTree!).filter(
          (node) => node.type === "accountLink" || (node.type === "linkBlock" && node.props.href === "/profile"),
        );
      const classic = accountLinks("tallaby-classic");
      expect(classic.length).toBeGreaterThan(0);
      expect(classic.every((node) => node.breakpointStyles?.mobile?.hidden !== true)).toBe(true);
      expect(accountLinks("glow").every((node) => node.breakpointStyles?.mobile?.hidden === true)).toBe(true);
    });

    it("is never added to a footer", () => {
      expect(typesIn(drawChrome(bar(), "footer", off))).not.toContain("mobileMenu");
    });

    it.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s: the header has exactly one burger", (_key, template) => {
      const out = drawChrome(template.config().header!, "header", off);
      expect(typesIn(out).filter((type) => type === "mobileMenu")).toHaveLength(1);
    });
  });

  it.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s: without a logo the brand is the store name alone", (_key, template) => {
    const config = template.config();
    for (const [part, instance] of [["header", config.header], ["footer", config.footer]] as const) {
      const out = drawChrome(instance, part, off);
      const roles: unknown[] = [];
      const walk = (list: Tree) => list.forEach((node) => (roles.push(node.props.role), walk(node.children)));
      walk(out?.componentTree ?? []);
      expect(roles).not.toContain("storeInitial");
      if (instance?.componentTree && JSON.stringify(instance.componentTree).includes('"storeName"')) expect(roles).toContain("storeName");
    }
  });

  it("keeps the logo's place for the editor's uploader without a logo, and never hides the store name for it", () => {
    const input = chrome([classicLogo()], { storeName: false });
    const placeholder = { translated: false, hasLogo: false, logoPlaceholder: true };
    const row = findNode(drawChrome(input, "header", placeholder)!.componentTree!, "row")!;
    expect(row.children.map((c) => c.type)).toEqual(["storeLogo", "text"]);
    const hidden = chrome([classicLogo()], { logo: false });
    expect(findNode(drawChrome(hidden, "header", placeholder)!.componentTree!, "row")!.children.map((c) => c.id)).toEqual(["name"]);
  });

  it("goes before a footer's store name heading when there is no logo link", () => {
    const col = (props: Record<string, unknown>) => chrome([n("col", "vFlex", {}, [n("name", "heading", { role: "storeName" })])], props);
    const types = (props: Record<string, unknown>) =>
      findNode(drawChrome(col(props), "footer", { translated: false, hasLogo: true })!.componentTree!, "col")!.children.map((c) => c.type);
    expect(types({})).toEqual(["storeLogo"]);
    expect(types({ storeName: true })).toEqual(["storeLogo", "heading"]);
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
    expect(box.children.map((c) => c.id)).toEqual(["social", "c-tools", "copy", "c-legal"]);
    // The footer's language switcher is off by default.
    expect(box.children[1]!.children.map((c) => c.type)).toEqual(["themeToggle"]);
  });

  it("puts Powered by Tallaby beside the copyright line, once, in the language shown", () => {
    const input = chrome([
      n("box", "container", {}, [
        n("legal", "hFlex", {}, [
          n("copy", "text", { text: "© 2026 Store. All rights reserved." }),
          n("old", "linkBlock", { href: "https://tallaby.com", role: "poweredBy" }, [n("old-text", "text", { text: "Powered by Tallaby" })]),
        ]),
      ]),
    ]);
    const out = drawChrome(input, "footer", { translated: false, hasLogo: false, locale: "en" })!;
    expect(findNode(out.componentTree!, "old")).toBeNull();
    expect(findNode(out.componentTree!, "c-legal")!.children.map((c) => c.id)).toEqual(["copy", "c-powered-by"]);
    expect(findNode(out.componentTree!, "c-powered-by-text")!.props.text).toBe("Powered by");
    const link = findNode(out.componentTree!, "c-powered-by-link")!;
    expect(link.props.href).toBe("https://tallaby.com");
    expect(link.children[0]!.props.text).toBe("Tallaby");
    expect(link.children[0]!.style?.underline).toBe(true);
    expect(findNode(drawChrome(input, "footer", { translated: false, hasLogo: false })!.componentTree!, "c-powered-by-link")!.children[0]!.props.text).toBe("طلبي");
  });

  it.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s: the footer always credits Tallaby once", (_key, template) => {
    const footer = drawChrome(template.config().footer, "footer", { translated: false, hasLogo: false, locale: "ar" });
    const hrefs: unknown[] = [];
    const walk = (list: Tree) => list.forEach((node) => (hrefs.push(node.props.href), walk(node.children)));
    walk(footer?.componentTree ?? []);
    expect(hrefs.filter((h) => h === "https://tallaby.com")).toHaveLength(1);
  });

  it.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s: the footer gets one Download application button when the store allows it", (_key, template) => {
    const { header, footer } = template.config();
    const types = (instance: SectionInstance | null | undefined) => {
      const out: string[] = [];
      const walk = (list: Tree) => list.forEach((node) => (out.push(node.type), walk(node.children)));
      walk(instance?.componentTree ?? []);
      return out;
    };
    const on = { translated: false, hasLogo: false, locale: "ar", appInstall: true };
    expect(types(drawChrome(footer, "footer", on)).filter((t) => t === "appInstall")).toHaveLength(footer?.componentTree?.length ? 1 : 0);
    expect(types(drawChrome(footer, "footer", { ...on, appInstall: false }))).not.toContain("appInstall");
    expect(types(drawChrome(header, "header", on))).not.toContain("appInstall");
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
