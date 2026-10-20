/**
 * Shop by feature (Product finder E-i, "Feature switches"): on the start side
 * the features that decide the choice, on the end side a compact ruled list
 * of products with photo, name and price. The design's on/off switches filter
 * the list live, which needs a script and product tags; here each feature is
 * a link row the seller points at a collection of products with it, and the
 * list shows the store's best sellers.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, RULED, RULED_CELL, dotLabel } from "../_modular";
import { productName, productPhoto } from "../products/_shared";
import { FINDER_LINK } from "./_shared";

const FEATURES = [
  L("عزل ضوضاء", "Noise cancelling"),
  L("مقاوم للمية", "Water resistant"),
  L("شحن سريع", "Fast charging"),
  L("ضمان سنتين", "2-year warranty"),
];

export const finderFeatures = defineDesign({
  id: "finder-features",
  version: 1,
  category: "finder",
  subcategory: "guided",
  name: L("حسب الميزة", "Shop by feature"),
  description: L(
    "المزايا اللي بتفرق كروابط، وجنبها قايمة منتجات مختصرة.",
    "The features that matter as links, beside a compact product list.",
  ),
  keywords: [
    "finder",
    "features",
    "filter",
    "shop by feature",
    "مزايا",
    "فلتر",
    "اللي يهمك",
  ],
  tree: (t) =>
    t.section({ label: L("حسب الميزة", "Shop by feature") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("ساعدني أختار", "Help me choose")),
                  t.heading(L("اللي يهمك", "What matters to you"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", letterSpacing: "tight" },
                  }),
                  t.stack(
                    FEATURES.map((f) =>
                      t.link(
                        FINDER_LINK,
                        [
                          t.row(
                            [
                              t.text(f, { style: { fontWeight: "semibold" } }),
                              t.icon("arrow", {
                                style: { fontSize: "md", color: "primary" },
                              }),
                            ],
                            {
                              label: L("المحتوى", "Content"),
                              style: {
                                justifyContent: "between",
                                alignItems: "center",
                                gap: 12,
                                wrap: false,
                              },
                            },
                          ),
                        ],
                        {
                          label: L("ميزة", "Feature"),
                          style: {
                            ...FLUSH,
                            ...RULED_CELL,
                            color: "foreground",
                            paddingTop: 14,
                            paddingBottom: 14,
                            paddingStart: 18,
                            paddingEnd: 18,
                            hover: { background: "secondary" },
                          },
                        },
                      ),
                    ),
                    {
                      label: L("المزايا", "Features"),
                      role: "items",
                      style: { ...RULED, radius: 18, marginTop: 8 },
                    },
                  ),
                ],
                { label: L("المزايا", "Features column"), style: { gap: 14 } },
              ),
              t.stack(
                [
                  t.text(L("منتجات بنرشحها", "Products we recommend"), {
                    style: {
                      fontSize: "sm",
                      fontWeight: "semibold",
                      color: "muted",
                    },
                  }),
                  t.productList(
                    [
                      t.row(
                        [
                          t.box(
                            [
                              productPhoto(t, {
                                ratio: "square",
                                radius: 12,
                                chip: false,
                              }),
                            ],
                            {
                              label: L("الإطار", "Frame"),
                              style: { width: "64px" },
                            },
                          ),
                          t.stack([productName(t)], {
                            label: L("الاسم", "Name"),
                            style: { width: "65%" },
                            mobile: { width: "50%" },
                          }),
                          t.text(L("٢٥٠ ج.م", "EGP 250"), {
                            bind: "price",
                            style: { fontWeight: "bold", color: "primary" },
                          }),
                        ],
                        {
                          label: L("منتج", "Product"),
                          style: {
                            ...RULED_CELL,
                            gap: 14,
                            wrap: false,
                            justifyContent: "between",
                            alignItems: "center",
                            paddingTop: 12,
                            paddingBottom: 12,
                            paddingStart: 14,
                            paddingEnd: 14,
                          },
                        },
                      ),
                    ],
                    {
                      label: L("المنتجات", "Products"),
                      role: "products",
                      source: "best-sellers",
                      limit: 4,
                      columns: { desktop: 1 },
                      style: { ...RULED, radius: 18 },
                    },
                  ),
                ],
                { label: L("النتائج", "Results"), style: { gap: 14 } },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 48, alignItems: "start" },
              mobile: { gap: 28 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
