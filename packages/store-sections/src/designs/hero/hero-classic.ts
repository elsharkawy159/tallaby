/**
 * Classic hero (library R, Classic template): a tinted rounded panel with the
 * headline, a line and two buttons on the start side, and the product photo
 * in a white arch with an accent circle on its corner on the end side.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const heroClassic = defineDesign({
  id: "hero-classic",
  version: 1,
  category: "hero",
  subcategory: "split",
  name: L("واجهة كلاسيك", "Classic hero"),
  description: L("لوحة ملونة بعنوان كبير وزرين وصورة المنتج داخل قوس.", "A tinted panel with a big headline, two buttons and the product in an arch."),
  keywords: ["hero", "classic", "banner", "واجهة", "كلاسيك", "بانر"],
  tree: (t) =>
    t.section({ label: L("الواجهة", "Hero"), style: { paddingTop: 24, paddingBottom: 24 } }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.badge(L("موسم جديد", "New season"), { role: "eyebrow", style: { background: "background", color: "primary" } }),
                  t.heading(L("كل ما تحتاجه، في مكان واحد", "Everything you need, in one place"), "h1", {
                    role: "title",
                    style: { fontSize: "display-lg", fontWeight: "extrabold", lineHeight: "tight" },
                  }),
                  t.paragraph(
                    L(
                      "منتجات مختارة بعناية بضمان وتوصيل لكل المحافظات والدفع عند الاستلام.",
                      "Carefully picked products with warranty, delivery everywhere and cash on delivery.",
                    ),
                    { role: "subtitle", style: { fontSize: "lg", maxWidth: "520px" } },
                  ),
                  t.row(
                    [
                      t.button(L("تسوّق الآن", "Shop now"), "/products", "solid", { role: "cta" }),
                      t.button(L("شوف العروض", "See offers"), "/products", "outline", { role: "secondaryCta" }),
                    ],
                    { label: L("الأزرار", "Buttons"), style: { gap: 12, marginTop: 8 } },
                  ),
                ],
                { label: L("النص", "Copy"), style: { gap: 16 } },
              ),
              t.stack(
                [
                  t.box([], {
                    label: L("دائرة زخرفية", "Accent circle"),
                    style: { position: "absolute", insetTop: "8%", insetEnd: "4%", width: "96px", minHeight: 96, radius: 999, background: "accent", zIndex: 0 },
                    mobile: { width: "64px", minHeight: 64 },
                  }),
                  t.photo(0, L("صورة المنتج", "Product photo"), {
                    role: "image",
                    style: {
                      aspectRatio: "portrait",
                      objectFit: "cover",
                      radius: 999,
                      maxWidth: "360px",
                      position: "relative",
                      zIndex: 1,
                      borderWidth: 8,
                      borderColor: "white",
                    },
                    mobile: { maxWidth: "260px" },
                  }),
                ],
                {
                  label: L("القوس", "Arch"),
                  style: { position: "relative", minHeight: 420, alignItems: "center", justifyContent: "center" },
                  mobile: { minHeight: 300 },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: {
                gap: 48,
                alignItems: "center",
                background: "secondary",
                radius: 32,
                paddingTop: 56,
                paddingBottom: 56,
                paddingStart: 56,
                paddingEnd: 56,
              },
              mobile: { gap: 32, paddingTop: 32, paddingBottom: 32, paddingStart: 20, paddingEnd: 20, radius: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
