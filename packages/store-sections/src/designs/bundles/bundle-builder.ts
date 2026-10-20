/**
 * Build your kit (O-b): numbered groups down the start side, each a short
 * list of products to pick from (photo, name, price and a cart button), and a
 * sticky shelf card on the end side that explains the kit offer. Picking and
 * a live total need a script, so the still version lets the shopper add one
 * piece from each group to the cart; the offer text is the seller's.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type TreeBuilder } from "../builder";
import { L, N } from "../_kit";
import { FLUSH, modHead, pillButton } from "../_modular";
import { SHOP_LINK } from "../products/_shared";
import { BUNDLE_PCT } from "./_shared";

const GROUPS = [L("القطعة الأساسية", "The main piece"), L("الإضافة", "The add-on"), L("اللمسة الأخيرة", "The finishing touch")];

const STEPS = [
  L("اختار قطعة من كل مجموعة", "Pick one piece from each group"),
  L("ضيفهم للسلة", "Add them to your cart"),
  L("الخصم بيتحسب على الطقم كامل", "The discount covers the whole kit"),
];

function option(t: TreeBuilder): NodeTemplate {
  return t.stack(
    [
      t.link(
        SHOP_LINK,
        [
          t.row(
            [
              t.image("", L("اسم المنتج", "Product name"), {
                bind: "image",
                style: { width: "60px", aspectRatio: "square", radius: 8, objectFit: "cover", background: "secondary" },
                mobile: { width: "100%" },
              }),
              t.stack(
                [
                  t.text(L("اسم المنتج", "Product name"), { bind: "title", style: { fontSize: "sm", fontWeight: "medium", lineHeight: "snug" } }),
                  t.text(L("٢٥٠ ج.م", "EGP 250"), { bind: "price", style: { fontSize: "xs", color: "muted" } }),
                ],
                { label: L("التفاصيل", "Details"), style: { gap: 2 } },
              ),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 12, wrap: false }, mobile: { direction: "column", alignItems: "start", gap: 8 } },
          ),
        ],
        { label: L("المنتج", "Product"), bind: "href", style: { ...FLUSH, color: "foreground" } },
      ),
      t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
    ],
    {
      label: L("اختيار", "Option"),
      style: { background: "background", borderWidth: 1, borderColor: "border", radius: 12, gap: 10, paddingTop: 10, paddingBottom: 10, paddingStart: 10, paddingEnd: 10 },
      mobile: { paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 },
    },
  );
}

export const bundleBuilder = defineDesign({
  id: "bundle-builder",
  version: 1,
  category: "bundles",
  subcategory: "build",
  name: L("اعمل طقمك", "Build your kit"),
  description: L("مجموعات مرقمة يختار منها العميل قطعة من كل واحدة، وجنبها كارت العرض.", "Numbered groups to pick one piece from each, beside a card with the kit offer."),
  keywords: ["bundles", "build your own", "kit", "mix and match", "باقة", "اعمل طقمك", "طقم"],
  tree: (t) =>
    t.section({ label: L("اعمل طقمك", "Build your kit") }, [
      t.container(
        [
          modHead(t, { label: L("اعمل طقمك", "Build a kit"), title: L("اختار ٣ قطع وخد خصم ١٥٪", "Pick 3 pieces, get 15% off") }),
          t.grid(
            [
              t.stack(
                GROUPS.map((group, i) =>
                  t.stack(
                    [
                      t.divider({ style: { marginTop: 0, marginBottom: 6 } }),
                      t.row(
                        [
                          t.box([t.text(N(String(i + 1)), { style: { fontSize: "sm", fontWeight: "bold", color: "background", textAlign: "center" } })], {
                            label: L("الرقم", "Number"),
                            style: { background: "foreground", radius: 999, width: "28px", paddingTop: 4, paddingBottom: 4 },
                          }),
                          t.heading(group, "h3", { style: { fontSize: "lg" } }),
                        ],
                        { label: L("اسم المجموعة", "Group name"), style: { gap: 10, wrap: false } },
                      ),
                      t.productList([option(t)], {
                        label: L("الاختيارات", "Options"),
                        role: "items",
                        source: "newest",
                        limit: 3,
                        offset: i * 3,
                        optional: i > 0,
                        columns: { desktop: 3, mobile: 3 },
                        style: { gap: 10 },
                        mobile: { gap: 8 },
                      }),
                    ],
                    {
                      label: L("مجموعة", "Group"),
                      style: { gap: 14, paddingBottom: 20 },
                    },
                  ),
                ),
                { label: L("المجموعات", "Groups"), style: { gap: 0, colSpan: 2 }, mobile: { colSpan: 1 } },
              ),
              t.stack(
                [
                  t.heading(L("طقمك", "Your kit"), "h3", { style: { fontSize: "xl" } }),
                  t.stack(
                    STEPS.map((step, i) =>
                      t.row(
                        [
                          t.text(N(String(i + 1)), { style: { fontWeight: "bold", color: "primary" } }),
                          t.text(step, { style: { fontSize: "sm" } }),
                        ],
                        { label: L("خطوة", "Step"), style: { gap: 10, wrap: false, alignItems: "start" } },
                      ),
                    ),
                    { label: L("الخطوات", "Steps"), role: "items", style: { gap: 10 } },
                  ),
                  t.divider({ style: { marginTop: 4, marginBottom: 4 } }),
                  t.row(
                    [
                      t.text(L("خصم الطقم", "Kit discount"), { style: { fontWeight: "semibold", fontSize: "lg" } }),
                      t.text(BUNDLE_PCT, { role: "value", style: { fontWeight: "bold", fontSize: "lg", color: "primary" } }),
                    ],
                    { label: L("الخصم", "Discount"), style: { justifyContent: "between", gap: 12 } },
                  ),
                  pillButton(t, L("روح للسلة", "Go to cart"), "/cart", { icon: "shopping-bag", style: { width: "100%" } }),
                ],
                {
                  label: L("ملخص الطقم", "Kit summary"),
                  role: "summary",
                  style: {
                    background: "secondary",
                    radius: 24,
                    gap: 14,
                    position: "sticky",
                    insetTop: "20px",
                    paddingTop: 28,
                    paddingBottom: 28,
                    paddingStart: 28,
                    paddingEnd: 28,
                  },
                  mobile: { position: "relative", insetTop: "0px", paddingTop: 22, paddingBottom: 22, paddingStart: 22, paddingEnd: 22 },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 40, alignItems: "start" },
              mobile: { gap: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
