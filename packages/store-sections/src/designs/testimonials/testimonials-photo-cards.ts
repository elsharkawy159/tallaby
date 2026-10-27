/**
 * Photo review cards (Claude Design premium set, `reviewPhotoCards`;
 * 2026-10-27): a brand-coloured band with a big centred title, then white
 * cards that pair a product photo (the reviewer's name on a dark strip at its
 * foot) with stars, the quote and the product's name and price. Two cards
 * across on desktop and tablets; on phones each card stacks its photo on top
 * and only the first two show. Photos are product shots, never people.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, stars } from "../_kit";
import { REVIEWS } from "./_shared";

const PRODUCTS = [
  { name: L("الطقم الكلاسيك", "Classic set"), price: L("٦٥٠ ج.م", "EGP 650") },
  { name: L("الحقيبة اليومية", "Everyday bag"), price: L("٨٩٠ ج.م", "EGP 890") },
  { name: L("العلبة الهدية", "Gift box"), price: L("٤٢٠ ج.م", "EGP 420") },
  { name: L("الإصدار الجديد", "New edition"), price: L("٧٤٠ ج.م", "EGP 740") },
];

export const testimonialsPhotoCards = defineDesign({
  id: "testimonials-photo-cards",
  version: 1,
  category: "testimonials",
  subcategory: "carousel",
  name: L("تقييمات بالصور", "Photo review cards"),
  description: L(
    "شريط بلون المتجر فيه كروت تجمع صورة المنتج مع رأي العميل واسم المنتج وسعره.",
    "A brand-coloured band of cards pairing a product photo with the review, the product name and its price.",
  ),
  keywords: ["testimonials", "reviews", "photo", "product", "brand", "premium", "آراء", "تقييمات", "صور", "منتج"],
  tree: (t) =>
    t.section({ label: L("آراء العملاء", "Testimonials"), style: { background: "primary" } }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("عملاؤنا بيقولوا إيه", "What our customers say"), "h2", {
                role: "title",
                style: { fontSize: "display-md", fontWeight: "bold", lineHeight: "tight", textAlign: "center", ...ON_BRAND },
                mobile: { fontSize: "3xl" },
              }),
              t.grid(
                REVIEWS.slice(0, 4).map((r, i) =>
                  t.grid(
                    [
                      t.box(
                        [
                          t.photo(i + 1, PRODUCTS[i]!.name, {
                            role: "image",
                            style: { aspectRatio: "portrait", objectFit: "cover", width: "100%" },
                            mobile: { aspectRatio: "landscape" },
                          }),
                          t.row(
                            [
                              t.icon("check", { style: { fontSize: "sm", color: "background" } }),
                              t.text(r.name, { style: { fontWeight: "semibold", fontSize: "sm", color: "background" } }),
                            ],
                            {
                              label: L("شريط الاسم", "Name strip"),
                              style: {
                                position: "absolute",
                                insetBottom: "0px",
                                insetStart: "0px",
                                insetEnd: "0px",
                                background: "foreground",
                                gap: 6,
                                wrap: false,
                                alignItems: "center",
                                paddingTop: 10,
                                paddingBottom: 10,
                                paddingStart: 12,
                                paddingEnd: 12,
                              },
                            },
                          ),
                        ],
                        { label: L("الصورة", "Photo frame"), style: { position: "relative", overflow: "hidden", radius: 14, background: "secondary" } },
                      ),
                      t.stack(
                        [
                          t.stack(
                            [
                              stars(t, r.rating),
                              t.quote(r.text, {
                                style: { borderWidth: 0, paddingStart: 0, paddingEnd: 0, fontSize: "lg", italic: false, lineHeight: "relaxed", color: "foreground" },
                                mobile: { fontSize: "md" },
                              }),
                            ],
                            { label: L("التقييم والرأي", "Rating and quote"), style: { gap: 12 } },
                          ),
                          t.stack(
                            [
                              t.text(PRODUCTS[i]!.name, { style: { fontWeight: "semibold", fontSize: "sm" } }),
                              t.text(PRODUCTS[i]!.price, { style: { color: "muted", fontSize: "sm" } }),
                            ],
                            { label: L("المنتج", "Product"), style: { gap: 2 } },
                          ),
                        ],
                        {
                          label: L("الرأي", "Review"),
                          style: { gap: 12, justifyContent: "between", paddingTop: 12, paddingBottom: 8, paddingEnd: 8 },
                          mobile: { paddingTop: 4, paddingStart: 8, paddingBottom: 12 },
                        },
                      ),
                    ],
                    {
                      label: L("كارت", "Card"),
                      columns: { desktop: 2, tablet: 2, mobile: 1 },
                      style: { background: "background", color: "foreground", radius: 20, gap: 14, paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 },
                      ...(i > 1 && { mobile: { hidden: true } }),
                    },
                  ),
                ),
                { label: L("الآراء", "Reviews"), role: "items", columns: { desktop: 2, tablet: 2, mobile: 1 }, style: { gap: 16 }, tablet: { gap: 12 } },
              ),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 32 }, mobile: { gap: 24 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
