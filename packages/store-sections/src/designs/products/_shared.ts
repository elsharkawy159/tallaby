/**
 * Product cards of the Products designs (library P). Every visible field is
 * bound to the product the list repeats it for (`elements/data.ts`): the
 * Arabic/English text here is only what the editor shows when the card is
 * moved out of its list. Nothing about a product is typed by the design.
 */
import type { StyleValues } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";
import type { DesignText, NodeOptions, TreeBuilder } from "../builder";
import { L, PAPER_CARD, arrowLink } from "../_kit";

export const SHOP_LINK = "/products";

/** Bound placeholders, in the store's two languages. */
export const PRODUCT_NAME = L("اسم المنتج", "Product name");
const PRICE = L("٢٥٠ ج.م", "EGP 250");
const WAS = L("٣٠٠ ج.م", "EGP 300");

/** The product photo as a link, with the sale chip on its corner. */
export function productPhoto(t: TreeBuilder, o: { ratio?: StyleValues["aspectRatio"]; radius?: number; chip?: boolean } = {}): NodeTemplate {
  const radius = o.radius ?? 16;
  return t.box(
    [
      t.link(SHOP_LINK, [t.image("", PRODUCT_NAME, { bind: "image", style: { aspectRatio: o.ratio ?? "square", objectFit: "cover", width: "100%" } })], {
        label: L("صورة المنتج", "Product photo"),
        bind: "href",
        style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, radius, overflow: "hidden", background: "secondary" },
      }),
      ...(o.chip === false
        ? []
        : [
            t.badge(L("-٢٠٪", "-20%"), {
              bind: "discount",
              style: { position: "absolute", insetTop: "10px", insetStart: "10px", background: "accent", color: "foreground", fontWeight: "bold" },
            }),
          ]),
    ],
    {
      label: L("الصورة", "Photo"),
      style: { position: "relative", paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, background: "transparent" },
    },
  );
}

/** Price and, when the product has one, its list price struck through. */
export function priceRow(t: TreeBuilder, style: StyleValues = {}): NodeTemplate {
  return t.row(
    [
      t.text(PRICE, { bind: "price", style: { fontWeight: "bold", color: "primary", fontSize: "md" } }),
      t.text(WAS, { bind: "compareAtPrice", style: { color: "muted", fontSize: "sm", italic: true } }),
    ],
    { label: L("السعر", "Price"), style: { gap: 8, alignItems: "center", ...style } },
  );
}

/** The product name as a link to its page. */
export function productName(t: TreeBuilder, style: StyleValues = {}): NodeTemplate {
  return t.link(SHOP_LINK, [t.text(PRODUCT_NAME, { bind: "title", style: { fontWeight: "semibold", lineHeight: "snug", ...style } })], {
    label: L("اسم المنتج", "Product name"),
    bind: "href",
    style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, color: "foreground" },
  });
}

/** A bordered paper card: photo, name, price and the cart button. */
export function productCard(t: TreeBuilder, o: { ratio?: StyleValues["aspectRatio"]; bordered?: boolean } = {}): NodeTemplate {
  const bordered = o.bordered !== false;
  return t.stack(
    [
      productPhoto(t, { ratio: o.ratio, radius: bordered ? 14 : 16 }),
      t.stack([productName(t), priceRow(t)], { label: L("المعلومات", "Details"), style: { gap: 6 } }),
      t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
    ],
    {
      label: L("بطاقة المنتج", "Product card"),
      style: bordered ? { ...PAPER_CARD, radius: 18, gap: 12, paddingTop: 10, paddingBottom: 14, paddingStart: 10, paddingEnd: 10 } : { gap: 10 },
    },
  );
}

// ---------------------------------------------------------------------------
// The premium card and heading (look-first pilot, docs/systems/plan.md §10)
// ---------------------------------------------------------------------------

const NO_PAD: StyleValues = { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 };

/** A product section's root padding: a little more air than the 64 / 40 default. */
export const PRODUCTS_SECTION: { style: StyleValues; mobile: StyleValues } = {
  style: { paddingTop: 72, paddingBottom: 72 },
  mobile: { paddingTop: 48, paddingBottom: 48 },
};

/** The section title of the product designs: calm, not a display size. */
export const HEAD_TITLE: { style: StyleValues; mobile: StyleValues } = {
  style: { fontSize: "4xl", lineHeight: "tight" },
  mobile: { fontSize: "2xl" },
};

/** The heading row: copy at the start, "View all" at the end (under the copy on phones). */
export const HEAD_ROW: { style: StyleValues; mobile: StyleValues } = {
  style: { justifyContent: "between", alignItems: "end", gap: 24, wrap: false },
  mobile: { direction: "column", alignItems: "start", gap: 12 },
};

/** Space between the heading and the products. */
export const HEAD_GAP = { desktop: 40, mobile: 24 } as const;

/** "View all" and an arrow, in the text colour. */
export function viewAllLink(t: TreeBuilder, href: string, opts: NodeOptions & { text?: DesignText } = {}): NodeTemplate {
  const { text, style, ...rest } = opts;
  return arrowLink(t, text ?? L("عرض الكل", "View all"), href, { ...rest, style: { color: "foreground", ...style } });
}

type ProductsHeadOptions = {
  eyebrow?: DesignText;
  title: DesignText;
  subtitle?: DesignText;
  /** "View all" at the end of the row on desktop, under the title on phones. */
  link?: { href: string; text?: DesignText };
  /** Space under the block (the designs whose parent has no `gap`). */
  spaced?: boolean;
};

