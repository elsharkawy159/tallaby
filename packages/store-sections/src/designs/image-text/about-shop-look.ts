/**
 * Shop the look (Claude Design premium set, shopTheLook; 2026-10-27): a tall
 * lifestyle photo with three numbered pins, and beside it the heading over
 * three store products as compact rows (photo, name, price) and one button.
 * The pins are static markers the seller moves with the position fields; a
 * tree has no pin-to-product link, so tapping a pin does not highlight its
 * product. The products come from the store (featured first). On phones the
 * photo comes first and the products swipe sideways.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type TreeBuilder } from "../builder";
import { L, N } from "../_kit";
import { priceRow, productName, productPhoto } from "../products/_shared";

const PINS = [
  { top: "38%", start: "44%" },
  { top: "70%", start: "56%" },
  { top: "62%", start: "24%" },
];

function pin(t: TreeBuilder, n: number, at: { top: string; start: string }): NodeTemplate {
  return t.box([t.text(N(String(n)), { style: { fontWeight: "bold", fontSize: "xs", lineHeight: "normal", textAlign: "center", color: "primary" } })], {
    label: L("علامة", "Pin"),
    style: {
      position: "absolute",
      insetTop: at.top,
      insetStart: at.start,
      marginTop: -14,
      marginStart: -14,
      width: "28px",
      paddingTop: 3,
      paddingBottom: 3,
      background: "background",
      borderWidth: 2,
      borderColor: "primary",
      radius: 999,
      shadow: "md",
    },
  });
}

export const aboutShopLook = defineDesign({
  id: "about-shop-look",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("تسوّق اللوك", "Shop the look"),
  description: L(
    "صورة لوك كبيرة بعلامات مرقمة، وجنبها تلات منتجات من المتجر وزر.",
    "A large look photo with numbered pins, beside three store products and a button.",
  ),
  keywords: ["shop the look", "lookbook", "shoppable", "image with text", "premium", "تسوق اللوك", "لوك", "صورة ونص"],
  tree: (t) =>
    t.section({ label: L("تسوّق اللوك", "Shop the look") }, [
      t.container(
        [
          t.grid(
            [
              t.box(
                [
                  t.photo(0, L("صورة اللوك", "Look photo"), {
                    role: "image",
                    style: { aspectRatio: "portrait", objectFit: "cover", width: "100%", radius: 0 },
                  }),
                  ...PINS.map((at, i) => pin(t, i + 1, at)),
                ],
                { label: L("الصورة", "Photo"), style: { position: "relative", overflow: "hidden", radius: 16, background: "secondary" } },
              ),
              t.stack(
                [
                  t.stack(
                    [
                      t.text(L("اللوك", "The look"), { role: "eyebrow", style: { fontSize: "sm", fontWeight: "semibold", color: "primary" } }),
                      t.heading(L("عاجي من فوق لتحت", "Ivory, head to toe"), "h2", {
                        role: "title",
                        style: { fontSize: "display-sm", lineHeight: "tight" },
                      }),
                    ],
                    { label: L("العنوان", "Heading"), role: "intro", style: { gap: 10 } },
                  ),
                  t.productList(
                    [
                      t.row(
                        [
                          t.row(
                            [
                              t.stack([productPhoto(t, { ratio: "portrait", radius: 10, chip: false })], {
                                label: L("الصورة", "Photo"),
                                style: { width: "64px" },
                              }),
                              t.stack([productName(t, { fontSize: "sm" }), priceRow(t, { gap: 6 })], {
                                label: L("المعلومات", "Details"),
                                style: { gap: 4 },
                              }),
                            ],
                            { label: L("المنتج", "Product"), style: { gap: 16, wrap: false, alignItems: "center" } },
                          ),
                          t.icon("arrow", { style: { fontSize: "md", color: "muted" } }),
                        ],
                        {
                          label: L("قطعة", "Piece"),
                          style: {
                            gap: 12,
                            wrap: false,
                            alignItems: "center",
                            justifyContent: "between",
                            paddingTop: 10,
                            paddingBottom: 10,
                            paddingStart: 10,
                            paddingEnd: 14,
                            radius: 14,
                            background: "secondary",
                          },
                        },
                      ),
                    ],
                    {
                      label: L("منتجات اللوك", "Products in the look"),
                      role: "items",
                      source: "featured",
                      limit: 3,
                      columns: { desktop: 1, tablet: 1, mobile: 1 },
                      mobileRail: true,
                      style: { gap: 10 },
                    },
                  ),
                  t.button(L("تسوّق الكل", "Shop all"), "/products", "solid", { role: "cta" }),
                ],
                { label: L("القطع", "Pieces"), style: { gap: 24, justifyContent: "center" }, mobile: { gap: 18 } },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, tablet: 2, mobile: 1 },
              style: { gap: 64, alignItems: "center" },
              tablet: { gap: 32 },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
