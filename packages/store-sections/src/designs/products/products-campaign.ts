/**
 * Campaign with products (Claude Design premium set, productFeature): a big
 * campaign photo with its headline, a line and a button on a dark fade,
 * beside a hairline-ruled list of four products (photo, name, price and the
 * cart button). The photo comes first on phones. The source numbers its
 * rows; a list repeats one card per product and can't count them, so the
 * rows go without numbers.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { SHOP_LINK, priceRow, productName } from "./_shared";
import { premiumPhoto } from "./_premium";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

export const productsCampaign = defineDesign({
  id: "products-campaign",
  version: 1,
  category: "products",
  subcategory: "featured",
  name: L("حملة مع منتجات", "Campaign with products"),
  description: L(
    "صورة حملة كبيرة عليها العنوان، وجنبها قائمة بأربع منتجات.",
    "A big campaign photo with its headline, beside a list of four products.",
  ),
  keywords: ["products", "campaign", "launch", "editorial", "list", "premium", "منتجات", "حملة", "إطلاق", "قائمة"],
  tree: (t) =>
    t.section({ label: L("حملة مع منتجات", "Campaign with products") }, [
      t.container(
        [
          t.grid(
            [
              t.box(
                [
                  t.photo(3, L("صورة الحملة", "Campaign photo"), {
                    role: "image",
                    style: { aspectRatio: "landscape", objectFit: "cover", width: "100%" },
                    tablet: { aspectRatio: "portrait" },
                    mobile: { aspectRatio: "portrait" },
                  }),
                  t.box([], { label: L("التظليل", "Shade"), style: { ...FILL, gradient: "ink-fade" } }),
                  t.stack(
                    [
                      t.text(L("الخط الجديد", "The new line"), { role: "eyebrow", style: { color: "white", fontSize: "sm", fontWeight: "semibold", opacity: 85 } }),
                      t.heading(L("اختارناها لك بعناية", "Chosen with care"), "h2", {
                        role: "title",
                        style: { color: "white", fontSize: "display-sm", fontWeight: "semibold", lineHeight: "tight" },
                      }),
                      t.paragraph(L("قطع جديدة من خطنا الجديد، معمولة عشان تعيش معاك.", "New pieces from our latest line, made to last."), {
                        role: "subtitle",
                        style: { color: "white", opacity: 90, maxWidth: "420px" },
                      }),
                      t.button(L("تسوّق المجموعة", "Shop the line"), SHOP_LINK, "light", { role: "cta" }),
                    ],
                    {
                      label: L("النص", "Copy"),
                      style: { position: "absolute", insetBottom: "0px", insetStart: "0px", insetEnd: "0px", gap: 12, alignItems: "start", paddingTop: 36, paddingBottom: 36, paddingStart: 36, paddingEnd: 36 },
                      mobile: { gap: 10, paddingTop: 24, paddingBottom: 24, paddingStart: 24, paddingEnd: 24 },
                    },
                  ),
                ],
                {
                  label: L("صورة الحملة", "Campaign banner"),
                  style: { position: "relative", overflow: "hidden", radius: 24, background: "black", colSpan: 3 },
                  tablet: { colSpan: 1 },
                  mobile: { radius: 18, colSpan: 1 },
                },
              ),
              t.productList(
                [
                  t.row(
                    [
                      t.row(
                        [
                          t.stack([premiumPhoto(t, { ratio: "square", radius: 12 })], {
                            label: L("الصورة", "Photo"),
                            style: { width: "76px" },
                            mobile: { width: "64px" },
                          }),
                          t.stack([productName(t, { fontSize: "sm" }), priceRow(t, { gap: 6 })], {
                            label: L("المعلومات", "Details"),
                            style: { gap: 6 },
                          }),
                        ],
                        { label: L("المنتج", "Product"), style: { gap: 16, wrap: false, alignItems: "center" }, mobile: { gap: 12 } },
                      ),
                      t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
                    ],
                    {
                      label: L("صف المنتج", "Product row"),
                      style: { background: "background", gap: 14, wrap: false, alignItems: "center", justifyContent: "between", paddingTop: 14, paddingBottom: 14 },
                      mobile: { gap: 12, paddingTop: 12, paddingBottom: 12 },
                    },
                  ),
                ],
                {
                  label: L("المنتجات", "Products"),
                  role: "items",
                  source: "best-sellers",
                  limit: 4,
                  columns: { desktop: 1 },
                  style: { gap: 1, background: "border", paddingTop: 1, paddingBottom: 1, colSpan: 2 },
                  tablet: { colSpan: 1 },
                  mobile: { colSpan: 1 },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 5, tablet: 2, mobile: 1 },
              style: { gap: 48, alignItems: "center" },
              tablet: { gap: 28 },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
