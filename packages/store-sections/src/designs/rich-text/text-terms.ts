/**
 * Definition list (Modular set): a ruled two-column list of terms on the start
 * side and their explanations on the end side, under a small title. For
 * warranty terms, shipping zones or conditions. Each pair stacks on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const ROWS = [
  {
    term: L("المدة", "Duration"),
    text: L("سنة من تاريخ الفاتورة.", "One year from the invoice date."),
  },
  {
    term: L("بيغطي", "Covers"),
    text: L("عيوب الصناعة.", "Manufacturing defects."),
  },
  {
    term: L("مش بيغطي", "Excludes"),
    text: L("الكسر والمياه وسوء الاستخدام.", "Drops, water damage and misuse."),
  },
  {
    term: L("المطلوب", "You need"),
    text: L("الفاتورة والعلبة الأصلية.", "The invoice and the original box."),
  },
];

export const textTerms = defineDesign({
  id: "text-terms",
  version: 1,
  category: "rich-text",
  subcategory: "policy",
  name: L("قائمة تعريفات", "Definition list"),
  description: L("شروط في جدول من عمودين: البند وشرحه.", "Terms in a two-column list: the item and its explanation."),
  keywords: ["text", "terms", "warranty", "definitions", "policy", "شروط", "ضمان", "سياسة"],
  tree: (t) =>
    t.section({ label: L("الشروط", "Terms") }, [
      t.container(
        [
          t.heading(L("شروط الضمان", "Warranty terms"), "h2", {
            role: "title",
            style: { fontSize: "3xl", marginBottom: 24 },
          }),
          t.stack(
            ROWS.map((r) =>
              t.grid(
                [
                  t.text(r.term, { style: { fontWeight: "bold" } }),
                  t.paragraph(r.text, {
                    style: { color: "foreground", colSpan: 2 },
                    mobile: { colSpan: 1 },
                  }),
                ],
                {
                  label: L("بند", "Term"),
                  columns: { desktop: 3, mobile: 1 },
                  style: {
                    background: "background",
                    gap: 24,
                    paddingTop: 18,
                    paddingBottom: 18,
                  },
                  mobile: { gap: 4 },
                },
              ),
            ),
            {
              label: L("القائمة", "List"),
              role: "items",
              style: {
                gap: 1,
                background: "border",
                paddingTop: 1,
                paddingBottom: 1,
                maxWidth: "860px",
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
