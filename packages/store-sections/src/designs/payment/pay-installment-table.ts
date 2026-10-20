/**
 * Installment table (library U-h): a ruled table with the providers down the
 * start column and the terms across the top. The design fills every cell with
 * a monthly amount for one product, which needs maths on the price that a
 * tree cannot do (and a typed amount would be wrong for every other product),
 * so each cell holds the seller-typed rate for that term instead; the first
 * provider's row is bold. A note says the figures are confirmed at checkout.
 * The table keeps its columns on mobile with smaller type.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { RULED, RULED_CELL, dotLabel } from "../_modular";
import { INSTALLMENT_PROVIDERS, payTitle } from "./_shared";

const TERMS = [L("٦ شهور", "6 mo"), L("١٢ شهر", "12 mo"), L("١٨ شهر", "18 mo"), L("٢٤ شهر", "24 mo")];
const NO_FEES = L("بدون فوايد", "No interest");
const RATES = [
  [NO_FEES, NO_FEES, L("٥٪", "5%"), L("٨٪", "8%")],
  [NO_FEES, L("٤٪", "4%"), L("٧٪", "7%"), L("١٠٪", "10%")],
  [L("٣٪", "3%"), L("٦٪", "6%"), L("٩٪", "9%"), L("١٢٪", "12%")],
];

const COLS = { desktop: 5, mobile: 5 };
const CELL = { minHeight: 60, paddingStart: 20, paddingEnd: 20, alignItems: "center" as const, justifyContent: "center" as const };
const CELL_MOBILE = { minHeight: 52, paddingStart: 6, paddingEnd: 6 };

export const payInstallmentTable = defineDesign({
  id: "pay-installment-table",
  version: 1,
  category: "payment",
  subcategory: "installments",
  name: L("جدول التقسيط", "Installment table"),
  description: L("جدول بشركات التقسيط والمدد ونسبة كل مدة.", "A table of installment providers, terms and the rate for each term."),
  keywords: ["payment", "installments", "table", "valU", "Sympl", "souhoola", "تقسيط", "جدول", "فاليو"],
  tree: (t) =>
    t.section({ label: L("جدول التقسيط", "Installment table") }, [
      t.container(
        [
          t.stack(
            [
              t.stack([dotLabel(t, L("التقسيط", "Installments")), payTitle(t, L("قسّط على راحتك", "Pay in installments"))], {
                label: L("العنوان", "Heading"),
                role: "intro",
                style: { gap: 12 },
              }),
              t.stack(
                [
                  t.grid(
                    [
                      t.box([], { label: L("خانة فاضية", "Empty cell"), style: { ...RULED_CELL, ...CELL } }),
                      ...TERMS.map((term) =>
                        t.stack([t.text(term, { style: { fontSize: "sm", fontWeight: "semibold", color: "muted", textAlign: "center" } })], {
                          label: L("مدة", "Term"),
                          style: { ...RULED_CELL, ...CELL },
                          mobile: CELL_MOBILE,
                        }),
                      ),
                    ],
                    { label: L("رأس الجدول", "Table head"), columns: COLS, style: { gap: 1 } },
                  ),
                  ...INSTALLMENT_PROVIDERS.map((provider, row) =>
                    t.grid(
                      [
                        t.stack([t.text(provider, { style: { fontWeight: "semibold" } })], {
                          label: L("الشركة", "Provider"),
                          style: { ...RULED_CELL, ...CELL, justifyContent: "center", alignItems: "start" },
                          mobile: CELL_MOBILE,
                        }),
                        ...RATES[row]!.map((rate) =>
                          t.stack(
                            [
                              t.text(rate, {
                                style: { textAlign: "center", fontWeight: row === 0 ? "bold" : "normal", color: row === 0 ? "foreground" : "muted" },
                                mobile: { fontSize: "xs" },
                              }),
                            ],
                            { label: L("النسبة", "Rate"), style: { ...RULED_CELL, ...CELL, ...(row === 0 && { background: "secondary" }) }, mobile: CELL_MOBILE },
                          ),
                        ),
                      ],
                      { label: L("شركة تقسيط", "Provider row"), columns: COLS, style: { gap: 1 } },
                    ),
                  ),
                ],
                { label: L("الجدول", "Table"), role: "items", style: RULED },
              ),
              t.text(L("النسب تقريبية وبتتأكد عند الدفع.", "Rates are estimates, confirmed at checkout."), {
                role: "note",
                style: { fontSize: "sm", color: "muted" },
              }),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 24 }, mobile: { gap: 18 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
