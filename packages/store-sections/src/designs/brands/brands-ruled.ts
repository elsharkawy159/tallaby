/**
 * Ruled grid (Modular set): a hairline-ruled grid of brand wordmarks, four
 * across and two rows, each centred with generous padding. A tidy wall of
 * authorised brands; two across on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, RULED, RULED_CELL, modHead } from "../_modular";
import { BRANDS, wordmark } from "./_shared";

export const brandsRuled = defineDesign({
  id: "brands-ruled",
  version: 1,
  category: "brands",
  subcategory: "logo-grid",
  name: L("شبكة لوجوهات", "Ruled grid"),
  description: L("شعارات الماركات في خانات بخطوط رفيعة.", "Brand logos in hairline-ruled cells."),
  keywords: ["brands", "logos", "grid", "ruled", "ماركات", "شعارات"],
  tree: (t) =>
    t.section({ label: L("الماركات", "Brands") }, [
      t.container(
        [
          modHead(t, {
            label: L("موزع معتمد", "Authorised dealer"),
            title: L("ماركات بنبيعها", "Brands we carry"),
          }),
          t.grid(
            BRANDS.map((_, i) =>
              t.link("/products", [wordmark(t, i)], {
                label: L("ماركة", "Brand"),
                style: {
                  ...FLUSH,
                  ...RULED_CELL,
                  paddingTop: 36,
                  paddingBottom: 36,
                  textAlign: "center",
                  hover: { background: "secondary" },
                },
                mobile: { paddingTop: 26, paddingBottom: 26 },
              }),
            ),
            {
              label: L("الشعارات", "Logos"),
              role: "items",
              columns: { desktop: 4, mobile: 2 },
              style: RULED,
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
