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
    text: L("نختار كل منتج بعناية قبل عرضه في المتجر.", "We choose every product with care before listing it."),
  },
  {
    no: L("٠٢", "02"),
    title: L("نوضّح", "We explain"),
    text: L("نعرض صورًا ومواصفات ومقاسات واضحة لكل منتج.", "We show photos, specs and clear sizes for every product."),
  },
  { no: L("٠٣", "03"), title: L("نساعدك", "We help"), text: L("تواصل معنا لأي سؤال قبل الطلب أو بعده.", "Contact us with any question, before or after you order.") },
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
