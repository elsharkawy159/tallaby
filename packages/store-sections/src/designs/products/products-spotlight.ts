/**
 * Collection spotlight (Claude Design premium set, collectionSpotlight): a
 * tall collection photo with its name, a line and a button on a dark fade,
 * beside a row of that collection's products. On phones and tablets the
 * photo becomes a wide banner above the row, and the row swipes sideways on
 * phones. The list shows the newest products until the seller points it at
 * a category.
 */
import { defineDesign } from "../builder";
import { L, arrowLink } from "../_kit";
import { SHOP_LINK } from "./_shared";
import { plainCard } from "./_premium";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

export const productsSpotlight = defineDesign({
  id: "products-spotlight",
  version: 1,
  category: "products",
  subcategory: "featured",
  name: L("مجموعة مميزة", "Collection spotlight"),
  description: L(
    "صورة طويلة لمجموعة عليها اسمها وزر، وجنبها صف من منتجاتها.",
    "A tall collection photo with its name and a button, beside a row of its products.",
  ),
  keywords: ["products", "collection", "spotlight", "editorial", "banner", "premium", "منتجات", "مجموعة", "مميزة", "بانر"],
  tree: (t) =>
    t.section({ label: L("مجموعة مميزة", "Collection spotlight") }, [
      t.container(
        [
          t.grid(
            [
              t.box(
                [
                  t.photo(2, L("صورة المجموعة", "Collection photo"), {
                    role: "image",
                    style: { aspectRatio: "portrait", objectFit: "cover", width: "100%" },
                    tablet: { aspectRatio: "wide" },
                    mobile: { aspectRatio: "landscape" },
                  }),
                  t.box([], { label: L("التظليل", "Shade"), style: { ...FILL, gradient: "ink-fade" } }),
                  t.stack(
                    [
                      t.text(L("مجموعة", "Collection"), { role: "eyebrow", style: { color: "white", fontSize: "sm", fontWeight: "semibold", opacity: 85 } }),
                      t.heading(L("مجموعة الموسم", "The season’s edit"), "h2", {
                        role: "title",
                        style: { color: "white", fontSize: "3xl", fontWeight: "semibold", lineHeight: "tight" },
                        mobile: { fontSize: "2xl" },
                      }),
                      t.paragraph(L("قطع مختارة بعناية، بخامات حلوة وتفاصيل هادية.", "Hand-picked pieces in good materials and quiet details."), {
                        role: "subtitle",
                        style: { color: "white", opacity: 90, maxWidth: "360px" },
                      }),
                      t.button(L("تسوّق المجموعة", "Shop the collection"), SHOP_LINK, "light", { role: "cta" }),
                    ],
                    {
                      label: L("النص", "Copy"),
                      style: { position: "absolute", insetBottom: "0px", insetStart: "0px", insetEnd: "0px", gap: 10, alignItems: "start", paddingTop: 28, paddingBottom: 28, paddingStart: 28, paddingEnd: 28 },
                      mobile: { gap: 8, paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20 },
                    },
                  ),
                ],
                {
                  label: L("صورة المجموعة", "Collection banner"),
                  style: { position: "relative", overflow: "hidden", radius: 20, background: "black" },
                  mobile: { radius: 16 },
                },
              ),
              t.stack(
                [
                  t.row(
                    [
                      t.text(L("من المجموعة", "From the collection"), { label: L("عنوان الصف", "Row title"), style: { fontSize: "lg", fontWeight: "semibold" } }),
                      arrowLink(t, L("عرض الكل", "View all"), SHOP_LINK, { style: { color: "foreground" } }),
                    ],
                    { label: L("رأس الصف", "Row head"), style: { justifyContent: "between", alignItems: "center", gap: 12 } },
                  ),
                  t.productList([plainCard(t)], {
                    label: L("المنتجات", "Products"),
                    role: "items",
                    source: "newest",
                    limit: 3,
                    columns: { desktop: 3, tablet: 3, mobile: 2 },
                    mobileRail: true,
                    style: { gap: 20 },
                    tablet: { gap: 16 },
                    mobile: { gap: 12 },
                  }),
                ],
                { label: L("صف المنتجات", "Product row"), style: { gap: 20, colSpan: 2 }, tablet: { colSpan: 1 }, mobile: { gap: 16, colSpan: 1 } },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 3, tablet: 1, mobile: 1 },
              style: { gap: 28, alignItems: "center" },
              tablet: { gap: 24 },
              mobile: { gap: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
