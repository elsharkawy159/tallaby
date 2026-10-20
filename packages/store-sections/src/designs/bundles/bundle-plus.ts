/**
 * Plus row (O-a): up to three product tiles in one row joined by round plus
 * signs, ending in a brand total card with the bundle price, the "instead of"
 * sum, the saving and a button. The products are a list (photo, name and price
 * bound); the bundle figures are typed by the seller, since a tree cannot add
 * prices up. On mobile the plus signs go and the total card drops underneath.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND } from "../_kit";
import { modHead, pillButton } from "../_modular";
import { productName, productPhoto } from "../products/_shared";
import { BUNDLE_LINK, BUNDLE_PRICE, BUNDLE_SAVE, BUNDLE_WAS, plusDisc } from "./_shared";

export const bundlePlus = defineDesign({
  id: "bundle-plus",
  version: 1,
  category: "bundles",
  subcategory: "fixed",
  name: L("زائد ويساوي", "Plus row"),
  description: L("منتجات الباقة جنب بعض بعلامة زائد، وكارت بسعر الباقة والتوفير.", "The bundle's products joined by plus signs, and a card with the bundle price and saving."),
  keywords: ["bundles", "bundle", "kit", "buy together", "باقة", "طقم", "وفر"],
  tree: (t) =>
    t.section({ label: L("الباقة", "Bundle") }, [
      t.container(
        [
          modHead(t, { label: L("باقة", "Bundle"), title: L("اشتريهم مع بعض ووفّر", "Buy them together and save") }),
          t.grid(
            [
              t.productList(
                [
                  t.stack(
                    [
                      productPhoto(t, { ratio: "square", radius: 20, chip: false }),
                      productName(t, { fontSize: "md", fontWeight: "medium" }),
                      t.text(L("٢٥٠ ج.م", "EGP 250"), { bind: "price", style: { color: "muted", fontSize: "sm" } }),
                      plusDisc(t),
                    ],
                    { label: L("منتج", "Product"), style: { gap: 8, position: "relative" } },
                  ),
                ],
                {
                  label: L("منتجات الباقة", "Bundle products"),
                  role: "items",
                  source: "newest",
                  limit: 3,
                  columns: { desktop: 3, mobile: 3 },
                  style: { gap: 56, colSpan: 3 },
                  mobile: { gap: 8, colSpan: 1 },
                },
              ),
              t.stack(
                [
                  t.text(L("سعر الباقة", "Bundle price"), { style: { fontSize: "sm", ...ON_BRAND } }),
                  t.text(BUNDLE_PRICE, {
                    role: "value",
                    style: { fontSize: "4xl", fontWeight: "bold", letterSpacing: "tight", ...ON_BRAND },
                    mobile: { fontSize: "3xl" },
                  }),
                  t.row(
                    [
                      t.text(BUNDLE_WAS, { style: { fontSize: "sm", ...ON_BRAND, opacity: 80 } }),
                      t.badge(BUNDLE_SAVE, { style: { background: "accent", color: "foreground", fontWeight: "semibold" } }),
                    ],
                    { label: L("التوفير", "Saving"), style: { gap: 10, marginBottom: 10 } },
                  ),
                  pillButton(t, L("اطلب الباقة", "Get the bundle"), BUNDLE_LINK, {
                    icon: "shopping-bag",
                    tone: "ink",
                    style: { width: "100%" },
                  }),
                ],
                {
                  label: L("إجمالي الباقة", "Bundle total"),
                  role: "summary",
                  style: {
                    background: "primary",
                    color: "primaryInk",
                    radius: 24,
                    gap: 10,
                    justifyContent: "end",
                    alignItems: "start",
                    paddingTop: 28,
                    paddingBottom: 28,
                    paddingStart: 28,
                    paddingEnd: 28,
                  },
                  mobile: { paddingTop: 22, paddingBottom: 22, paddingStart: 22, paddingEnd: 22 },
                },
              ),
            ],
            {
              label: L("الصف", "Row"),
              columns: { desktop: 4, mobile: 1 },
              style: { gap: 56, alignItems: "stretch" },
              mobile: { gap: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
