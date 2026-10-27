/**
 * Minimal grid (Claude Design premium set, productMinimal): a centred
 * heading with collection links under it (the first bold over a short bar), then packshots framed
 * on a soft square with the name and price centred below and the cart
 * button under them. Two across on phones, five on desktop, and an outlined
 * "View all" at the foot. For drinks, cosmetics and small goods shot on
 * plain backgrounds. The links go to that sort of the shop (there is no tabs
 * element); the cart button is the store's own, not a round plus.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";
import { SHOP_LINK, priceRow, productName } from "./_shared";
import { premiumHead, premiumPhoto } from "./_premium";

const TABS = [
  { text: L("الأكثر مبيعاً", "Best sellers"), href: "/products?sort=popularity" },
  { text: L("الجديد", "New in"), href: "/products?sort=newest" },
  { text: L("الأعلى تقييمًا", "Top rated"), href: "/products?sort=rating" },
];

/** A link with no underline: the active tab is bold with a short bar under it, the others muted. */
function tab(t: TreeBuilder, text: DesignText, href: string, active: boolean): NodeTemplate {
  return t.link(
    href,
    [
      t.stack(
        [
          t.text(text, { style: { fontSize: "sm", fontWeight: active ? "bold" : "medium", textAlign: "center" } }),
          t.box([], {
            label: L("خط التبويب", "Tab bar"),
            style: { background: active ? "foreground" : "transparent", minHeight: 2, width: "100%", radius: 999 },
          }),
        ],
        { label: L("المحتوى", "Content"), style: { gap: 6 } },
      ),
    ],
    {
      label: L("تبويب", "Tab"),
      style: {
        color: active ? "foreground" : "muted",
        paddingTop: 8,
        paddingBottom: 0,
        paddingStart: 0,
        paddingEnd: 0,
        hover: { color: "foreground" },
      },
    },
  );
}

export const productsMinimal = defineDesign({
  id: "products-minimal",
  version: 1,
  category: "products",
  subcategory: "best-sellers",
  name: L("منتجات بسيطة", "Minimal grid"),
  description: L(
    "صور منتجات على مربع هادي، والاسم والسعر في المنتصف، خمسة في الصف.",
    "Packshots on a soft square with the name and price centred, five across.",
  ),
  keywords: ["products", "minimal", "packshot", "grid", "cosmetics", "drinks", "premium", "منتجات", "بسيط", "مستحضرات", "مشروبات"],
  tree: (t) =>
    t.section({ label: L("المنتجات", "Products") }, [
      t.container(
        [
          t.stack(
            [
              premiumHead(t, { title: L("الأكثر طلباً", "Top picks"), center: true }),
              t.row(
                TABS.map((x, i) => tab(t, x.text, x.href, i === 0)),
                { label: L("التبويبات", "Tabs"), role: "tabs", style: { gap: 24, justifyContent: "center" }, mobile: { gap: 18 } },
              ),
              t.productList(
                [
                  t.stack(
                    [
                      premiumPhoto(t, { ratio: "square", inset: 18, radius: 18 }),
                      t.stack([productName(t, { fontWeight: "medium", textAlign: "center" }), priceRow(t, { justifyContent: "center" })], {
                        label: L("المعلومات", "Details"),
                        style: { gap: 6, alignItems: "center" },
                      }),
                      t.row([t.addToCart({ label: L("أضف للسلة", "Add to cart") })], {
                        label: L("السلة", "Cart"),
                        style: { justifyContent: "center" },
                      }),
                    ],
                    { label: L("بطاقة المنتج", "Product card"), style: { gap: 12, textAlign: "center" } },
                  ),
                ],
                {
                  label: L("المنتجات", "Products"),
                  role: "items",
                  source: "best-sellers",
                  limit: 10,
                  columns: { desktop: 5, tablet: 3, mobile: 2 },
                  style: { gap: 24 },
                  tablet: { gap: 20 },
                  mobile: { gap: 12 },
                },
              ),
              t.row([t.button(L("عرض الكل", "View all"), SHOP_LINK, "outline", { role: "cta" })], {
                label: L("الزر", "Button"),
                style: { justifyContent: "center", paddingTop: 8 },
              }),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 28 }, mobile: { gap: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
