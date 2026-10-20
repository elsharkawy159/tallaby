/**
 * Sale end bar (library PU-h, "Countdown bar"), drawn still: a full-width
 * sun-coloured bar with the offer in bold, the end date and time in four ink
 * boxes, and a "shop now" link. The design's ticking clock needs a script, so
 * the boxes hold the end date the seller types (day, month, hour, am/pm) and
 * never go stale. On mobile the link hides.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { arrowText } from "../_modular";

const UNITS = [
  { value: L("٣٠", "30"), unit: L("يوم", "day") },
  { value: L("نوفمبر", "Nov"), unit: L("شهر", "month") },
  { value: L("١١:٥٩", "11:59"), unit: L("الساعة", "time") },
  { value: L("م", "pm"), unit: L("مساءً", "evening") },
];

export const popupSaleEnd = defineDesign({
  id: "popup-sale-end",
  version: 1,
  category: "popups",
  subcategory: "bars",
  name: L("شريط نهاية العرض", "Sale end bar"),
  description: L("شريط ملوّن بالعرض وموعد انتهائه في مربعات ورابط تسوق.", "A bright bar with the offer, its end date in boxes and a shop link."),
  keywords: ["popup", "bar", "countdown", "flash sale", "sale ends", "شريط", "عداد", "أوكازيون", "عرض"],
  tree: (t) =>
    t.section({ label: L("شريط العرض", "Sale bar"), style: { background: "accent", color: "foreground", paddingTop: 12, paddingBottom: 12 }, mobile: { paddingTop: 12, paddingBottom: 12 } }, [
      t.container(
        [
          t.row(
            [
              t.text(L("الأوكازيون بيخلص يوم", "Sale ends on"), { role: "title", style: { fontWeight: "bold", fontFamily: "heading" } }),
              t.row(
                UNITS.map((u) =>
                  t.row(
                    [
                      t.text(u.value, { style: { fontWeight: "bold", fontSize: "lg", fontFamily: "heading", color: "background" }, mobile: { fontSize: "md" } }),
                      t.text(u.unit, { style: { fontSize: "xs", color: "background", opacity: 75 } }),
                    ],
                    {
                      label: L("خانة", "Unit"),
                      style: { gap: 4, alignItems: "end", wrap: false, background: "foreground", radius: 8, paddingTop: 4, paddingBottom: 4, paddingStart: 10, paddingEnd: 10 },
                      mobile: { paddingStart: 8, paddingEnd: 8 },
                    },
                  ),
                ),
                { label: L("موعد الانتهاء", "End date"), role: "items", style: { gap: 6, wrap: false } },
              ),
              t.link("/products", [arrowText(t, L("تسوق دلوقتي", "Shop now"), "foreground")], {
                label: L("رابط", "Link"),
                role: "link",
                style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 },
                mobile: { hidden: true },
              }),
            ],
            {
              label: L("الشريط", "Bar"),
              style: { gap: 24, alignItems: "center", justifyContent: "center", minHeight: 40 },
              mobile: { gap: 10 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
