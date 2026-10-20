/**
 * Progress bars (library S-d): a heading on the start side and a list of
 * percentages on the end side, each a label, a figure and a thick rounded bar.
 * The filled part is a node whose width the seller sets.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const ROWS = [
  { label: L("طلبات وصلت في موعدها", "Orders delivered on time"), value: L("٩٦٪", "96%"), width: "96%" },
  { label: L("عملاء عادوا للطلب مرة أخرى", "Customers who reorder"), value: L("٧١٪", "71%"), width: "71%" },
  { label: L("رسائل رددنا عليها في أقل من ساعة", "Messages answered within an hour"), value: L("٨٨٪", "88%"), width: "88%" },
];

export const statsProgress = defineDesign({
  id: "stats-progress",
  version: 1,
  category: "statistics",
  subcategory: "stats-content",
  name: L("نسب مئوية", "Progress bars"),
  description: L("عنوان بجانب نسب جودة الخدمة في أشرطة.", "A heading beside service-quality percentages shown as bars."),
  keywords: ["stats", "percent", "progress", "quality", "نسب", "جودة"],
  tree: (t) =>
    t.section({ label: L("نسب الخدمة", "Service rates") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.badge(L("الجودة", "Quality"), { role: "eyebrow", style: { color: "primary" } }),
                  t.heading(L("نقيس أنفسنا كل شهر", "We measure ourselves monthly"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.paragraph(L("أرقام حقيقية من طلبات الشهر الماضي.", "Real numbers from last month's orders."), { role: "body" }),
                ],
                { label: L("العنوان", "Heading"), style: { gap: 12, alignItems: "start" } },
              ),
              t.stack(
                ROWS.map((row) =>
                  t.stack(
                    [
                      t.row(
                        [
                          t.text(row.label, { style: { fontWeight: "medium", fontSize: "md" } }),
                          t.text(row.value, { style: { fontWeight: "bold", fontSize: "md" } }),
                        ],
                        {
                          label: L("السطر", "Line"),
                          style: { justifyContent: "between", gap: 12 },
                        },
                      ),
                      t.box(
                        [t.box([], { label: L("الجزء الممتلئ", "Fill"), style: { background: "primary", radius: 999, minHeight: 12, width: row.width } })],
                        {
                          label: L("الشريط", "Bar"),
                          style: { background: "secondary", radius: 999, minHeight: 12 },
                        },
                      ),
                    ],
                    { label: L("نسبة", "Rate"), style: { gap: 10 } },
                  ),
                ),
                { label: L("النسب", "Rates"), role: "items", style: { gap: 28 } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 64, alignItems: "center" }, mobile: { gap: 32 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
