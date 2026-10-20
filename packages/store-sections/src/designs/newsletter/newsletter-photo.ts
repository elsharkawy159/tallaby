/**
 * Photo split (library N-c): a white rounded card split in two, a lifestyle
 * photo filling the start half and the title, a line, the store's form and a
 * note on the end half. On mobile the photo becomes a band on top.
 */
import { defineDesign } from "../builder";
import { L, PAPER_CARD } from "../_kit";

export const newsletterPhoto = defineDesign({
  id: "newsletter-photo",
  version: 1,
  category: "newsletter",
  subcategory: "image",
  name: L("صورة ونموذج", "Photo split"),
  description: L("صورة من متجرك بجانب نموذج الاشتراك.", "A photo from your store beside the sign-up form."),
  keywords: ["newsletter", "photo", "subscribe", "نشرة", "صورة", "اشتراك"],
  tree: (t) =>
    t.section({ label: L("النشرة", "Newsletter") }, [
      t.container(
        [
          t.grid(
            [
              t.photo(3, L("صورة من المتجر", "A photo from the store"), {
                style: { aspectRatio: "square", objectFit: "cover", width: "100%", minHeight: 320 },
                mobile: { aspectRatio: "wide", minHeight: 200 },
              }),
              t.stack(
                [
                  t.badge(L("للمشتركين", "Members"), { role: "eyebrow", style: { color: "primary", background: "secondary" } }),
                  t.heading(L("خد ١٠٪ خصم على أول طلب", "Get 10% off your first order"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.paragraph(L("اشترك عشان توصلك المنتجات الجديدة والعروض الخاصة.", "Join the list for new arrivals and members-only offers."), {
                    role: "subtitle",
                  }),
                  t.storeForm(),
                  t.text(L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."), { style: { color: "muted", fontSize: "xs" } }),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { gap: 14, justifyContent: "center", paddingTop: 40, paddingBottom: 40, paddingStart: 40, paddingEnd: 40 },
                  mobile: { paddingTop: 24, paddingBottom: 24, paddingStart: 20, paddingEnd: 20 },
                },
              ),
            ],
            {
              label: L("البطاقة", "Card"),
              columns: { desktop: 2, mobile: 1 },
              style: { ...PAPER_CARD, radius: 28, overflow: "hidden", gap: 0, alignItems: "stretch" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
