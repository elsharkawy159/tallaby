/**
 * Feature and four (library P-c): one featured product large on a soft panel
 * on the start side, and a 2×2 grid of newer products beside it. Without a featured product the
 * grid shows alone.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { priceRow, productCard, productName, productPhoto } from "./_shared";

export const productsFeature = defineDesign({
  id: "products-feature",
  version: 1,
  category: "products",
  subcategory: "featured",
  name: L("منتج مميز وأربعة", "Feature and four"),
  description: L("منتج مميز كبير وبجانبه أربعة منتجات.", "One featured product large, with four more beside it."),
  keywords: ["products", "featured", "spotlight", "منتج مميز", "منتجات"],
  tree: (t) =>
    t.section({ label: L("منتج مميز", "Featured product") }, [
      t.container(
        [
          sectionHead(t, { title: L("اختيارنا ليك", "Picked for you") }),
          t.grid(
            [
              t.productList(
                [
                  t.stack(
                    [
                      t.badge(L("اختيار الأسبوع", "Pick of the week"), { role: "eyebrow", style: { background: "background", color: "primary" } }),
                      productPhoto(t, { ratio: "landscape", radius: 20, chip: false }),
                      productName(t, { fontSize: "xl" }),
                      priceRow(t),
                      t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
                    ],
                    {
                      label: L("المنتج المميز", "Featured product"),
                      style: { gap: 14, background: "secondary", radius: 24, paddingTop: 24, paddingBottom: 24, paddingStart: 24, paddingEnd: 24 },
                    },
                  ),
                ],
                { label: L("المنتج المميز", "Featured product"), source: "featured", limit: 1, optional: true, columns: { desktop: 1 } },
              ),
              t.productList([productCard(t)], {
                label: L("منتجات أخرى", "More products"),
                role: "items",
                source: "newest",
                limit: 4,
                columns: { desktop: 2, mobile: 2 },
                style: { gap: 16 },
                mobile: { gap: 12 },
              }),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 24, alignItems: "start" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
