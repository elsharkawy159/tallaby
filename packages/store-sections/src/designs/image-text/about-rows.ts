/**
 * Alternating rows (library I-d): three stacked rows, each a photo and a text
 * block with a step number; the photo swaps sides on every row. Mobile puts
 * the photo over the text in every row.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const ROWS = [
  {
    no: L("٠١", "01"),
    title: L("نختار", "We choose"),
    text: L("نشتري من الموزعين المعتمدين فقط، ونرفض أي منتج مشكوك فيه.", "We only buy from approved distributors and turn down anything doubtful."),
  },
  {
    no: L("٠٢", "02"),
    title: L("نجرّب", "We test"),
    text: L("كل منتج يُفتح ويُجرَّب قبل أن يُعرض في المتجر.", "Every product is opened and tested before it is listed."),
  },
  { no: L("٠٣", "03"), title: L("نغلّف", "We pack"), text: L("تغليف محكم ومعه الفاتورة والضمان.", "Sealed packaging with the invoice and warranty inside.") },
];

export const aboutRows = defineDesign({
  id: "about-rows",
  version: 1,
  category: "image-text",
  subcategory: "rows",
  name: L("صفوف متبادلة", "Alternating rows"),
  description: L("صفوف صورة ونص مرقمة، تتبادل الصورة جهتها في كل صف.", "Numbered photo-and-text rows with the photo switching sides each time."),
  keywords: ["about", "process", "steps", "how we work", "طريقتنا", "خطوات", "من نحن"],
  tree: (t) =>
    t.section({ label: L("طريقتنا", "Our process") }, [
      t.container(
        [
          t.stack(
            ROWS.map((row, i) =>
              t.grid(
                [
                  t.photo(i + 4, row.title, {
                    style: { aspectRatio: "landscape", objectFit: "cover", radius: 24, order: i % 2 ? 2 : 0 },
                    mobile: { order: 0 },
                  }),
                  t.stack(
                    [
                      t.text(row.no, { style: { fontWeight: "extrabold", fontSize: "3xl", color: "primary" } }),
                      t.heading(row.title, "h3", { style: { fontSize: "display-sm" } }),
                      t.paragraph(row.text, { style: { fontSize: "lg" } }),
                    ],
                    { label: L("النص", "Copy"), style: { gap: 10, order: 1 } },
                  ),
                ],
                { label: L("صف", "Row"), columns: { desktop: 2, mobile: 1 }, style: { gap: 56, alignItems: "center" }, mobile: { gap: 20 } },
              ),
            ),
            { label: L("الصفوف", "Rows"), role: "items", style: { gap: 72 }, mobile: { gap: 48 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
