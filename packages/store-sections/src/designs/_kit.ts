/**
 * Small pieces the section designs share (Claude Design section library,
 * 2026-10-19): the bilingual text helper, the section heading row, icon
 * tiles, star rows and arrow links. Each returns ordinary element nodes with
 * Layers labels, so nothing here is fixed markup.
 */
import type { ElementIconName } from "../elements/registry";
import type { StyleValues } from "../elements/style";
import type { NodeTemplate } from "../elements/tree";
import type { DesignText, NodeOptions, TreeBuilder } from "./builder";

export const L = (ar: string, en: string) => ({ ar, en });

/** Arabic digits for the Arabic side of a number written once. */
export function arDigits(value: string): string {
  return value.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}

/** A number or code that reads the same in both languages, with Arabic digits on the Arabic side. */
export const N = (value: string) => L(arDigits(value), value);

/** Text on a brand-coloured surface. */
export const ON_BRAND: StyleValues = { color: "primaryInk" };
/** Body text on a brand-coloured surface (paragraphs are muted by default). */
export const ON_BRAND_BODY: StyleValues = { color: "primaryInk", opacity: 85 };

const SHOP_ALL = L("عرض الكل", "View all");

/** `text` and an arrow, as one link. */
export function arrowLink(t: TreeBuilder, text: DesignText, href: string, opts: NodeOptions = {}): NodeTemplate {
  const { style, ...rest } = opts;
  return t.link(
    href,
    [
      t.row([t.text(text, { style: { fontWeight: "semibold", fontSize: "sm" } }), t.icon("arrow", { style: { fontSize: "md", color: "primary" } })], {
        label: L("نص الرابط", "Link text"),
        style: { gap: 6, wrap: false },
      }),
    ],
    { label: L("رابط", "Link"), role: "link", ...rest, style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, color: "primary", ...style } },
  );
}

type HeadOptions = {
  eyebrow?: DesignText;
  title: DesignText;
  subtitle?: DesignText;
  /** "View all" link at the end of the row (`true` for the default label). */
  link?: { href: string; text?: DesignText };
  align?: "start" | "center";
  /** Title colour and paragraph colour for dark panels. */
  tone?: "default" | "brand";
  size?: "display-sm" | "display-md" | "3xl";
};

/** The section heading: eyebrow, title and subtitle, with an optional link at the end. */
export function sectionHead(t: TreeBuilder, o: HeadOptions): NodeTemplate {
  const center = o.align === "center";
  const onBrand = o.tone === "brand";
  const copy = t.stack(
    [
      ...(o.eyebrow ? [t.badge(o.eyebrow, { role: "eyebrow", style: { color: "primary", background: onBrand ? "background" : "secondary" } })] : []),
      t.heading(o.title, "h2", {
        role: "title",
        style: { fontSize: o.size ?? "display-sm", ...(center && { textAlign: "center" }), ...(onBrand && ON_BRAND) },
      }),
      ...(o.subtitle
        ? [
            t.paragraph(o.subtitle, {
              role: "subtitle",
              style: { maxWidth: "640px", ...(center && { textAlign: "center" }), ...(onBrand && ON_BRAND_BODY) },
            }),
          ]
        : []),
    ],
    { label: L("العنوان", "Heading"), role: "intro", style: { gap: 10, ...(center && { alignItems: "center" }) } },
  );
  if (!o.link) return copy;
  return t.row([copy, arrowLink(t, o.link.text ?? SHOP_ALL, o.link.href)], {
    label: L("رأس القسم", "Section head"),
    style: { justifyContent: "between", alignItems: "end", gap: 16, marginBottom: 32 },
    mobile: { marginBottom: 24 },
  });
}

/** An icon centred on a tinted rounded square. */
export function iconTile(t: TreeBuilder, icon: ElementIconName, style: StyleValues = {}): NodeTemplate {
  return t.box([t.icon(icon, { style: { fontSize: "xl", color: style.color ?? "primary" } })], {
    label: L("أيقونة", "Icon tile"),
    style: {
      background: "secondary",
      radius: 12,
      paddingTop: 12,
      paddingBottom: 12,
      paddingStart: 12,
      paddingEnd: 12,
      width: "48px",
      textAlign: "center",
      ...style,
    },
  });
}

/** Five stars, the last `5 - rating` faded. */
export function stars(t: TreeBuilder, rating = 5): NodeTemplate {
  return t.row(
    [1, 2, 3, 4, 5].map((i) => t.icon("star", { style: { color: "accent", fontSize: "md", ...(i > rating && { opacity: 30 }) } })),
    { label: L("التقييم", "Rating"), style: { gap: 2, wrap: false } },
  );
}

/** A round initial and a name with a small line under it. */
export function person(t: TreeBuilder, initial: DesignText, name: DesignText, line: DesignText): NodeTemplate {
  return t.row(
    [
      t.box([t.text(initial, { style: { fontWeight: "bold", color: "primaryInk", textAlign: "center", fontSize: "md" } })], {
        label: L("الصورة الرمزية", "Avatar"),
        style: { background: "primary", radius: 999, width: "44px", paddingTop: 10, paddingBottom: 10, paddingStart: 0, paddingEnd: 0 },
      }),
      t.stack([t.text(name, { style: { fontWeight: "semibold" } }), t.text(line, { style: { color: "muted", fontSize: "xs" } })], {
        label: L("الاسم", "Name"),
        style: { gap: 2 },
      }),
    ],
    { label: L("صاحب الرأي", "Reviewer"), style: { gap: 12, wrap: false } },
  );
}

/** A bordered paper card, the common white card of the library. */
export const PAPER_CARD: StyleValues = { background: "background", borderWidth: 1, borderColor: "border", radius: 20 };

/** A photo cropped to a fixed frame. */
export const cover = (aspectRatio: StyleValues["aspectRatio"], radius = 16): StyleValues => ({ aspectRatio, radius, objectFit: "cover", width: "100%" });
