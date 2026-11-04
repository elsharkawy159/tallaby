/**
 * Cross-sell offers (ROADMAP.md F-32d): the seller's "Frequently bought with"
 * offers for the page's product, on a band of their own. The section has no
 * padding and the space sits on the element, because a product with no offers
 * draws nothing and must not leave an empty band.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const productCrossSell = defineDesign({
  id: "product-cross-sell",
  version: 1,
  category: "product-page",
  subcategory: "details",
  name: L("عروض مع المنتج", "Offers with the product"),
  description: L("عروض «بيتشتري مع» اللي حددتها للمنتج، بخصم. مش بتظهر لو المنتج مالوش عروض.", "The \"bought with\" offers you set for the product, at a discount. Nothing shows when it has none."),
  keywords: ["product page", "cross-sell", "offers", "upsell", "bought together", "صفحة المنتج", "عروض", "بيتشتري مع", "خصم"],
  tree: (t) =>
    t.section({ label: L("العروض", "Offers"), style: { paddingTop: 0, paddingBottom: 0 } }, [
      t.container(
        [
          t.productCrossSell({
            label: L("عروض مع المنتج", "Offers with the product"),
            style: { marginTop: 24, marginBottom: 24 },
          }),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "960px" } },
      ),
    ]),
});
