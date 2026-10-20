/**
 * Delivery days (U-i): a title over three columns under a heavy rule, each
 * led by a very large day figure (1, 2–3, 4–6) with the unit and the
 * governorates in that band underneath. Answers "how long to my city?" on
 * the shipping page. Mobile turns the columns into rows.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BIG_NUMBER } from "../_modular";
import { payTitle } from "./_shared";

const BANDS = [
  { n: L("١", "1"), unit: L("يوم", "day"), places: L("القاهرة، الجيزة", "Cairo, Giza") },
  { n: L("٢–٣", "2–3"), unit: L("أيام", "days"), places: L("الإسكندرية، الدلتا، مدن القناة", "Alexandria, Delta, Canal cities") },
  { n: L("٤–٦", "4–6"), unit: L("أيام", "days"), places: L("الصعيد، البحر الأحمر، سيناء", "Upper Egypt, Red Sea, Sinai") },
];

export const payDays = defineDesign({
  id: "pay-days",
  version: 1,
  category: "payment",
  subcategory: "delivery",
  name: L("أيام التوصيل", "Delivery days"),
  description: L("مدة التوصيل بأرقام كبيرة وتحت كل رقم المحافظات بتاعته.", "Delivery time in huge figures, with the governorates under each."),
  keywords: ["payment", "delivery", "days", "shipping time", "التوصيل", "أيام", "المحافظات"],
  tree: (t) =>
    t.section({ label: L("أيام التوصيل", "Delivery days") }, [
      t.container(
        [
          t.box([payTitle(t, L("هيوصلك إمتى؟", "When will it arrive?"))], { label: L("العنوان", "Heading"), style: { marginBottom: 32 }, mobile: { marginBottom: 20 } }),
          t.box([], { label: L("الخط", "Rule"), style: { background: "foreground", minHeight: 2 } }),
          t.grid(
            BANDS.map((b) =>
              t.stack(
                [
                  t.text(b.n, { role: "value", style: { ...BIG_NUMBER, fontSize: "6xl" }, mobile: { fontSize: "5xl" } }),
                  t.stack(
                    [
                      t.text(b.unit, { style: { fontWeight: "semibold", fontSize: "xl", marginBottom: 8 }, mobile: { fontSize: "md", marginBottom: 2 } }),
                      t.paragraph(b.places),
                    ],
                    { label: L("المحافظات", "Places"), style: { gap: 0 } },
                  ),
                ],
                {
                  label: L("مدة", "Band"),
                  style: { gap: 4, background: "background", paddingTop: 28, paddingStart: 28, paddingEnd: 28 },
                  mobile: { direction: "row", gap: 18, alignItems: "center", paddingTop: 20, paddingBottom: 20, paddingStart: 0, paddingEnd: 0 },
                },
              ),
            ),
            {
              label: L("المدد", "Bands"),
              role: "items",
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 1, background: "border" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
