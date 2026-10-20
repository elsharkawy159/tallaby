/**
 * Shoppable photo (library G-d): one large photo with round hotspot markers
 * on the start side, and on the end side a heading over the store products
 * in the look as compact rows (photo, name, price, cart button). The markers
 * are decoration the seller moves with the position fields; they are not tied
 * to a product, because a tree has no product-to-point link. The products
 * come from the store (featured first; "Picked by hand" lists the look).
 * Mobile puts the photo above the list.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type TreeBuilder } from "../builder";
import { L, N } from "../_kit";
import { priceRow, productName, productPhoto } from "../products/_shared";

const SPOTS = [
  { top: "28%", start: "34%" },
  { top: "56%", start: "62%" },
  { top: "74%", start: "24%" },
];

function hotspot(t: TreeBuilder, n: number, at: { top: string; start: string }): NodeTemplate {
  return t.box([t.text(N(String(n)), { style: { fontWeight: "bold", fontSize: "sm", textAlign: "center", color: "foreground" } })], {
    label: L("علامة", "Hotspot"),
    style: {
      position: "absolute",
      insetTop: at.top,
      insetStart: at.start,
      background: "background",
      radius: 999,
      width: "36px",
      paddingTop: 7,
      paddingBottom: 7,
      borderWidth: 3,
      borderColor: "accent",
      shadow: "md",
    },
  });
}

export const galleryShoppable = defineDesign({
  id: "gallery-shoppable",
  version: 1,
  category: "gallery",
  subcategory: "lookbook",
  name: L("صور قابلة للتسوق", "Shoppable photo"),
  description: L("صورة كبيرة بعلامات، وجنبها منتجات اللوك تتضاف للسلة.", "A large photo with markers, beside the products in the look, ready to add to the cart."),
  keywords: ["gallery", "shoppable", "shop the look", "lookbook", "hotspots", "معرض", "تسوق اللوك", "صورة"],
  tree: (t) =>
    t.section({ label: L("صور قابلة للتسوق", "Shoppable photo") }, [
      t.container(
        [
          t.grid(
            [
              t.box(
                [
                  t.photo(0, L("صورة اللوك", "Look photo"), {
                    role: "image",
                    style: { objectFit: "cover", width: "100%", aspectRatio: "portrait", radius: 24 },
                  }),
                  ...SPOTS.map((at, i) => hotspot(t, i + 1, at)),
                ],
                { label: L("الصورة", "Photo"), style: { position: "relative", overflow: "hidden", radius: 24 } },
              ),
              t.stack(
                [
                  t.stack(
                    [
                      t.text(L("تسوق اللوك", "Shop the look"), {
                        role: "eyebrow",
                        style: { fontSize: "sm", fontWeight: "semibold", color: "primary" },
                      }),
                      t.heading(L("كل اللي في الصورة", "Everything in the photo"), "h2", {
                        role: "title",
                        style: { fontSize: "display-sm", letterSpacing: "tight" },
                      }),
                      t.paragraph(L("اختار القطعة اللي عجبتك وضيفها للسلة على طول.", "Pick the piece you like and add it straight to your cart."), {
                        role: "subtitle",
                      }),
                    ],
                    { label: L("العنوان", "Heading"), role: "intro", style: { gap: 10 } },
                  ),
                  t.productList(
                    [
                      t.row(
                        [
                          t.stack([productPhoto(t, { radius: 12, chip: false })], {
                            label: L("الصورة", "Photo"),
                            style: { width: "72px" },
                          }),
                          t.stack([productName(t, { fontSize: "sm" }), priceRow(t, { gap: 6 })], {
                            label: L("المعلومات", "Details"),
                            style: { gap: 4, width: "50%" },
                          }),
                          t.addToCart({ label: L("أضف", "Add") }),
                        ],
                        {
                          label: L("قطعة", "Piece"),
                          style: {
                            gap: 14,
                            wrap: false,
                            alignItems: "center",
                            justifyContent: "between",
                            paddingTop: 12,
                            paddingBottom: 12,
                            borderWidth: 1,
                            borderColor: "border",
                            radius: 20,
                            paddingStart: 12,
                            paddingEnd: 14,
                            background: "background",
                          },
                          mobile: { gap: 10 },
                        },
                      ),
                    ],
                    {
                      label: L("منتجات اللوك", "Products in the look"),
                      role: "items",
                      source: "featured",
                      limit: 3,
                      columns: { desktop: 1 },
                      style: { gap: 10 },
                    },
                  ),
                ],
                { label: L("القطع", "Pieces"), style: { gap: 24, justifyContent: "center" }, mobile: { gap: 18 } },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 56, alignItems: "center" },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