/**
 * The heading of a product section: an optional small eyebrow, the `h2`
 * (rising word by word, motion v2) and an optional line, with "View all" at
 * the end. One block for every product design that uses the premium card.
 */
export function productsHead(t: TreeBuilder, o: ProductsHeadOptions): NodeTemplate {
  const space = o.spaced === false ? {} : { style: { marginBottom: HEAD_GAP.desktop }, mobile: { marginBottom: HEAD_GAP.mobile } };
  const copy = t.stack(
    [
      ...(o.eyebrow
        ? [t.text(o.eyebrow, { role: "eyebrow", style: { color: "muted", fontSize: "xs", fontWeight: "semibold", letterSpacing: "wider", textTransform: "uppercase" } })]
        : []),
      t.heading(o.title, "h2", { role: "title", ...HEAD_TITLE, motion: { reveal: "words" } }),
      ...(o.subtitle ? [t.paragraph(o.subtitle, { role: "subtitle", style: { fontSize: "sm", maxWidth: "520px" } })] : []),
    ],
    {
      label: L("العنوان", "Heading"),
      role: "intro",
      // The title plays its own reveal, so the block does not reveal as one.
      motion: { reveal: "none" },
      style: { gap: 8, ...(!o.link && space.style) },
      ...(!o.link && space.mobile && { mobile: space.mobile }),
    },
  );
  if (!o.link) return copy;
  return t.row([copy, viewAllLink(t, o.link.href, { text: o.link.text })], {
    label: L("رأس القسم", "Section head"),
    style: { ...HEAD_ROW.style, ...space.style },
    mobile: { ...HEAD_ROW.mobile, ...space.mobile },
  });
}

/** The price in bold and, when the product has one, its list price struck through (by the renderer) and muted. */
export function premiumPrice(t: TreeBuilder, o: { large?: boolean } = {}): NodeTemplate {
  return t.row(
    [
      t.text(PRICE, { bind: "price", style: { fontWeight: "bold", color: "foreground", fontSize: o.large ? "lg" : "sm" } }),
      t.text(WAS, { bind: "compareAtPrice", style: { color: "muted", fontSize: o.large ? "sm" : "xs" } }),
    ],
    { label: L("السعر", "Price"), style: { gap: 8, alignItems: "center" } },
  );
}

export type PremiumCardOptions = {
  /** The photo's ratio when the site has no product stage (default portrait). */
  ratio?: StyleValues["aspectRatio"];
  /** The frame colour behind the photo when the site has no product stage (default `secondary`; `background` on a tinted band). */
  frame?: string;
  radius?: number;
  /** The wishlist heart on the photo's end corner. */
  wishlist?: boolean;
  /** The cart button under the price (on unless false). */
  quickAdd?: boolean;
};

/**
 * The one product card of the product sections (pilot L2): the photo in one
 * frame (the site's product stage when it has one, `elements/style.ts`; else
 * this ratio on the `secondary` colour), a small sale chip on its start
 * corner, then the name (regular weight, two lines at most), the price (the
 * list price struck through beside it) and a slim cart button. No border and
 * no shadow. The second photo on hover comes from the list (motion v2).
 * Node order is the old cards' order, so field names stay as they were.
 */
export function premiumCard(t: TreeBuilder, o: PremiumCardOptions = {}): NodeTemplate {
  const radius = o.radius ?? 12;
  return t.stack(
    [
      t.box(
        [
          t.link(
            SHOP_LINK,
            [t.image("", PRODUCT_NAME, { label: L("صورة البطاقة", "Card photo"), bind: "image", style: { aspectRatio: o.ratio ?? "portrait", objectFit: "cover", width: "100%" } })],
            { label: L("صورة المنتج", "Product photo"), bind: "href", style: { ...NO_PAD, radius, overflow: "hidden", background: o.frame ?? "secondary" } },
          ),
          t.badge(L("خصم ٢٠٪", "20% Off"), {
            label: L("شارة الخصم", "Sale chip"),
            bind: "discount",
            style: {
              position: "absolute",
              insetTop: "10px",
              insetStart: "10px",
              background: "primary",
              color: "primaryInk",
              fontWeight: "semibold",
              fontSize: "xs",
              radius: 999,
              paddingTop: 3,
              paddingBottom: 3,
              paddingStart: 9,
              paddingEnd: 9,
            },
            mobile: { insetTop: "8px", insetStart: "8px" },
          }),
          ...(o.wishlist ? [t.wishlistButton({ label: L("المفضلة", "Wishlist"), style: { position: "absolute", insetTop: "8px", insetEnd: "8px" } })] : []),
        ],
        { label: L("الصورة", "Photo"), style: { position: "relative", ...NO_PAD, background: "transparent" } },
      ),
      t.stack(
        [
          t.link(SHOP_LINK, [t.text(PRODUCT_NAME, { bind: "title", style: { fontSize: "sm", fontWeight: "normal", lineHeight: "snug", lineClamp: 2 } })], {
            label: L("اسم المنتج", "Product name"),
            bind: "href",
            style: { ...NO_PAD, color: "foreground" },
          }),
          premiumPrice(t),
        ],
        { label: L("المعلومات", "Details"), style: { gap: 4 } },
      ),
      ...(o.quickAdd === false ? [] : [t.addToCart({ label: L("أضف للسلة", "Add to cart") })]),
    ],
    { label: L("بطاقة المنتج", "Product card"), style: { gap: 14 }, mobile: { gap: 10 } },
  );
}
