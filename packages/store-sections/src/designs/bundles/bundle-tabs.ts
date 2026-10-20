/**
 * Kit tabs (O-d): chips naming each kit, then a hairline-ruled row of the
 * first kit's products and an end cell with the typed kit total, the saving
 * and a button. Tabs need a script, so the chips are links (the first marked
 * as current) and only the first kit's pane is drawn. Mobile shows a 2-up
 * grid with the total cell under it.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { RULED, RULED_CELL, chip, modHead, pillButton } from "../_modular";
import { productName, productPhoto } from "../products/_shared";
import { BUNDLE_LINK, BUNDLE_PCT, BUNDLE_PRICE, BUNDLE_WAS } from "./_shared";

const KITS = [L("طقم المشاوير", "Commuter kit"), L("طقم الجيم", "Gym kit"), L("طقم البيت", "Home kit")];

export const bundleTabs = defineDesign({
  id: "bundle-tabs",
  version: 1,
  category: "bundles",
  subcategory: "several",
  name: L("أطقم بتابات", "Kit tabs"),
  description: L("أسماء الأطقم في شرائح، وتحتها منتجات الطقم وسعره.", "Kit names as chips, with the kit's products and price below."),
  keywords: ["bundles", "kits", "tabs", "باقات", "أطقم", "تابات"],
  tree: (t) =>
    t.section({ label: L("الأطقم", "Kits") }, [
      t.container(
        [
          modHead(t, { label: L("أطقم جاهزة", "Ready kits"), title: L("طقم لكل يوم", "A kit for every day") }),
          t.row(
            KITS.map((kit, i) => chip(t, kit, BUNDLE_LINK, { active: i === 0 })),
            { label: L("التابات", "Tabs"), role: "tabs", style: { gap: 8, marginBottom: 20 } },
          ),
          t.grid(
            [
              t.productList(
                [
                  t.stack(
                    [
                      productPhoto(t, { ratio: "square", radius: 12, chip: false }),
                      productName(t, { fontSize: "md", fontWeight: "medium" }),
                      t.text(L("٢٥٠ ج.م", "EGP 250"), { bind: "price", style: { color: "muted", fontSize: "sm" } }),
                    ],
                    {
                      label: L("منتج", "Product"),
                      style: { ...RULED_CELL, gap: 8, paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20 },
                      mobile: { paddingTop: 10, paddingBottom: 10, paddingStart: 10, paddingEnd: 10 },
                    },
                  ),
                ],
                {
                  label: L("منتجات الطقم", "Kit products"),
                  role: "items",
                  source: "newest",
                  limit: 3,
                  columns: { desktop: 3, mobile: 3 },
                  style: { gap: 1, colSpan: 3 },
                  mobile: { colSpan: 1 },
                },
              ),
              t.stack(
                [
                  t.text(L("الطقم كامل", "Full kit"), { style: { color: "muted", fontSize: "sm" } }),
                  t.text(BUNDLE_PRICE, { role: "value", style: { fontSize: "3xl", fontWeight: "bold", letterSpacing: "tight" } }),
                  t.text(BUNDLE_WAS, { style: { color: "muted", fontSize: "sm" } }),
                  t.badge(BUNDLE_PCT, { style: { background: "accent", color: "foreground", fontWeight: "semibold" } }),
                  pillButton(t, L("اطلب الطقم", "Get the kit"), BUNDLE_LINK, { style: { marginTop: 8 } }),
                ],
                {
                  label: L("إجمالي الطقم", "Kit total"),
                  role: "summary",
                  style: { background: "secondary", gap: 8, justifyContent: "end", alignItems: "start", paddingTop: 24, paddingBottom: 24, paddingStart: 24, paddingEnd: 24 },
                  mobile: { paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20 },
                },
              ),
            ],
            {
              label: L("الطقم", "Kit"),
              columns: { desktop: 4, mobile: 1 },
              style: { ...RULED, alignItems: "stretch" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
