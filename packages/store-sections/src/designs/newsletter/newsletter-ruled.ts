/**
 * Ruled bar (Modular set): one hairline-ruled bar with two cells: the offer on
 * the start side and the store's sign-up form on the end side. A slim sign-up
 * line above the footer; the cells stack on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { RULED, RULED_CELL } from "../_modular";

export const newsletterRuled = defineDesign({
  id: "newsletter-ruled",
  version: 1,
  category: "newsletter",
  subcategory: "panel",
  name: L("شريط مقسم", "Ruled bar"),
  description: L("شريط رفيع بخطوط فيه العرض ونموذج الاشتراك.", "A slim ruled bar with the offer and the sign-up form."),
  keywords: ["newsletter", "subscribe", "bar", "ruled", "minimal", "نشرة", "اشتراك"],
  tree: (t) =>
    t.section(
      {
        label: L("النشرة", "Newsletter"),
        style: { paddingTop: 32, paddingBottom: 32 },
      },
      [
        t.container(
          [
            t.grid(
              [
                t.stack(
                  [
                    t.heading(L("خد ١٠٪ خصم على أول طلب", "Get 10% off your first order"), "h2", { role: "title", style: { fontSize: "2xl" } }),
                    t.text(L("عروض للمشتركين بس، مرة في الأسبوع.", "Members-only offers, once a week."), {
                      role: "subtitle",
                      style: { color: "muted", fontSize: "sm" },
                    }),
                  ],
                  {
                    label: L("العرض", "Offer"),
                    style: {
                      ...RULED_CELL,
                      gap: 4,
                      justifyContent: "center",
                      paddingTop: 24,
                      paddingBottom: 24,
                      paddingStart: 28,
                      paddingEnd: 28,
                    },
                  },
                ),
                t.stack([t.storeForm()], {
                  label: L("النموذج", "Form cell"),
                  style: {
                    ...RULED_CELL,
                    justifyContent: "center",
                    paddingTop: 20,
                    paddingBottom: 20,
                    paddingStart: 24,
                    paddingEnd: 24,
                  },
                }),
              ],
              {
                label: L("الشريط", "Bar"),
                columns: { desktop: 2, mobile: 1 },
                style: RULED,
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
