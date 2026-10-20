/**
 * Promo header (library Cb-e): an accent rounded panel with the page title
 * large, a one-line offer and a coupon chip, and a cluster of round photos on
 * the end side (hidden on mobile).
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { crumbs } from "./_crumbs";

export const pagePromo = defineDesign({
  id: "page-promo",
  version: 1,
  category: "page-header",
  subcategory: "promo",
  name: L("رأس صفحة العروض", "Promo header"),
  description: L("لوحة ملونة بعنوان العروض وكود خصم وصور صغيرة.", "A coloured panel with the offers title, a coupon code and small photos."),
  keywords: ["sale", "offers", "page header", "coupon", "عروض", "تخفيضات", "كوبون"],
  tree: (t) =>
    t.section({ label: L("رأس العروض", "Promo header"), style: { paddingTop: 24, paddingBottom: 24 } }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  crumbs(t, [], L("العروض", "Offers"), true),
                  t.heading(L("عروض الأسبوع", "Deals of the week"), "h1", { role: "title", style: { fontSize: "display-md", fontWeight: "extrabold" } }),
                  t.paragraph(L("خصم حتى ٣٠٪ على تشكيلة مختارة.", "Up to 30% off a picked range."), {
                    role: "subtitle",
                    style: { color: "foreground", fontSize: "lg" },
                  }),
                  t.row(
                    [
                      t.icon("copy", { style: { fontSize: "sm" } }),
                      t.text(L("الكود: SALE30", "Code: SALE30"), { role: "coupon", style: { fontWeight: "bold" } }),
                    ],
                    {
                      label: L("الكوبون", "Coupon"),
                      style: {
                        gap: 6,
                        background: "foreground",
                        color: "background",
                        radius: 999,
                        paddingTop: 8,
                        paddingBottom: 8,
                        paddingStart: 16,
                        paddingEnd: 16,
                      },
                    },
                  ),
                ],
                { label: L("النص", "Copy"), style: { gap: 12, alignItems: "start" } },
              ),
              t.row(
                [0, 1, 2].map((i) =>
                  t.photo(i + 4, L("صورة", "Photo"), {
                    style: {
                      aspectRatio: "square",
                      objectFit: "cover",
                      radius: 999,
                      width: "140px",
                      borderWidth: 6,
                      borderColor: "background",
                      ...(i && { marginStart: -36 }),
                    },
                  }),
                ),
                { label: L("الصور", "Photos"), style: { justifyContent: "end", wrap: false }, mobile: { hidden: true } },
              ),
            ],
            {
              label: L("اللوحة", "Panel"),
              columns: { desktop: 2, mobile: 1 },
              style: {
                gap: 24,
                alignItems: "center",
                background: "accent",
                color: "foreground",
                radius: 28,
                paddingTop: 36,
                paddingBottom: 36,
                paddingStart: 40,
                paddingEnd: 40,
              },
              mobile: { paddingTop: 24, paddingBottom: 24, paddingStart: 20, paddingEnd: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
