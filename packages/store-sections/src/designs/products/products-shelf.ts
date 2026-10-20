/**
 * Shop your way (library P-d): a centred eyebrow over three pill links (new,
 * best sellers, on sale) and a 3-column grid of tall cards. The library's
 * tabs are links here, so the shelf works without scripts.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { SHOP_LINK, productCard } from "./_shared";

const PILLS = [L("وصل جديد", "New in"), L("الأكثر مبيعًا", "Best sellers"), L("عليه خصم", "On sale")];

export const productsShelf = defineDesign({
  id: "products-shelf",
  version: 1,
  category: "products",
  subcategory: "shelf",
  name: L("تسوّق حسب مزاجك", "Shop your way"),
  description: L("روابط سريعة بشكل أزرار فوق شبكة منتجات طولية.", "Quick pill links over a grid of tall product cards."),
  keywords: ["products", "tabs", "shelf", "pills", "منتجات", "تبويبات"],
  tree: (t) =>
    t.section({ label: L("رف المنتجات", "Product shelf") }, [
      t.container(
        [
          t.stack(
            [
              t.badge(L("تسوّق حسب مزاجك", "Shop your way"), { role: "eyebrow", style: { color: "primary", background: "secondary" } }),
              t.row(
                PILLS.map((pill, i) =>
                  t.link(SHOP_LINK, [t.text(pill, { style: { fontWeight: "semibold", ...(i === 0 && { color: "primaryInk" }) } })], {
                    label: L("رابط", "Link"),
                    style: {
                      paddingTop: 10,
                      paddingBottom: 10,
                      paddingStart: 20,
                      paddingEnd: 20,
                      radius: 999,
                      background: i === 0 ? "primary" : "background",
                      borderWidth: 1,
                      borderColor: i === 0 ? "primary" : "border",
                    },
                  }),
                ),
                { label: L("الروابط", "Links"), style: { gap: 8, justifyContent: "center" } },
              ),
            ],
            { label: L("العنوان", "Heading"), style: { gap: 16, alignItems: "center", marginBottom: 32 } },
          ),
          t.productList([productCard(t, { ratio: "portrait", bordered: false })], {
            label: L("المنتجات", "Products"),
            role: "items",
            source: "newest",
            limit: 6,
            columns: { desktop: 3, mobile: 2 },
            style: { gap: 24 },
            mobile: { gap: 12 },
          }),
          t.stack([t.button(L("كل المنتجات", "View all products"), SHOP_LINK, "outline", { role: "cta" })], {
            label: L("الزر", "Button"),
            style: { alignItems: "center", marginTop: 32 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
