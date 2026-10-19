/**
 * Orbit points (Modular set): a product photo on a large shelf circle in the
 * centre, with two features on each side, each marked by a small numbered dot.
 * Points sit in their own columns, never over the photo. On mobile the photo
 * comes first, then a 2×2 grid of points.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type TreeBuilder } from "../builder";
import { L, N } from "../_kit";

const POINTS = [
  {
    title: L("خامة تعيش", "Built to last"),
    text: L("مختارة عشان تستحمل الاستخدام اليومي", "Chosen for everyday use"),
  },
  {
    title: L("خفيف وعملي", "Light and handy"),
    text: L("سهل تشيله معاك في أي مكان", "Easy to take anywhere"),
  },
  {
    title: L("ضمان محلي", "Local warranty"),
    text: L("بفاتورة رسمية من المتجر", "With an official store invoice"),
  },
  {
    title: L("تغليف هدية", "Gift wrapping"),
    text: L("مجانًا لو طلبت", "Free on request"),
  },
];

function point(t: TreeBuilder, i: number): NodeTemplate {
  const p = POINTS[i]!;
  return t.stack(
    [
      t.box(
        [
          t.text(N(String(i + 1)), {
            style: {
              fontWeight: "bold",
              fontSize: "sm",
              textAlign: "center",
              color: "foreground",
            },
          }),
        ],
        {
          label: L("الرقم", "Number"),
          style: {
            background: "accent",
            radius: 999,
            width: "32px",
            paddingTop: 5,
            paddingBottom: 5,
          },
        },
      ),
      t.heading(p.title, "h3", { style: { fontSize: "lg" } }),
      t.paragraph(p.text, { style: { fontSize: "sm" } }),
    ],
    { label: L("نقطة", "Point"), style: { gap: 8 } },
  );
}

export const featuresOrbit = defineDesign({
  id: "features-orbit",
  version: 1,
  category: "features",
  subcategory: "image-features",
  name: L("نقاط حول المنتج", "Orbit points"),
  description: L("صورة منتج في دائرة، وحواليها أربع مميزات مرقمة.", "A product photo in a circle with four numbered features around it."),
  keywords: ["features", "product", "points", "premium", "مميزات", "منتج", "نقاط"],
  tree: (t) =>
    t.section({ label: L("مميزات المنتج", "Product features") }, [
      t.container(
        [
          t.heading(L("ليه هتحبه", "Why you will love it"), "h2", {
            role: "title",
            style: {
              fontSize: "display-sm",
              letterSpacing: "tight",
              textAlign: "center",
              marginBottom: 40,
            },
            mobile: { marginBottom: 24 },
          }),
          t.grid(
            [
              t.stack([point(t, 0), point(t, 1)], {
                label: L("الجانب الأول", "First side"),
                style: { gap: 48, alignItems: "end" },
                mobile: { order: 2, gap: 24, alignItems: "start" },
              }),
              t.stack(
                [
                  t.photo(4, L("صورة المنتج", "Product photo"), {
                    role: "image",
                    style: {
                      aspectRatio: "square",
                      objectFit: "cover",
                      radius: 999,
                      width: "100%",
                      borderWidth: 12,
                      borderColor: "secondary",
                    },
                  }),
                ],
                {
                  label: L("الدائرة", "Circle"),
                  style: { alignItems: "center" },
                  mobile: { order: 1, colSpan: 2 },
                },
              ),
              t.stack([point(t, 2), point(t, 3)], {
                label: L("الجانب الثاني", "Second side"),
                style: { gap: 48 },
                mobile: { order: 3, gap: 24 },
              }),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 3, mobile: 2 },
              style: { gap: 40, alignItems: "center" },
              mobile: { gap: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
