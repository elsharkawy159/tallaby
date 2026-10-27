/**
 * Price-tag product hero (library R-d): the product story with three
 * highlight tiles and the buttons on the start side; the product on a large
 * stage with a tag hanging over its corner on the end side.
 */
import { defineDesign } from "../builder";
import { L, stars } from "../_kit";

const HIGHLIGHTS = [
  { value: L("٤٨ ساعة", "48 hours"), label: L("توصيل", "Delivery") },
  { value: L("سنتين", "2 years"), label: L("ضمان", "Warranty") },
  { value: L("١٤ يومًا", "14 days"), label: L("استرجاع", "Returns") },
];

export const heroProduct = defineDesign({
  id: "hero-product",
  version: 1,
  category: "hero",
  subcategory: "product",
  name: L("منتج بتيكيت", "Product with tag"),
  description: L(
    "قصة منتج واحد بمميزاته وزر شراء، وصورته على مسرح مع بطاقة عرض.",
    "One product's story, highlights and buy button, with its photo on a stage and an offer tag.",
  ),
  keywords: ["hero", "product", "launch", "منتج", "إطلاق", "الأكثر مبيعا"],
  tree: (t) =>
    t.section({ label: L("منتج مميز", "Product hero") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.badge(L("الأكثر مبيعًا", "Best seller"), { role: "eyebrow", style: { color: "primary" } }),
                  t.heading(L("اسم المنتج المميز هنا", "Your featured product"), "h1", {
                    role: "title",
                    style: { fontSize: "display-md", fontWeight: "extrabold", lineHeight: "tight" },
                  }),
                  t.row([stars(t, 5), t.text(L("٤٫٨ من ١٢٨ تقييم", "4.8 from 128 reviews"), { style: { color: "muted" } })], {
                    label: L("التقييم", "Rating"),
                    style: { gap: 8 },
                  }),
                  t.paragraph(
                    L(
                      "اكتب هنا ما يميز المنتج في سطرين: الخامة، والمدة، ولماذا سيحبه العميل.",
                      "Say what makes the product special in two lines: material, battery life, why customers love it.",
                    ),
                    { role: "body", style: { fontSize: "lg" } },
                  ),
                  t.grid(
                    HIGHLIGHTS.map((h) =>
                      t.card(
                        [t.text(h.value, { style: { fontWeight: "bold", fontSize: "lg" } }), t.text(h.label, { style: { color: "muted", fontSize: "xs" } })],
                        {
                          label: L("ميزة", "Highlight"),
                          style: { paddingTop: 14, paddingBottom: 14, paddingStart: 16, paddingEnd: 16, radius: 14, background: "secondary", borderWidth: 0 },
                        },
                      ),
                    ),
                    { label: L("المميزات", "Highlights"), role: "items", columns: { desktop: 3, mobile: 3 }, style: { gap: 10 }, mobile: { gap: 8 } },
                  ),
                  t.row(
                    [t.button(L("اطلب الآن", "Order now"), "/products", "solid", { role: "cta" }), t.textLink(L("كل التفاصيل", "Full details"), "/products")],
                    { label: L("الأزرار", "Buttons"), style: { gap: 20 } },
                  ),
                ],
                { label: L("القصة", "Story"), style: { gap: 16 } },
              ),
              t.box(
                [
                  t.photo(3, L("صورة المنتج", "Product photo"), {
                    role: "image",
                    style: { aspectRatio: "square", objectFit: "cover", radius: 28 },
                  }),
                  t.stack(
                    [
                      t.text(L("عرض الإطلاق", "Launch offer"), { style: { fontSize: "xs", color: "muted" } }),
                      t.heading(L("خصم ٢٠٪", "20% off"), "h3", { style: { fontSize: "2xl", fontWeight: "extrabold" } }),
                      t.text(L("لأول ١٠٠ طلب", "First 100 orders"), { style: { fontSize: "xs", color: "primary", fontWeight: "semibold" } }),
                    ],
                    {
                      label: L("بطاقة العرض", "Offer tag"),
                      role: "tag",
                      style: {
                        position: "absolute",
                        insetTop: "24px",
                        insetStart: "-20px",
                        background: "accent",
                        color: "foreground",
                        radius: 16,
                        gap: 2,
                        paddingTop: 16,
                        paddingBottom: 16,
                        paddingStart: 20,
                        paddingEnd: 20,
                        shadow: "md",
                      },
                      mobile: { insetStart: "12px", insetTop: "12px" },
                    },
                  ),
                ],
                {
                  label: L("المسرح", "Stage"),
                  style: {
                    position: "relative",
                    background: "secondary",
                    radius: 32,
                    paddingTop: 24,
                    paddingBottom: 24,
                    paddingStart: 24,
                    paddingEnd: 24,
                    minHeight: 420,
                  },
                  mobile: { minHeight: 300, paddingTop: 16, paddingBottom: 16, paddingStart: 16, paddingEnd: 16 },
                },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 56, alignItems: "center" }, mobile: { gap: 32 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
