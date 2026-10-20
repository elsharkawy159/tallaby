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
              "بدأنا المتجر عشان نلاقي منتجات أصلية بسعر عادل، من غير لف على المحلات.",
              "We started this store to find genuine products at a fair price, without walking from shop to shop.",
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
                  "النهارده بنشحن لكل المحافظات، وكل منتج بيتراجع قبل ما يخرج.",
                  "Today we ship to every governorate, and every product is checked before it leaves.",
                ),
                {
                  style: { fontSize: "lg", lineHeight: "relaxed" },
                },
              ),
              t.paragraph(
                L(
                  "بنشتغل مع موردين معتمدين بس، وكل طلب معاه فاتورة رسمية.",
                  "We work only with trusted suppliers, and every order comes with an official invoice.",
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
