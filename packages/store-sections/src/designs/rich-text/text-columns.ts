/**
 * Two columns (library X-d): a large heading on the start column and two
 * balanced paragraphs on the end. Collapses to one column on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const textColumns = defineDesign({
  id: "text-columns",
  version: 1,
  category: "rich-text",
  subcategory: "columns",
  name: L("نص بعمودين", "Two columns"),
  description: L("عنوان كبير بجانب فقرتين متوازنتين.", "A large heading beside two balanced paragraphs."),
  keywords: ["text", "about", "statement", "نص", "عن المتجر"],
  tree: (t) =>
    t.section({ label: L("عن المتجر", "About the store") }, [
      t.container(
        [
          t.grid(
            [
              t.heading(L("عن متجرنا", "About our store"), "h2", { role: "title", style: { fontSize: "display-md", fontWeight: "extrabold" } }),
              t.paragraph(
                L(
                  "بدأنا بهدف واحد: منتجات جيدة بسعر عادل، يختارها أشخاص يستخدمونها فعلًا.",
                  "We started with one goal: good products at a fair price, picked by people who actually use them.",
                ),
                {
                  role: "body",
                  style: { fontSize: "lg" },
                },
              ),
              t.paragraph(
                L(
                  "ونعرض لكل منتج صورًا ومواصفات واضحة لتختار بثقة.",
                  "And every product has photos and clear specs, so you can choose with confidence.",
                ),
                {
                  role: "body",
                  style: { fontSize: "lg" },
                },
              ),
            ],
            { label: L("الأعمدة", "Columns"), columns: { desktop: 3, mobile: 1 }, style: { gap: 48 }, mobile: { gap: 16 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
