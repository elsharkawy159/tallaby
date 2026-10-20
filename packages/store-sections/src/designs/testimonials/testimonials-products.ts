/**
 * Product reviews (Modular set): review cards that open with a thumbnail and
 * the name of the product they are about, then stars, the review and the
 * reviewer. Sells products through reviews; each product row links to the
 * shop. One column on mobile.
 */
import { defineDesign } from "../builder";
import { L, PAPER_CARD, stars } from "../_kit";
import { FLUSH, modHead, who } from "../_modular";
import { REVIEWS } from "./_shared";

const PRODUCTS = [L("الطقم الكلاسيك", "Classic set"), L("الحقيبة اليومية", "Everyday bag"), L("العلبة الهدية", "Gift box"), L("الإصدار الجديد", "New edition")];

export const testimonialsProducts = defineDesign({
  id: "testimonials-products",
  version: 1,
  category: "testimonials",
  subcategory: "review-grid",
  name: L("تقييمات بالمنتج", "Product reviews"),
  description: L("كروت آراء، كل كارت فيه المنتج اللي اتكتب عليه الرأي.", "Review cards, each showing the product it is about."),
  keywords: ["testimonials", "product reviews", "cards", "آراء", "تقييمات", "منتج"],
  tree: (t) =>
    t.section({ label: L("آراء العملاء", "Testimonials") }, [
      t.container(
        [
          modHead(t, {
            label: L("تقييمات", "Reviews"),
            title: L("تقييمات على منتجات حقيقية", "Reviews on real products"),
            link: { text: L("كل المنتجات", "All products"), href: "/products" },
          }),
          t.grid(
            REVIEWS.slice(0, 4).map((r, i) =>
              t.stack(
                [
                  t.link(
                    "/products",
                    [
                      t.row(
                        [
                          t.photo(i, PRODUCTS[i]!, {
                            style: {
                              aspectRatio: "square",
                              objectFit: "cover",
                              radius: 10,
                              width: "44px",
                            },
                          }),
                          t.text(PRODUCTS[i]!, {
                            style: { fontWeight: "semibold", fontSize: "sm" },
                          }),
                          t.icon("arrow", {
                            style: { fontSize: "sm", color: "muted" },
                          }),
                        ],
                        {
                          label: L("المحتوى", "Content"),
                          style: { gap: 10, wrap: false },
                        },
                      ),
                    ],
                    {
                      label: L("المنتج", "Product"),
                      style: {
                        ...FLUSH,
                        background: "secondary",
                        radius: 14,
                        paddingTop: 6,
                        paddingBottom: 6,
                        paddingStart: 6,
                        paddingEnd: 14,
                      },
                    },
                  ),
                  stars(t, r.rating),
                  t.quote(r.text, {
                    style: { borderWidth: 0, lineHeight: "relaxed" },
                  }),
                  who(t, r.initial, r.name, r.city, i),
                ],
                {
                  label: L("رأي", "Review"),
                  style: {
                    ...PAPER_CARD,
                    gap: 14,
                    paddingTop: 18,
                    paddingBottom: 22,
                    paddingStart: 18,
                    paddingEnd: 18,
                  },
                },
              ),
            ),
            {
              label: L("الآراء", "Reviews"),
              role: "items",
              columns: { desktop: 4, tablet: 2, mobile: 1 },
              style: { gap: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
