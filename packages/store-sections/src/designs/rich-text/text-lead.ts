/**
 * Lead paragraph (Modular set): a large lead paragraph in display type across
 * the content width, then two smaller columns of body text under a hairline.
 * Opens an About or brand page with a strong first sentence.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const textLead = defineDesign({
  id: "text-lead",
  version: 1,
  category: "rich-text",
  subcategory: "columns",
  name: L("فقرة افتتاحية", "Lead paragraph"),
  description: L("جملة افتتاحية كبيرة وتحتها عمودين نص.", "A large opening sentence over two columns of text."),
  keywords: ["text", "lead", "about", "editorial", "columns", "نص", "افتتاحية", "عمودين"],
  tree: (t) =>
    t.section({ label: L("النص", "Text") }, [
      t.container(
        [
          t.paragraph(
            L(
              "بدأنا المتجر لنجمع منتجات جيدة بسعر عادل في مكان واحد.",
              "We started this store to bring good products at a fair price into one place.",
            ),
            {
              role: "lead",
              style: {
                fontSize: "display-sm",
                fontWeight: "semibold",
                color: "foreground",
                lineHeight: "snug",
                letterSpacing: "tight",
                maxWidth: "30ch",
              },
            },
          ),
          t.divider({
            style: { marginTop: 40, marginBottom: 32 },
            mobile: { marginTop: 24, marginBottom: 20 },
          }),
          t.grid(
            [
              t.paragraph(
                L(
                  "نختار كل منتج بعناية، ونعرض تفاصيله ومقاساته بوضوح.",
                  "We choose every product with care and show its details and sizes clearly.",
                ),
                {
                  style: { fontSize: "lg", lineHeight: "relaxed" },
                },
              ),
              t.paragraph(
                L(
                  "وإذا كان لديك أي سؤال، تواصل معنا.",
                  "And if you have any question, contact us.",
                ),
                {
                  style: { fontSize: "lg", lineHeight: "relaxed" },
                },
              ),
            ],
            {
              label: L("العمودين", "Columns"),
              role: "body",
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 48 },
              mobile: { gap: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
