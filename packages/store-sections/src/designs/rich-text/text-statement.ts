/**
 * Statement band (Modular set): a full-width brand band with one large
 * statement on the start side and a small signature and link on the end side.
 * A mission line or seasonal greeting between sections. Stacks on mobile.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY, arrowLink } from "../_kit";

export const textStatement = defineDesign({
  id: "text-statement",
  version: 1,
  category: "rich-text",
  subcategory: "callout",
  name: L("شريط بيان", "Statement band"),
  description: L("شريط بلون المتجر فيه جملة كبيرة وتوقيع.", "A brand-coloured band with one large line and a signature."),
  keywords: ["text", "statement", "greeting", "mission", "bold", "نص", "تهنئة", "رسالة"],
  tree: (t) =>
    t.section(
      {
        label: L("البيان", "Statement"),
        style: { background: "primary", paddingTop: 56, paddingBottom: 56 },
      },
      [
        t.container(
          [
            t.row(
              [
                t.paragraph(L("كل سنة وانتم طيبين. الطلبات شغالة طول أيام العيد.", "Happy holidays. Orders keep running through the break."), {
                  role: "title",
                  style: {
                    fontSize: "display-sm",
                    fontWeight: "bold",
                    lineHeight: "snug",
                    maxWidth: "26ch",
                    ...ON_BRAND,
                  },
                }),
                t.stack(
                  [
                    t.text(L("— فريق المتجر", "— The store team"), {
                      style: { fontSize: "sm", ...ON_BRAND_BODY },
                    }),
                    arrowLink(t, L("مواعيد التوصيل", "Delivery times"), "/shipping", { style: { color: "primaryInk" } }),
                  ],
                  { label: L("التوقيع", "Signature"), style: { gap: 8 } },
                ),
              ],
              {
                label: L("المحتوى", "Content"),
                style: {
                  justifyContent: "between",
                  alignItems: "end",
                  gap: 32,
                },
                mobile: { direction: "column", alignItems: "start", gap: 16 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
