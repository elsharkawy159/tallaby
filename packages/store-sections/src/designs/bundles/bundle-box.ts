/**
 * In the box (O-f): a shelf "box" holding the products as paper tiles, and
 * beside it a ruled legend with each product's own name and price, then the
 * typed full value against what you pay and a button. For gift sets where
 * every piece matters. The design's numbered tiles are drawn as ticks: a list
 * repeats one item template, so it cannot count. Mobile puts the box on top.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, dotLabel, pillButton } from "../_modular";
import { SHOP_LINK } from "../products/_shared";
import { BUNDLE_LINK, BUNDLE_PRICE } from "./_shared";

export const bundleBox = defineDesign({
  id: "bundle-box",
  version: 1,
  category: "bundles",
  subcategory: "gift",
  name: L("محتويات العلبة", "In the box"),
  description: L("صور قطع العلبة وجنبها قائمة بأسعارها وسعر العلبة.", "The pieces of a gift box beside a list of their prices and the box price."),
  keywords: ["bundles", "gift box", "gift set", "what's inside", "باقة", "علبة هدية", "هدايا"],
  tree: (t) =>
    t.section({ label: L("محتويات العلبة", "In the box") }, [
      t.container(
        [
          t.grid(
            [
              t.productList(
                [
                  t.link(
                    SHOP_LINK,
                    [t.image("", L("اسم المنتج", "Product name"), { bind: "image", style: { aspectRatio: "square", objectFit: "cover", width: "100%", radius: 16 } })],
                    { label: L("صورة المنتج", "Product photo"), bind: "href", style: { ...FLUSH, background: "background", radius: 16, overflow: "hidden" } },
                  ),
                ],
                {
                  label: L("العلبة", "Box"),
                  role: "items",
                  source: "newest",
                  limit: 4,
                  columns: { desktop: 2, mobile: 2 },
                  style: { gap: 14, background: "secondary", radius: 24, paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20 },
                  mobile: { gap: 10, paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12 },
                },
              ),
              t.stack(
                [
                  dotLabel(t, L("علبة الهدية", "Gift box")),
                  t.heading(L("إيه اللي في العلبة؟", "What's in the box?"), "h2", { role: "title", style: { fontSize: "display-sm", letterSpacing: "tight" } }),
                  t.stack(
                    [
                      t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
                      t.productList(
                        [
                          t.stack(
                            [
                              t.row(
                                [
                                  t.row(
                                    [
                                      t.icon("check", { style: { fontSize: "md", color: "primary" } }),
                                      t.text(L("اسم المنتج", "Product name"), { bind: "title" }),
                                    ],
                                    { label: L("القطعة", "Item"), style: { gap: 12, wrap: false } },
                                  ),
                                  t.text(L("٢٥٠ ج.م", "EGP 250"), { bind: "price", style: { color: "muted", fontWeight: "medium" } }),
                                ],
                                { label: L("السطر", "Line"), style: { justifyContent: "between", alignItems: "center", gap: 14, wrap: false, minHeight: 56 } },
                              ),
                              t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
                            ],
                            { label: L("قطعة", "Piece"), style: { gap: 0 } },
                          ),
                        ],
                        { label: L("القائمة", "Legend"), source: "newest", limit: 4, columns: { desktop: 1 }, style: { gap: 0 } },
                      ),
                    ],
                    { label: L("القطع", "Pieces"), style: { gap: 0, width: "100%" } },
                  ),
                  t.row(
                    [
                      t.stack(
                        [
                          t.text(L("قيمتها", "Worth"), { style: { color: "muted", fontSize: "xs" } }),
                          t.text(L("١٬٤٩٠ ج.م", "EGP 1,490"), { style: { color: "muted", fontSize: "lg" } }),
                        ],
                        { label: L("القيمة", "Value"), style: { gap: 2 } },
                      ),
                      t.stack(
                        [
                          t.text(L("هتدفع", "You pay"), { style: { color: "muted", fontSize: "xs" } }),
                          t.text(BUNDLE_PRICE, { role: "value", style: { fontSize: "3xl", fontWeight: "bold", letterSpacing: "tight" } }),
                        ],
                        { label: L("السعر", "Price"), style: { gap: 2 } },
                      ),
                    ],
                    { label: L("الإجمالي", "Totals"), style: { gap: 32, alignItems: "end" } },
                  ),
                  pillButton(t, L("اطلب العلبة", "Order the box"), BUNDLE_LINK, { icon: "gift" }),
                ],
                { label: L("العلبة بالتفصيل", "Box details"), style: { gap: 16, alignItems: "start" } },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 56, alignItems: "center" },
              mobile: { gap: 28 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
