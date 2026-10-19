/**
 * Ruled grid (Modular set): a hairline-ruled grid with the logo and a short
 * line in the first cell and one cell per link column, then a bottom row with
 * the copyright, social links and payment methods. An orderly footer that
 * matches ruled sections above it.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { RULED, RULED_CELL } from "../_modular";
import { logo } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS, SHOP_LINKS, linkColumn, paymentRow, socialRow } from "./_shared";

const CELL = {
  ...RULED_CELL,
  paddingTop: 28,
  paddingBottom: 28,
  paddingStart: 28,
  paddingEnd: 28,
};

export const footerRuled = defineDesign({
  id: "footer-ruled",
  version: 1,
  category: "footers",
  subcategory: "multi-column",
  name: L("شبكة مقسمة", "Ruled grid"),
  description: L("فوتر في خانات بخطوط رفيعة: الشعار والروابط والدفع.", "A footer in hairline cells: logo, links and payments."),
  keywords: ["footer", "ruled", "columns", "minimal", "فوتر", "أعمدة"],
  tree: (t) =>
    t.section(
      {
        label: L("الفوتر", "Footer"),
        style: { paddingTop: 48, paddingBottom: 32 },
      },
      [
        t.container(
          [
            t.grid(
              [
                t.stack(
                  [
                    logo(t, { size: "lg" }),
                    t.paragraph(L("منتجات أصلية بضمان، توصلك لحد البيت.", "Genuine products with warranty, delivered to your door."), {
                      style: { fontSize: "sm" },
                    }),
                  ],
                  { label: L("المتجر", "Store"), style: { ...CELL, gap: 14 } },
                ),
                t.stack([linkColumn(t, L("تسوق", "Shop"), SHOP_LINKS, "foreground")], { label: L("خانة", "Cell"), style: CELL }),
                t.stack([linkColumn(t, L("المساعدة", "Help"), HELP_LINKS, "foreground")], { label: L("خانة", "Cell"), style: CELL }),
              ],
              {
                label: L("الأعمدة", "Columns"),
                columns: { desktop: 3, mobile: 1 },
                style: { ...RULED, radius: 24 },
              },
            ),
            t.row(
              [
                t.text(COPYRIGHT, {
                  style: { color: "muted", fontSize: "sm" },
                }),
                socialRow(t, "foreground", 36),
                paymentRow(t, false),
              ],
              {
                label: L("السطر الأخير", "Bottom bar"),
                style: { justifyContent: "between", gap: 16, marginTop: 20 },
                mobile: { direction: "column", alignItems: "start" },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
