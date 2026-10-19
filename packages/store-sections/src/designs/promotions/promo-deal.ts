/**
 * Deal panel (library M-c): a rounded tinted panel split in three, the photo
 * on the start side, the deal name and saving in the middle, and the end date
 * with the buy button on the end side.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const promoDeal = defineDesign({
  id: "promo-deal",
  version: 1,
  category: "promotions",
  subcategory: "countdown",
  name: L("عرض اليوم", "Deal of the day"),
  description: L("لوحة عرض واحد: صورة، واسم العرض والتوفير، وموعد الانتهاء وزر.", "One deal: a photo, the offer and saving, the end date and a button."),
  keywords: ["deal", "flash sale", "offer", "countdown", "عرض اليوم", "خصم", "عرض"],
  tree: (t) =>
    t.section({ label: L("عرض اليوم", "Deal of the day") }, [
      t.container(
        [
          t.grid(
            [
              t.photo(3, L("صورة العرض", "Deal photo"), { role: "image", style: { aspectRatio: "square", objectFit: "cover", radius: 24 } }),
              t.stack(
                [
                  t.badge(L("عرض اليوم", "Deal of the day"), { role: "eyebrow", style: { background: "background", color: "primary" } }),
                  t.heading(L("اسم العرض أو المنتج هنا", "Name the deal or product here"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", fontWeight: "extrabold" },
                  }),
                  t.paragraph(L("اكتب سبب العرض وما يحصل عليه العميل في سطر واحد.", "Say what the customer gets and why, in one line."), { role: "body" }),
                  t.badge(L("وفّر ٢٥٪", "Save 25%"), { style: { background: "accent", fontSize: "md", paddingStart: 16, paddingEnd: 16 } }),
                ],
                { label: L("العرض", "Deal"), style: { gap: 12, alignItems: "start" } },
              ),
              t.stack(
                [
                  t.text(L("ينتهي العرض", "Offer ends"), { style: { color: "muted" } }),
                  t.row(
                    [
                      t.card(
                        [
                          t.heading(L("٣٠", "30"), "h3", { style: { fontSize: "3xl", textAlign: "center" } }),
                          t.text(L("نوفمبر", "Nov"), { style: { textAlign: "center", color: "muted" } }),
                        ],
                        {
                          label: L("اليوم", "Day"),
                          style: { paddingTop: 14, paddingBottom: 14, paddingStart: 18, paddingEnd: 18, radius: 16 },
                        },
                      ),
                      t.card(
                        [
                          t.heading(L("١١:٥٩", "11:59"), "h3", { style: { fontSize: "3xl", textAlign: "center" } }),
                          t.text(L("مساءً", "pm"), { style: { textAlign: "center", color: "muted" } }),
                        ],
                        {
                          label: L("الساعة", "Time"),
                          style: { paddingTop: 14, paddingBottom: 14, paddingStart: 18, paddingEnd: 18, radius: 16 },
                        },
                      ),
                    ],
                    { label: L("موعد الانتهاء", "End date"), style: { gap: 10, wrap: false } },
                  ),
                  t.button(L("الحق العرض", "Grab the deal"), "/products", "solid", { role: "cta" }),
                ],
                { label: L("الانتهاء والزر", "End and button"), style: { gap: 14, alignItems: "start" } },
              ),
            ],
            {
              label: L("اللوحة", "Panel"),
              columns: { desktop: 3, mobile: 1 },
              style: {
                gap: 40,
                alignItems: "center",
                background: "secondary",
                radius: 32,
                paddingTop: 32,
                paddingBottom: 32,
                paddingStart: 32,
                paddingEnd: 32,
              },
              mobile: { gap: 24, paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
