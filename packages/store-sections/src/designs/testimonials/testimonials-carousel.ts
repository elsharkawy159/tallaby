/**
 * Review cards with a rating summary (Claude Design premium set,
 * `reviewCarousel`; 2026-10-27): on a tinted band, a centred heading, a line
 * and the average rating with its stars, then white review cards: stars, the
 * quote, the reviewer with a "Verified buyer" line and a small row naming the
 * product reviewed. Four across on desktop, two on tablets, one column on
 * phones. The cards are written by the seller (no review data node yet), so
 * the source's swipe rail becomes a stacked column on phones.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L, stars } from "../_kit";
import { REVIEWS } from "./_shared";

const PRODUCTS = [L("الطقم الكلاسيك", "Classic set"), L("الحقيبة اليومية", "Everyday bag"), L("العلبة الهدية", "Gift box"), L("الإصدار الجديد", "New edition")];

function reviewer(t: TreeBuilder, initial: DesignText, name: DesignText): NodeTemplate {
  return t.row(
    [
      t.box([t.text(initial, { style: { fontWeight: "bold", color: "primaryInk", textAlign: "center", fontFamily: "heading" } })], {
        label: L("الصورة الرمزية", "Avatar"),
        style: { background: "primary", radius: 999, width: "40px", paddingTop: 9, paddingBottom: 9, paddingStart: 0, paddingEnd: 0 },
      }),
      t.stack(
        [
          t.text(name, { style: { fontWeight: "semibold", fontSize: "sm" } }),
          t.row([t.icon("check", { style: { fontSize: "sm", color: "primary" } }), t.text(L("مشتري مؤكد", "Verified buyer"), { style: { color: "muted", fontSize: "xs" } })], {
            label: L("موثّق", "Verified"),
            style: { gap: 4, wrap: false, alignItems: "center" },
          }),
        ],
        { label: L("الاسم", "Name"), style: { gap: 2 } },
      ),
    ],
    { label: L("صاحب الرأي", "Reviewer"), style: { gap: 10, wrap: false, alignItems: "center" } },
  );
}

export const testimonialsCarousel = defineDesign({
  id: "testimonials-carousel",
  version: 1,
  category: "testimonials",
  subcategory: "review-grid",
  name: L("تقييمات بملخص", "Reviews with summary"),
  description: L(
    "متوسط التقييم تحت العنوان، وبعده كروت آراء فيها النجوم والاسم والمنتج اللي اتقيّم.",
    "The average rating under the heading, then review cards with stars, the name and the product reviewed.",
  ),
  keywords: ["testimonials", "reviews", "rating", "verified", "cards", "premium", "آراء", "تقييمات", "نجوم", "عملاء"],
  tree: (t) =>
    t.section({ label: L("آراء العملاء", "Testimonials"), style: { background: "secondary" } }, [
      t.container(
        [
          t.stack(
            [
              t.stack(
                [
                  t.heading(L("عملاؤنا بيحبونا", "Loved by our customers"), "h2", {
                    role: "title",
                    style: { fontSize: "display-md", lineHeight: "tight", textAlign: "center" },
                    mobile: { fontSize: "3xl" },
                  }),
                  t.paragraph(L("تقييمات حقيقية من طلبات اتسلّمت.", "Real reviews from delivered orders."), {
                    role: "subtitle",
                    style: { textAlign: "center", maxWidth: "640px" },
                  }),
                  t.row(
                    [
                      t.text(L("٤٫٨", "4.8"), { role: "value", style: { fontFamily: "heading", fontWeight: "bold", fontSize: "xl" } }),
                      stars(t, 5),
                      t.text(L("متوسط تقييم عملائنا", "Our customers' average rating"), { style: { color: "muted", fontSize: "sm" } }),
                    ],
                    { label: L("ملخص التقييم", "Rating summary"), style: { gap: 10, justifyContent: "center", alignItems: "center" } },
                  ),
                ],
                { label: L("العنوان", "Heading"), role: "intro", style: { gap: 12, alignItems: "center" } },
              ),
              t.grid(
                REVIEWS.slice(0, 4).map((r, i) =>
                  t.stack(
                    [
                      stars(t, r.rating),
                      t.quote(r.text, { style: { borderWidth: 0, paddingStart: 0, paddingEnd: 0, fontSize: "md", lineHeight: "relaxed", color: "foreground" } }),
                      reviewer(t, r.initial, r.name),
                      t.divider({ label: L("فاصل", "Divider") }),
                      t.link(
                        "/products",
                        [
                          t.row(
                            [
                              t.photo(i, PRODUCTS[i]!, { style: { aspectRatio: "square", objectFit: "cover", width: "40px", radius: 8 } }),
                              t.stack(
                                [
                                  t.text(L("المنتج", "Reviewed"), { style: { color: "muted", fontSize: "xs" } }),
                                  t.text(PRODUCTS[i]!, { style: { fontWeight: "semibold", fontSize: "sm" } }),
                                ],
                                { label: L("اسم المنتج", "Product name"), style: { gap: 0 } },
                              ),
                            ],
                            { label: L("المحتوى", "Content"), style: { gap: 10, wrap: false, alignItems: "center" } },
                          ),
                        ],
                        { label: L("المنتج", "Product"), style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, color: "foreground" } },
                      ),
                    ],
                    {
                      label: L("رأي", "Review"),
                      style: { background: "background", radius: 16, gap: 14, paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20 },
                      ...(i === 3 && { mobile: { hidden: true } }),
                    },
                  ),
                ),
                { label: L("الآراء", "Reviews"), role: "items", columns: { desktop: 4, tablet: 2, mobile: 1 }, style: { gap: 16, alignItems: "stretch" } },
              ),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 32 }, mobile: { gap: 24 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
