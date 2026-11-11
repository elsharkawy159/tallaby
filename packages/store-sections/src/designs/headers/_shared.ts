/**
 * Header pieces: the store name as a logo, menu links and icon buttons. There
 * are no store chrome nodes yet (live cart count, search field, language
 * switch), so search and cart are links to the store's own pages.
 */
import type { ElementIconName } from "../../elements/registry";
import type { StyleValues } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";
import type { DesignText, NodeOptions, TreeBuilder } from "../builder";
import { L } from "../_kit";

export const MENU = [
  { text: L("الرئيسية", "Home"), href: "/" },
  { text: L("المتجر", "Shop"), href: "/products" },
  { text: L("العروض", "Offers"), href: "/products" },
  { text: L("المدونة", "Blog"), href: "/blog" },
  { text: L("من نحن", "About"), href: "/about" },
  { text: L("تواصل معنا", "Contact"), href: "/contact" },
];

export const STORE_NAME = L("اسم متجرك", "Your store");

/** A round brand mark with the first letter, and the store name. */
export function logo(
  t: TreeBuilder,
  opts: { mark?: boolean; size?: "lg" | "xl" | "2xl"; onBrand?: boolean; /** Over the store name's own style (a wordmark in the heading font). */ nameStyle?: StyleValues } = {},
): NodeTemplate {
  return t.link(
    "/",
    [
      t.row(
        [
          ...(opts.mark === false
            ? []
            : [
                t.box(
                  [
                    t.text(L("م", "Y"), {
                      style: { fontWeight: "extrabold", color: opts.onBrand ? "foreground" : "primaryInk", textAlign: "center", fontSize: "lg" },
                    }),
                  ],
                  {
                    label: L("العلامة", "Mark"),
                    style: { background: opts.onBrand ? "accent" : "primary", radius: 12, width: "40px", paddingTop: 7, paddingBottom: 7 },
                  },
                ),
              ]),
          t.text(STORE_NAME, { role: "storeName", style: { fontWeight: "extrabold", fontSize: opts.size ?? "xl", ...opts.nameStyle } }),
        ],
        { label: L("الشعار", "Logo"), style: { gap: 10, wrap: false } },
      ),
    ],
    { label: L("رابط الرئيسية", "Home link"), role: "logo", style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 } },
  );
}

/** Menu links in a row; pills tint the first (current) page. */
export function nav(
  t: TreeBuilder,
  items = MENU,
  opts: NodeOptions & { pills?: boolean; color?: string; /** Over each link's text style (size, weight). */ textStyle?: StyleValues } = {},
): NodeTemplate {
  const { pills, color = "foreground", textStyle, ...rest } = opts;
  return t.row(
    items.map((item, i) =>
      t.link(item.href, [t.text(item.text, { style: { fontWeight: "medium", ...textStyle } })], {
        label: L("رابط", "Menu link"),
        style: {
          paddingTop: pills ? 8 : 4,
          paddingBottom: pills ? 8 : 4,
          paddingStart: pills ? 14 : 0,
          paddingEnd: pills ? 14 : 0,
          ...(pills && { radius: 999 }),
          ...(pills && i === 0 ? { background: "secondary", color: "primary" } : { color, hover: { opacity: 75 } }),
        },
      }),
    ),
    { label: L("القائمة", "Menu"), role: "menu", ...rest, style: { gap: pills ? 4 : 24, ...rest.style } },
  );
}

/** A 44px round icon button that links somewhere. */
export function iconLink(t: TreeBuilder, icon: ElementIconName, href: string, label: DesignText, opts: NodeOptions = {}): NodeTemplate {
  return t.link(href, [t.icon(icon, { style: { fontSize: "lg", color: "foreground" } })], {
    label,
    ...opts,
    style: {
      width: "44px",
      paddingTop: 11,
      paddingBottom: 9,
      paddingStart: 0,
      paddingEnd: 0,
      radius: 999,
      textAlign: "center",
      hover: { background: "secondary" },
      ...opts.style,
    },
  });
}

/** The store name as a wordmark: the heading font, tightly set (the reference headers' logo). */
export const WORDMARK: StyleValues = { fontFamily: "heading", fontWeight: "bold", letterSpacing: "tight", lineHeight: "tight" };
/** Menu links of a quiet header: small and medium weight (no letter spacing: it breaks joined Arabic letters). */
export const QUIET_LINK: StyleValues = { fontSize: "sm", fontWeight: "medium" };

export const searchLink = (t: TreeBuilder) => iconLink(t, "search", "/products", L("بحث", "Search"));
export const cartLink = (t: TreeBuilder) => iconLink(t, "shopping-bag", "/cart", L("السلة", "Cart"));
