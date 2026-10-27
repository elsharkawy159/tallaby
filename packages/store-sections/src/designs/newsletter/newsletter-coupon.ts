/**
 * Welcome coupon (library N-e): an accent panel with a giant "10%" set like a
 * sticker on the start side and the title, a line and the store's form on the
 * end side. The code itself goes in the form's success message, so it shows
 * only after sign-up.
 */
import { defineDesign } from "../builder";
import { L, N } from "../_kit";

export const newsletterCoupon = defineDesign({
  id: "newsletter-coupon",
  version: 1,
  category: "newsletter",
  subcategory: "coupon",
  name: L("كوبون الترحيب", "Welcome coupon"),
  description: L("خصم ترحيب كبير بجانب نموذج الاشتراك.", "A big welcome discount beside the sign-up form."),
  keywords: ["newsletter", "coupon", "welcome", "discount", "نشرة", "كوبون", "خصم"],
  tree: (t) =>
    t.section({ label: L("كوبون الترحيب", "Welcome coupon") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(N("10%"), "h3", { role: "value", style: { fontSize: "6xl", fontWeight: "extrabold", lineHeight: "tight", color: "primary" } }),
                  t.text(L("خصم", "off"), { style: { fontWeight: "bold", fontSize: "xl" } }),
                ],
                {
                  label: L("الملصق", "Sticker"),
                  style: {
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0,
                    background: "background",
                    radius: 999,
                    width: "220px",
                    minHeight: 220,
                    shadow: "md",
                  },
                  mobile: { width: "160px", minHeight: 160 },
                },
              ),
              t.stack(
                [
                  t.heading(L("خصم الترحيب ليك", "Your welcome discount"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.paragraph(L("اشترك وهيظهرلك الكود على طول.", "Subscribe and the code shows right away."), {
                    role: "subtitle",
                    style: { color: "foreground" },
                  }),
                  t.storeForm(),
                ],
                { label: L("النص", "Copy"), style: { gap: 12, colSpan: 2 }, mobile: { colSpan: 1 } },
              ),
            ],
            {
              label: L("اللوحة", "Panel"),
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 32, alignItems: "center", background: "accent", radius: 28, paddingTop: 40, paddingBottom: 40, paddingStart: 40, paddingEnd: 40 },
              mobile: { paddingTop: 24, paddingBottom: 24, paddingStart: 20, paddingEnd: 20, gap: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
