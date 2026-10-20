/**
 * Compact rows (Modular set): two columns of compact product rows in a
 * hairline-ruled table: a 72px photo, the name, the price and the cart button.
 * For accessories and add-ons where shoppers compare prices quickly. One
 * column on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { RULED, modHead } from "../_modular";
import { SHOP_LINK, priceRow, productName, productPhoto } from "./_shared";

export const productsRows = defineDesign({
  id: "products-rows",
  version: 1,
  category: "products",
  subcategory: "list",
  name: L("صفوف مدمجة", "Compact rows"),
  description: L("صفوف منتجات صغيرة في عمودين بصورة واسم وسعر وزر.", "Small product rows in two columns with photo, name, price and button."),
  keywords: ["products", "rows", "compact", "accessories", "منتجات", "صفوف", "إكسسوارات"],
  tree: (t) =>
    t.section({ label: L("المنتجات", "Products") }, [
      t.container(
        [
          modHead(t, {
            title: L("إكسسوارات بسعر حلو", "Accessories at good prices"),
            link: { text: L("عرض الكل", "View all"), href: SHOP_LINK },
          }),
          t.productList(
            [
              t.row(
                [
                  t.stack([productPhoto(t, { radius: 12, chip: false })], {
                    label: L("الصورة", "Photo"),
                    style: { width: "72px" },
                    mobile: { width: "64px" },
                  }),
                  t.stack([productName(t, { fontSize: "sm", fontWeight: "medium" }), priceRow(t, { gap: 6 })], {
                    label: L("المعلومات", "Details"),
                    style: { gap: 6, width: "50%" },
                  }),
                  t.addToCart({ label: L("أضف", "Add") }),
                ],
                {
                  label: L("صف المنتج", "Product row"),
                  style: {
                    background: "background",
                    gap: 16,
                    wrap: false,
                    justifyContent: "between",
                    paddingTop: 14,
                    paddingBottom: 14,
                    paddingStart: 18,
                    paddingEnd: 18,
                  },
                  mobile: { gap: 12, paddingStart: 12, paddingEnd: 12 },
                },
              ),
            ],
            {
              label: L("المنتجات", "Products"),
              role: "items",
              source: "all",
              limit: 8,
              columns: { desktop: 2, mobile: 1 },
              style: RULED,
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
