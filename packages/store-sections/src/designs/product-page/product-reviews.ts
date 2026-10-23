/**
 * Reviews and questions: a section heading over the product's reviews (and,
 * on the storefront, its questions). The rating near the price links here.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";

export const productReviews = defineDesign({
  id: "product-reviews",
  version: 1,
  category: "product-page",
  subcategory: "details",
  name: L("التقييمات والأسئلة", "Reviews and questions"),
  description: L("تقييمات العملاء وأسئلتهم عن المنتج، تحت عنوان للقسم.", "Customer reviews and questions about the product, under a section heading."),
  keywords: ["product page", "reviews", "ratings", "questions", "صفحة المنتج", "تقييمات", "آراء", "أسئلة"],
  tree: (t) =>
    t.section(
      {
        label: L("التقييمات", "Reviews"),
        style: { paddingTop: 48, paddingBottom: 48 },
        mobile: { paddingTop: 32, paddingBottom: 32 },
      },
      [
        t.container(
          [
            t.stack(
              [
                sectionHead(t, {
                  title: L("رأي اللي جربوه", "What buyers say"),
                  subtitle: L("تقييمات وأسئلة العملاء عن المنتج ده.", "Customer reviews and questions about this product."),
                  size: "3xl",
                }),
                t.productReviews({ label: L("التقييمات والأسئلة", "Reviews and questions") }),
              ],
              { label: L("العمود", "Column"), style: { gap: 24 }, mobile: { gap: 20 } },
            ),
          ],
          { label: L("الحاوية", "Container"), style: { maxWidth: "960px" } },
        ),
      ],
    ),
});
