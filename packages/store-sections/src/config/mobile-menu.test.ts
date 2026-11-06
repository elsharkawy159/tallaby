import { describe, expect, it } from "vitest";
import { findNode } from "../elements/tree";
import { drawChrome, mobileMenuRows } from "./header";
import { MOBILE_MENU_PROP, readMobileMenu, setMobileMenu, type MobileMenuConfig } from "./mobile-menu";
import type { SectionInstance } from "./schema";
import { sanitizeSiteConfig } from "./sanitize";
import { CODE_TEMPLATES } from "../templates/catalog";

type Tree = NonNullable<SectionInstance["componentTree"]>;
const n = (id: string, type: string, props: Record<string, unknown> = {}, children: Tree = []): Tree[number] => ({ id, type, props, children }) as Tree[number];
const link = (id: string, href: string, text: string, en?: string) =>
  n(id, "linkBlock", { href }, [n(`${id}-t`, "text", { text, ...(en && { translations: { en: { text: en } } }) })]);
const header = (props: Record<string, unknown> = {}): SectionInstance => ({
  id: "c",
  sectionId: "custom-section",
  version: 1,
  props,
  componentTree: [
    n("root", "section", {}, [
      n("bar", "hFlex", {}, [
        n("logo", "linkBlock", { role: "logo", href: "/" }, [n("name", "text", { role: "storeName" })]),
        n("menu", "hFlex", { role: "menu" }, [link("home", "/", "الرئيسية", "Home"), link("shop", "/products", "المتجر", "Shop"), link("about", "/about", "من نحن", "About")]),
      ]),
    ]),
  ],
});
const opts = (locale: string) => ({ translated: false, hasLogo: false, locale });
/** The sheet's rows as drawn: [href, first text]. */
const sheet = (h: SectionInstance, locale = "ar") => {
  const burger = findNode(drawChrome(h, "header", opts(locale))!.componentTree!, "c-mobile-menu")!;
  const text = (node: Tree[number]): string => (node.type === "text" ? String(node.props.text) : node.children.map(text).join(""));
  return burger.children.map((child) => [child.props.href, text(child)]);
};
const withMenu = (config: Partial<MobileMenuConfig>) => setMobileMenu(header(), { order: [], hidden: [], labels: {}, added: [], ...config });

describe("mobile menu sheet settings (F-74)", () => {
  it("draws today's sheet when the header has none", () => {
    expect(sheet(header())).toEqual([
      ["/", "الرئيسية"],
      ["/products", "المتجر"],
      ["/about", "من نحن"],
    ]);
    expect(header().props[MOBILE_MENU_PROP]).toBeUndefined();
  });

  it("lists the rows for the builder with stable ids and the editing language's names", () => {
    const rows = mobileMenuRows(header(), "en");
    expect(rows.map((r) => [r.id, r.href, r.label, r.hidden, r.added])).toEqual([
      ["c-mm-home", "/", "Home", false, false],
      ["c-mm-shop", "/products", "Shop", false, false],
      ["c-mm-about", "/about", "About", false, false],
    ]);
  });

  it("reorders, hides and renames rows, per language", () => {
    const h = withMenu({ order: ["c-mm-about", "c-mm-home"], hidden: ["c-mm-shop"], labels: { "c-mm-about": { ar: "قصتنا", en: "Our story" } } });
    expect(sheet(h, "ar")).toEqual([
      ["/about", "قصتنا"],
      ["/", "الرئيسية"],
    ]);
    expect(sheet(h, "en")).toEqual([
      ["/about", "Our story"],
      ["/", "الرئيسية"],
    ]);
    // The builder still lists the hidden row.
    expect(mobileMenuRows(h, "ar").map((r) => [r.id, r.hidden, r.renamed])).toEqual([
      ["c-mm-about", false, true],
      ["c-mm-home", false, false],
      ["c-mm-shop", true, false],
    ]);
  });

  it("adds store pages, and a link added to the header's menu later still shows, at the end", () => {
    const h = withMenu({ added: [{ id: "a1", href: "/contact", label: { ar: "اتصل بنا", en: "Contact" } }], order: ["a1"] });
    expect(sheet(h, "en")[0]).toEqual(["/contact", "Contact"]);
    expect(sheet(h, "ar").map(([href]) => href)).toEqual(["/contact", "/", "/products", "/about"]);
  });

  it("never trusts the stored value", () => {
    const config = readMobileMenu(
      header({
        [MOBILE_MENU_PROP]: {
          order: ["ok", "bad id!", 3],
          hidden: "nope",
          labels: { ok: { ar: "  اسم  ", en: 5 }, empty: {} },
          added: [
            { id: "x", href: "javascript:alert(1)", label: { ar: "x" } },
            { id: "y", href: "https://evil.example", label: { ar: "y" } },
            { id: "z", href: "/faq", label: { en: "FAQ" } },
            { id: "z", href: "/faq", label: { en: "FAQ again" } },
            { id: "w", href: "/w", label: {} },
          ],
        },
      }),
    );
    expect(config).toEqual({ order: ["ok"], hidden: [], labels: { ok: { ar: "اسم" } }, added: [{ id: "z", href: "/faq", label: { en: "FAQ" } }] });
  });

  it("stores nothing when nothing differs, and survives saving (sanitizeSiteConfig)", () => {
    expect(withMenu({}).props).toEqual({});
    const h = withMenu({ hidden: ["c-mm-shop"] });
    const site = { ...CODE_TEMPLATES[0]!.config(), header: h };
    expect(readMobileMenu(sanitizeSiteConfig(site).header).hidden).toEqual(["c-mm-shop"]);
  });
});
