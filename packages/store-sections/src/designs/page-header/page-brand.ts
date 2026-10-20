/**
 * Brand title (Modular set): a brand-coloured band with the collection name in
 * very large type on the start side, the count and a line on the end side, and
 * three of the store's product photos along the bottom. On mobile the photos
 * hide.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";
import { PRODUCT_NAME } from "../products/_shared";
import { crumbs } from "./_crumbs";

export const pageBrand = defineDesign({
  id: "page-brand",
  version: 1,
  category: "page-header",
  subcategory: "category-banner",
  name: L("عنوان البراند", "Brand title"),
  description: L("شريط بلون المتجر فيه اسم القسم كبير وصور منتجات.", "A brand-coloured band with the collection name large and product photos."),
  keywords: ["page header", "collection", "banner", "bold", "عنوان", "بانر", "قسم"],
  tree: (t) =>
    t.section(
      {
        label: L("عنوان الصفحة", "Page header"),
        style: {
          background: "primary",
          color: "primaryInk",
          paddingTop: 32,
          paddingBottom: 40,
        },
      },
      [
        t.container(
          [
            crumbs(t, [], L("سماعات", "Audio"), true),
            t.row(
              [
                t.heading(L("سماعات", "Audio"), "h1", {
                  role: "title",
                  style: {
                    fontSize: "display-lg",
                    letterSpacing: "tight",
                    ...ON_BRAND,
                  },
                }),
                t.stack(
                  [
                    t.text(L("٢٤ منتج", "24 products"), {
                      role: "count",
                      style: { fontWeight: "bold", ...ON_BRAND },
                    }),
                    t.paragraph(L("منتجات أصلية بضمان محلي.", "Genuine products with local warranty."), { role: "subtitle", style: ON_BRAND_BODY }),
                  ],
                  {
                    label: L("الوصف", "Description"),
                    style: { gap: 4, maxWidth: "320px" },
                  },
                ),
              ],
              {
                label: L("العنوان", "Heading"),
                style: {
                  justifyContent: "between",
                  alignItems: "end",
                  gap: 24,
                  marginTop: 20,
                },
                mobile: { direction: "column", alignItems: "start", gap: 10 },
              },
            ),
            t.productList(
              [
                t.image("", PRODUCT_NAME, {
                  bind: "image",
                  style: {
                    aspectRatio: "landscape",
                    objectFit: "cover",
                    radius: 18,
                    width: "100%",
                    background: "background",
                  },
                }),
              ],
              {
                label: L("صور المنتجات", "Product photos"),
                role: "items",
                limit: 3,
                optional: true,
                columns: { desktop: 3 },
                style: { gap: 16, marginTop: 32, maxWidth: "720px" },
                mobile: { hidden: true },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
