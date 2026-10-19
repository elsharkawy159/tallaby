/**
 * Centered text (library X-a original): a centred column with an eyebrow, a
 * heading, a paragraph and a button. For a short message between sections.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const textCentered = defineDesign({
  id: "text-centered",
  version: 1,
  category: "rich-text",
  subcategory: "notice",
  name: L("نص في المنتصف", "Centered text"),
  description: L("عنوان وفقرة وزر في المنتصف لرسالة قصيرة.", "A centred heading, paragraph and button for a short message."),
  keywords: ["text", "notice", "message", "نص", "ملاحظة", "رسالة"],
  tree: (t) =>
    t.section({ label: L("نص", "Text") }, [
      t.container(
        [
          t.stack(
            [
              t.badge(L("ملاحظة", "Notice"), { role: "eyebrow", style: { color: "primary" } }),
              t.heading(L("مواعيد شهر رمضان", "Ramadan opening hours"), "h2", { role: "title", style: { fontSize: "display-sm", textAlign: "center" } }),
              t.paragraph(
                L(
                  "طوال الشهر نعمل من ٨ مساءً حتى ٢ صباحًا، والطلبات أونلاين مستمرة كالمعتاد.",
                  "Throughout the month we open 8pm to 2am. Online orders run as usual.",
                ),
                { role: "body", style: { textAlign: "center", fontSize: "lg", maxWidth: "640px" } },
              ),
              t.button(L("تسوّق الآن", "Shop now"), "/products", "solid", { role: "cta" }),
            ],
            { label: L("العمود", "Column"), style: { gap: 14, alignItems: "center" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
