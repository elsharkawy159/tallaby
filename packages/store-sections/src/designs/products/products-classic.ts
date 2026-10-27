/**
 * Classic product grid (library P, Classic template): eyebrow and heading with
 * "view all", then white bordered cards (photo well with the sale chip, name,
 * price with the list price, and the cart button), 4 across.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { SHOP_LINK, productCard } from "./_shared";

export const productsClassic = defineDesign({
  id: "products-classic",
  version: 1,
  category: "products",
  subcategory: "new-arrivals",
  name: L("منتجات كلاسيك", "Classic product grid"),
  description: L("أحدث منتجاتك في بطاقات بيضاء بالسعر وزر السلة.", "Your newest products in white cards with price and cart button."),
  keywords: ["products", "grid", "classic", "new", "منتجات", "كلاسيك", "جديد"],
  tree: (t) =>
    t.section({ label: L("المنتجات", "Products") }, [
      t.container(
        [
          sectionHead(t, { eyebrow: L("جديدنا", "Just in"), title: L("وصل حديثًا", "New arrivals"), link: { href: SHOP_LINK } }),
          t.productList([productCard(t)], {
            label: L("المنتجات", "Products"),
            role: "items",
            source: "newest",
            limit: 8,
            columns: { desktop: 4, tablet: 3, mobile: 2 },
            mobileRail: true,
            style: { gap: 20 },
            mobile: { gap: 12 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
