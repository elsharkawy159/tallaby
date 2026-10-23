/**
 * Product content: the product's own rich content (headings, lists, photos)
 * the seller wrote on the product, in a reading-width column. The text is the
 * product's, so nothing here is typed in.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const productContent = defineDesign({
  id: "product-content",
  version: 1,
  category: "product-page",
  subcategory: "details",
  name: L("محتوى المنتج", "Product content"),
  description: L("الوصف المنسّق اللي كتبته للمنتج، بالعناوين والصور، في عمود سهل القراءة.", "The formatted content you wrote for the product, with its headings and photos, in an easy-to-read column."),
  keywords: ["product page", "content", "description", "story", "صفحة المنتج", "محتوى", "وصف"],
  tree: (t) =>
    t.section(
      {
        label: L("محتوى المنتج", "Product content"),
        style: { paddingTop: 40, paddingBottom: 40 },
        mobile: { paddingTop: 28, paddingBottom: 28 },
      },
      [
        t.container([t.productContent({ label: L("المحتوى", "Content") })], {
          label: L("الحاوية", "Container"),
          style: { maxWidth: "768px" },
        }),
      ],
    ),
});
