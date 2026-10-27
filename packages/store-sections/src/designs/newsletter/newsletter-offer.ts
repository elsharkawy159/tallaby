/**
 * Sign-up offer (Claude Design premium set, `newsletterOffer`; 2026-10-27): a
 * tinted rounded block split in two, a product photo on the start half and
 * on the end half a coupon-style ticket with the offer in big type, a line,
 * the store's sign-up form and a small note. The code goes in the form's
 * success message, so it shows only after sign-up. A discount design:
 * templates leave it out (`templates/no-discounts.ts`). Photo on top on
 * phones.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const newsletterOffer = defineDesign({
  id: "newsletter-offer",
  version: 1,
  category: "newsletter",
  subcategory: "coupon",
  name: L("خصم للمشتركين", "Sign-up offer"),
  description: L("صورة منتج جنب كوبون فيه الخصم الكبير ونموذج الاشتراك.", "A product photo beside a coupon with a big offer and the sign-up form."),
  keywords: ["newsletter", "coupon", "offer", "discount", "first order", "premium", "نشرة", "كوبون", "خصم", "أول طلب"],
  tree: (t) =>
    t.section({ label: L("خصم للمشتركين", "Sign-up offer") }, [
      t.container(
        [
          t.grid(
            [
              t.photo(5, L("صورة منتج", "A product photo"), {
                role: "image",
                style: { aspectRatio: "landscape", objectFit: "cover", width: "100%", minHeight: 460 },
                tablet: { minHeight: 420 },
                mobile: { minHeight: 220 },
              }),
              t.stack(
                [
                  t.stack(
                    [
                      t.heading(L("خصم ١٠٪", "10% OFF"), "h2", {
                        role: "title",
                        style: { fontSize: "display-md", fontWeight: "extrabold", lineHeight: "snug", color: "primary", textAlign: "center" },
                        mobile: { fontSize: "4xl" },
                      }),
                      t.text(L("على أول طلب", "on your first order"), {
                        role: "subtitle",
                        style: { fontFamily: "heading", fontWeight: "semibold", fontSize: "lg", textAlign: "center" },
                      }),
                    ],
                    {
                      label: L("الكوبون", "Coupon"),
                      style: {
                        background: "background",
                        borderWidth: 2,
                        borderColor: "primary",
                        radius: 16,
                        gap: 8,
                        alignItems: "center",
                        paddingTop: 20,
                        paddingBottom: 20,
                        paddingStart: 18,
                        paddingEnd: 18,
                      },
                    },
                  ),
                  t.paragraph(L("اشترك والكود هيظهرلك على طول.", "Sign up and your code shows right away."), {
                    role: "body",
                    style: { textAlign: "center" },
                  }),
                  t.storeForm({ formTemplate: "newsletter", style: { width: "100%" } }),
                  t.text(L("كود واحد لكل عميل. من غير رسائل مزعجة.", "One code per customer. No spam."), {
                    style: { color: "muted", fontSize: "xs", textAlign: "center" },
                  }),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { gap: 14, justifyContent: "center", paddingTop: 48, paddingBottom: 48, paddingStart: 56, paddingEnd: 56 },
                  tablet: { paddingStart: 28, paddingEnd: 28 },
                  mobile: { paddingTop: 24, paddingBottom: 28, paddingStart: 20, paddingEnd: 20 },
                },
              ),
            ],
            {
              label: L("البطاقة", "Card"),
              columns: { desktop: 2, tablet: 2, mobile: 1 },
              style: { background: "secondary", radius: 24, overflow: "hidden", gap: 0, alignItems: "stretch" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
