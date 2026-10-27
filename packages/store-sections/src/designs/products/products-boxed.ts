/**
 * Boxed cards (Claude Design premium set, productBoxed): white bordered
 * product cards on a tinted band, each with its photo on white, the sale
 * chip and wishlist heart, the rating, name and price, and the cart button
 * across the foot. The heading sits at the start with "View all" at the end.
 * On phones the cards swipe sideways with the next one peeking in. For stores
 * where shoppers compare and add straight from the home page.
 */
import { defineDesign } from "../builder";
import { L, PAPER_CARD } from "../_kit";
import { SHOP_LINK, priceRow, productName } from "./_shared";
import { premiumHead, premiumPhoto, ratingLine } from "./_premium";

export const productsBoxed = defineDesign({
  id: "products-boxed",
  version: 1,
  category: "products",
  subcategory: "best-sellers",
  name: L("كروت منتجات", "Boxed cards"),
  description: L(
    "كروت بيضاء بإطار على شريط ملوّن، فيها التقييم والسعر وزر أضف للسلة.",
    "White bordered cards on a tinted band, with rating, price and an add-to-cart button.",
  ),
  keywords: ["products", "cards", "boxed", "marketplace", "rating", "premium", "منتجات", "كروت", "تقييم", "سلة"],
  tree: (t) =>
    t.section({ label: L("المنتجات", "Products"), style: { background: "secondary" } }, [
      t.container(
        [
          t.stack(
            [
              premiumHead(t, { title: L("أساسيات كل يوم", "Everyday essentials"), link: { href: SHOP_LINK } }),
              t.productList(
                [
                  t.stack(
                    [
                      premiumPhoto(t, { ratio: "square", inset: 14, radius: 14, frame: "background", wishlist: true }),
                      t.stack([ratingLine(t), productName(t, { fontWeight: "medium" }), priceRow(t)], {
                        label: L("المعلومات", "Details"),
                        style: { gap: 6, paddingStart: 4, paddingEnd: 4 },
                      }),
                      t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
                    ],
                    {
                      label: L("بطاقة المنتج", "Product card"),
                      style: { ...PAPER_CARD, radius: 18, gap: 12, paddingTop: 10, paddingBottom: 14, paddingStart: 10, paddingEnd: 10, hover: { shadow: "md" } },
                    },
                  ),
                ],
                {
                  label: L("المنتجات", "Products"),
                  role: "items",
                  source: "best-sellers",
                  limit: 8,
                  columns: { desktop: 4, tablet: 3, mobile: 2 },
                  mobileRail: true,
                  style: { gap: 20 },
                  tablet: { gap: 16 },
                  mobile: { gap: 12 },
                },
              ),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 28 }, mobile: { gap: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
