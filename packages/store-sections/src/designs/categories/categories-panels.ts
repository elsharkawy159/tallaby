/**
 * Collection panels (2026-10-29, after the WoodMart "Accessories" demo's
 * banner grid): four light tinted panels in two rows of uneven widths (narrow
 * and wide, then wide and narrow), each a featured
 * collection with a small brand coloured label, a big title and a button on
 * the start side and the photo on the end side. Phones stack the panels and
 * keep copy and photo side by side. Collections, not offers: no amounts off.
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

type Panel = { label: DesignText; title: DesignText; cta: DesignText; photo: number; solid: boolean; span: number };

const PANELS: Panel[] = [
  { label: L("جديد تمامًا", "Brand new"), title: L("جرابات للموبايل", "Phone cases"), cta: L("تسوّق", "Shop"), photo: 0, solid: true, span: 2 },
  { label: L("للساعة الذكية", "For your smartwatch"), title: L("أساور بكل الألوان", "Straps in every colour"), cta: L("تسوّق", "Shop"), photo: 1, solid: false, span: 3 },
  { label: L("مختارات", "Picks"), title: L("حوامل بألوان مبهجة", "Colourful grips and stands"), cta: L("اكتشف", "Discover"), photo: 2, solid: false, span: 3 },
  { label: L("شحن أسرع", "Faster charging"), title: L("شواحن لاسلكية", "Wireless chargers"), cta: L("تسوّق", "Shop"), photo: 3, solid: true, span: 2 },
];

const panel = (t: TreeBuilder, p: Panel) =>
  t.grid(
    [
      t.stack(
        [
          t.text(p.label, { role: "eyebrow", style: { color: "primary", fontWeight: "medium", fontSize: "sm" } }),
          t.heading(p.title, "h3", {
            role: "title",
            style: { fontSize: "3xl", fontWeight: "semibold", lineHeight: "tight" },
            mobile: { fontSize: "xl" },
          }),
          t.button(p.cta, "/products", p.solid ? "solid" : "outline", { role: "cta", style: { marginTop: 8 } }),
        ],
        { label: L("النص", "Copy"), style: { gap: 10, alignItems: "start", justifyContent: "center" } },
      ),
      t.photo(p.photo, p.title, {
        role: "image",
        style: { aspectRatio: "square", objectFit: "cover", width: "100%", radius: 0 },
      }),
    ],
    {
      label: L("لوح", "Panel"),
      columns: { desktop: 2, mobile: 2 },
      style: {
        gap: 20,
        alignItems: "center",
        background: "secondary",
        overflow: "hidden",
        paddingTop: 32,
        paddingBottom: 32,
        paddingStart: 32,
        paddingEnd: 32,
        colSpan: p.span,
      },
      tablet: { colSpan: 1 },
      mobile: { colSpan: 1, gap: 12, paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20 },
    },
  );

export const categoriesPanels = defineDesign({
  id: "categories-panels",
  version: 1,
  category: "categories",
  subcategory: "collections",
  name: L("ألواح مجموعات", "Collection panels"),
  description: L(
    "أربع ألواح فاتحة في شبكة لمجموعات مختارة: عنوان وزر في جنب وصورة في الجنب التاني.",
    "Four light panels in a grid for featured collections, each with a title and button beside a photo.",
  ),
  keywords: ["collections", "categories", "banners", "panels", "grid", "مجموعات", "أقسام", "بانرات", "ألواح"],
  tree: (t) =>
    t.section({ label: L("المجموعات", "Collections") }, [
      t.container(
        [
          t.grid(
            PANELS.map((p) => panel(t, p)),
            { label: L("الألواح", "Panels"), role: "items", columns: { desktop: 5, tablet: 1, mobile: 1 }, style: { gap: 20 }, mobile: { gap: 12 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
