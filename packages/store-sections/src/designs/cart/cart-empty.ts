/**
 * Empty cart (library J-b): a centred moment with a large shelf circle
 * holding the bag icon, a friendly title and line, a "start shopping" button
 * and the store's categories as chips to restart browsing. The storefront
 * cart page is not a builder page, so this is a landing section, for example
 * on a page the cart links to; the chips come from the store and the section
 * still shows without categories. Same layout on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, pillButton } from "../_modular";
import { CATEGORY_LINK } from "../categories/_shared";
import { SHOP_LINK } from "../products/_shared";

export const cartEmpty = defineDesign({
  id: "cart-empty",
  version: 1,
  category: "cart",
  subcategory: "empty",
  name: L("السلة فاضية", "Empty cart"),
  description: L("دائرة بأيقونة السلة وجملة لطيفة وزر تسوق وأقسام المتجر.", "A bag icon in a circle, a friendly line, a shop button and the store's categories."),
  keywords: ["cart", "empty", "empty state", "start shopping", "سلة", "فاضية", "ابدأ التسوق"],
  tree: (t) =>
    t.section({ label: L("السلة فاضية", "Empty cart") }, [
      t.container(
        [
          t.stack(
            [
              t.box([t.icon("shopping-bag", { style: { fontSize: "5xl", color: "foreground" } })], {
                label: L("أيقونة السلة", "Bag icon"),
                style: { background: "secondary", radius: 999, width: "128px", paddingTop: 34, paddingBottom: 30, textAlign: "center" },
                mobile: { width: "104px", paddingTop: 26, paddingBottom: 22 },
              }),
              t.heading(L("السلة لسه فاضية", "Your cart is empty"), "h2", {
                role: "title",
                style: { fontSize: "display-sm", letterSpacing: "tight", textAlign: "center" },
              }),
              t.paragraph(L("يلا نملاها بحاجات حلوة.", "Let's fill it with something good."), {
                role: "subtitle",
                style: { textAlign: "center" },
              }),
              pillButton(t, L("ابدأ التسوق", "Start shopping"), SHOP_LINK, { style: { marginTop: 4 } }),
              t.categoryList(
                [
                  t.link(CATEGORY_LINK, [t.text(L("اسم القسم", "Category"), { bind: "name", style: { fontWeight: "semibold", fontSize: "sm", textAlign: "center" } })], {
                    label: L("شريحة القسم", "Category chip"),
                    bind: "href",
                    style: {
                      ...FLUSH,
                      paddingTop: 10,
                      paddingBottom: 10,
                      paddingStart: 16,
                      paddingEnd: 16,
                      radius: 999,
                      borderWidth: 1,
                      borderColor: "border",
                      hover: { borderColor: "primary" },
                    },
                  }),
                ],
                {
                  label: L("الأقسام", "Categories"),
                  role: "items",
                  limit: 5,
                  optional: true,
                  columns: { desktop: 5, tablet: 3, mobile: 2 },
                  style: { gap: 8, width: "100%", marginTop: 12 },
                },
              ),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 14, alignItems: "center" } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "680px" } },
      ),
    ]),
});
