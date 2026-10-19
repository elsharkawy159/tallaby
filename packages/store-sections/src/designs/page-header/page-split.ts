/**
 * Split with products (Modular set): the breadcrumb, a large title, a line and
 * a link on the start side; three of the store's product photos in a staggered
 * row on the end side. For curated collections with a story.
 */
import { defineDesign } from "../builder";
import { L, arrowLink } from "../_kit";
import { PRODUCT_NAME } from "../products/_shared";
import { crumbs } from "./_crumbs";

export const pageSplit = defineDesign({
  id: "page-split",
  version: 1,
  category: "page-header",
  subcategory: "image-banner",
  name: L("نص ومنتجات", "Split with products"),
  description: L("عنوان ووصف بجانب صور ثلاث منتجات متدرجة.", "A title and description beside three staggered product photos."),
  keywords: ["page header", "collection", "curated", "gifts", "editorial", "عنوان", "مجموعة", "هدايا"],
  tree: (t) =>
    t.section({ label: L("عنوان الصفحة", "Page header") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  crumbs(t, [], L("هدايا", "Gifts")),
                  t.heading(L("هدايا بتفرّح", "Gifts that land"), "h1", {
                    role: "title",
                    style: { fontSize: "display-md", letterSpacing: "tight" },
                  }),
                  t.paragraph(L("اختارنا لك أحسن المنتجات للهدايا، كلها بتغليف هدية ببلاش.", "We picked the best gifts, all with free gift wrapping."), {
                    role: "subtitle",
                    style: { fontSize: "lg" },
                  }),
                  arrowLink(t, L("الأكثر مبيعًا", "Best sellers"), "/products"),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { gap: 16, alignItems: "start" },
                },
              ),
              t.productList(
                [
                  t.image("", PRODUCT_NAME, {
                    bind: "image",
                    style: {
                      aspectRatio: "square",
                      objectFit: "cover",
                      radius: 20,
                      width: "100%",
                      background: "secondary",
                    },
                  }),
                ],
                {
                  label: L("صور المنتجات", "Product photos"),
                  role: "items",
                  limit: 3,
                  optional: true,
                  columns: { desktop: 3, mobile: 3 },
                  style: { gap: 12, alignItems: "end" },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 48, alignItems: "center" },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
