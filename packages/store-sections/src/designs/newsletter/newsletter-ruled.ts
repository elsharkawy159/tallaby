/**
 * Ruled bar (Modular set): one hairline-ruled band with two cells: the offer
 * on the start side and the store's sign-up form on the end side. A slim
 * sign-up line above the footer; the cells stack on mobile.
 *
 * v2 (look-first pilot, F-89): no box. Two hairlines hold a large title with
 * one line under it, and the form sits on one row (email, name, button) with
 * the consent line small underneath; it stacks on phones. Same nodes, labels
 * and copy as v1.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const newsletterRuled = defineDesign({
  id: "newsletter-ruled",
  version: 2,
  category: "newsletter",
  subcategory: "panel",
  name: L("شريط مقسم", "Ruled bar"),
  description: L(
    "شريط رفيع بين خطين فيه العرض ونموذج الاشتراك في سطر واحد.",
    "A slim band between two hairlines with the offer and a one-row sign-up form.",
  ),
  keywords: [
    "newsletter",
    "subscribe",
    "bar",
    "ruled",
    "minimal",
    "inline",
    "نشرة",
    "اشتراك",
  ],
  tree: (t) =>
    t.section(
      {
        label: L("النشرة", "Newsletter"),
        style: { paddingTop: 32, paddingBottom: 32 },
      },
      [
        t.container(
          [
            t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
            t.grid(
              [
                t.stack(
                  [
                    t.heading(
                      L(
                        "خد ١٠٪ خصم على أول طلب",
                        "Get 10% off your first order",
                      ),
                      "h2",
                      {
                        role: "title",
                        style: {
                          fontSize: "display-sm",
                          letterSpacing: "tight",
                          lineHeight: "tight",
                          maxWidth: "18ch",
                        },
                        motion: { reveal: "words" },
                      },
                    ),
                    t.text(
                      L(
                        "عروض للمشتركين بس، مرة في الأسبوع.",
                        "Members-only offers, once a week.",
                      ),
                      {
                        role: "subtitle",
                        style: {
                          color: "muted",
                          fontSize: "md",
                          maxWidth: "44ch",
                        },
                      },
                    ),
                  ],
                  {
                    label: L("العرض", "Offer"),
                    style: { gap: 12, justifyContent: "center" },
                    motion: { reveal: "none" },
                  },
                ),
                t.stack([t.storeForm({ layout: "inline" })], {
                  label: L("النموذج", "Form cell"),
                  style: { justifyContent: "center" },
                }),
              ],
              {
                label: L("الشريط", "Bar"),
                columns: { desktop: 2, tablet: 1, mobile: 1 },
                style: {
                  gap: 64,
                  alignItems: "center",
                  paddingTop: 56,
                  paddingBottom: 56,
                },
                tablet: { gap: 28, paddingTop: 44, paddingBottom: 44 },
                mobile: { gap: 24, paddingTop: 36, paddingBottom: 36 },
              },
            ),
            t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
