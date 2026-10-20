/**
 * Delivery zones (U-c): on the start side a title and the free-delivery
 * threshold; on the end side a ruled table of zones with delivery days and
 * fee, the first zone shaded. All typed by the seller. The design's
 * governorate picker needs a script, so it is left out. Mobile stacks the
 * two columns.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { dotLabel } from "../_modular";
import { EGP, payTitle } from "./_shared";

const ZONES = [
  { name: L("القاهرة والجيزة", "Cairo & Giza"), days: L("١–٢ يوم", "1–2 days"), fee: EGP("٥٠", "50") },
  { name: L("الإسكندرية والدلتا", "Alexandria & Delta"), days: L("٢–٣ أيام", "2–3 days"), fee: EGP("٦٥", "65") },
  { name: L("مدن القناة", "Canal cities"), days: L("٢–٣ أيام", "2–3 days"), fee: EGP("٦٥", "65") },
  { name: L("الصعيد", "Upper Egypt"), days: L("٣–٥ أيام", "3–5 days"), fee: EGP("٨٠", "80") },
  { name: L("البحر الأحمر وسيناء", "Red Sea & Sinai"), days: L("٤–٦ أيام", "4–6 days"), fee: EGP("٩٥", "95") },
];

const COLS = { desktop: 3, mobile: 3 };

export const payZones = defineDesign({
  id: "pay-zones",
  version: 1,
  category: "payment",
  subcategory: "delivery",
  name: L("التوصيل للمحافظات", "Delivery zones"),
  description: L("جدول بمناطق التوصيل والمدة والمصاريف، وحد التوصيل المجاني.", "A table of delivery zones with time and fee, and the free-delivery threshold."),
  keywords: ["payment", "delivery", "shipping", "zones", "fees", "التوصيل", "الشحن", "المحافظات"],
  tree: (t) =>
    t.section({ label: L("التوصيل", "Delivery") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("التوصيل", "Delivery")),
                  payTitle(t, L("بنوصل لكل مصر", "We deliver across Egypt")),
                  t.paragraph(L("المدة والمصاريف حسب محافظتك.", "Time and fee depend on your governorate.")),
                  t.row(
                    [
                      t.icon("gift", { style: { fontSize: "lg", color: "muted" } }),
                      t.text(L("توصيل مجاني للطلبات فوق ١٬٥٠٠ ج.م", "Free delivery on orders over EGP 1,500"), { style: { fontSize: "sm" } }),
                    ],
                    { label: L("التوصيل المجاني", "Free delivery"), style: { gap: 10, wrap: false } },
                  ),
                ],
                { label: L("العنوان", "Heading"), style: { gap: 16, alignItems: "start" } },
              ),
              t.stack(
                [
                  t.grid(
                    [
                      t.text(L("المنطقة", "Zone"), { style: { fontSize: "xs", fontWeight: "semibold", color: "muted" } }),
                      t.text(L("المدة", "Time"), { style: { fontSize: "xs", fontWeight: "semibold", color: "muted" } }),
                      t.text(L("الشحن", "Fee"), { style: { fontSize: "xs", fontWeight: "semibold", color: "muted", textAlign: "end" } }),
                    ],
                    {
                      label: L("رأس الجدول", "Table head"),
                      columns: COLS,
                      style: { gap: 16, alignItems: "center", minHeight: 44, paddingStart: 24, paddingEnd: 24, background: "background" },
                      mobile: { gap: 12, paddingStart: 14, paddingEnd: 14 },
                    },
                  ),
                  ...ZONES.map((z, i) =>
                    t.grid(
                      [
                        t.text(z.name, { style: { fontWeight: "medium" } }),
                        t.text(z.days, { style: { color: "muted" } }),
                        t.text(z.fee, { style: { fontWeight: "semibold", textAlign: "end" } }),
                      ],
                      {
                        label: L("منطقة", "Zone"),
                        columns: COLS,
                        style: { gap: 16, alignItems: "center", minHeight: 60, paddingStart: 24, paddingEnd: 24, background: i === 0 ? "secondary" : "background" },
                        mobile: { gap: 12, paddingStart: 14, paddingEnd: 14, minHeight: 56 },
                      },
                    ),
                  ),
                ],
                { label: L("الجدول", "Table"), role: "items", style: { gap: 1, background: "border", borderWidth: 1, borderColor: "border", radius: 24, overflow: "hidden" } },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 64, alignItems: "start" },
              mobile: { gap: 28 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
