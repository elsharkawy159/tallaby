/**
 * Big percent (Modular set): a hairline-framed panel with a giant discount
 * figure underlined in sun on the start side, and the offer title, conditions
 * and button on the end side. On mobile the figure sits above the text.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BIG_NUMBER, dotLabel, pillButton } from "../_modular";

export const promoPercent = defineDesign({
  id: "promo-percent",
  version: 1,
  category: "promotions",
  subcategory: "full-width",
  name: L("نسبة كبيرة", "Big percent"),
  description: L("رقم الخصم ضخم وجنبه العنوان والشروط والزر.", "A giant discount figure beside the offer title, conditions and button."),
  keywords: ["promotions", "discount", "percent", "sale", "minimal", "خصم", "نسبة", "تخفيضات"],
  tree: (t) =>
    t.section({ label: L("العرض", "Offer") }, [
      t.container(
        [
          t.row(
            [
              t.stack(
                [
                  t.text(L("٣٠٪", "30%"), {
                    role: "value",
                    style: { ...BIG_NUMBER, fontSize: "display-lg" },
                  }),
                  t.box([], {
                    label: L("الخط", "Underline"),
                    style: { background: "accent", radius: 999, minHeight: 14 },
                  }),
                ],
                { label: L("الرقم", "Figure"), style: { gap: 8 } },
              ),
              t.stack(
                [
                  dotLabel(t, L("خصم", "Off")),
                  t.heading(L("على كل المنتجات", "on everything in store"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", letterSpacing: "tight" },
                  }),
                  t.paragraph(L("لحد آخر الشهر أو لحد ما الكمية تخلص.", "Until the end of the month or while stock lasts."), { role: "subtitle" }),
                  pillButton(t, L("تسوق العرض", "Shop the offer"), "/products"),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { gap: 12, alignItems: "start", width: "60%" },
                  mobile: { width: "100%" },
                },
              ),
            ],
            {
              label: L("اللوحة", "Panel"),
              style: {
                borderWidth: 1,
                borderColor: "border",
                radius: 24,
                gap: 56,
                wrap: false,
                paddingTop: 56,
                paddingBottom: 56,
                paddingStart: 56,
                paddingEnd: 56,
              },
              mobile: {
                direction: "column",
                alignItems: "start",
                gap: 24,
                paddingTop: 28,
                paddingBottom: 28,
                paddingStart: 22,
                paddingEnd: 22,
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
