/**
 * Compact list (library P-e): a title column on the start side and, on the end
 * side, two columns of slim rows (thumbnail, name, price, cart button) for
 * catalogues that shoppers scan rather than browse.
 */
import { defineDesign } from "../builder";
import { L, PAPER_CARD, arrowLink } from "../_kit";
import { SHOP_LINK, priceRow, productName, productPhoto } from "./_shared";

export const productsList = defineDesign({
  id: "products-list",
  version: 1,
  category: "products",
  subcategory: "list",
  name: L("قائمة مدمجة", "Compact list"),
  description: L("صفوف صغيرة بالصورة والاسم والسعر للكتالوج الكبير.", "Slim rows with photo, name and price for big catalogues."),
  keywords: ["products", "list", "compact", "accessories", "catalogue", "قائمة", "منتجات"],
  tree: (t) =>
    t.section({ label: L("قائمة المنتجات", "Product list") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.badge(L("الكتالوج", "Catalogue"), { role: "eyebrow", style: { color: "primary", background: "secondary" } }),
                  t.heading(L("كل الإكسسوارات", "All accessories"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.paragraph(L("كل اللي تحتاجه في مكان واحد، أصلي وبضمان.", "Everything you need in one place, genuine and guaranteed."), {
                    role: "subtitle",
                  }),
                  arrowLink(t, L("عرض الكل", "View all"), SHOP_LINK),
                ],
                {
                  label: L("العنوان", "Heading"),
                  style: { gap: 12, position: "sticky", insetTop: "96px" },
                  mobile: { position: "relative", insetTop: "0px" },
                },
              ),
              t.productList(
                [
                  t.row(
                    [
                      t.box([productPhoto(t, { radius: 12, chip: false })], {
                        label: L("الصورة", "Photo"),
                        style: { width: "72px", paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, background: "transparent" },
                      }),
                      t.stack([productName(t, { fontSize: "sm" }), priceRow(t)], { label: L("المعلومات", "Details"), style: { gap: 4, width: "100%" } }),
                      t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
                    ],
                    {
                      label: L("صف المنتج", "Product row"),
                      style: { ...PAPER_CARD, radius: 16, gap: 12, wrap: false, paddingTop: 10, paddingBottom: 10, paddingStart: 10, paddingEnd: 12 },
                    },
                  ),
                ],
                {
                  label: L("المنتجات", "Products"),
                  role: "items",
                  source: "newest",
                  limit: 10,
                  columns: { desktop: 2, mobile: 1 },
                  style: { gap: 12, colSpan: 2 },
                  mobile: { colSpan: 1 },
                },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 3, mobile: 1 }, style: { gap: 32, alignItems: "start" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
