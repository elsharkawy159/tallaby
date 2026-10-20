/**
 * Delivery promise (U-d): a full-width brand band with the cut-off promise in
 * very large type on the start side and, on the end side, a three-stop track
 * (you order, it ships, it arrives) with the time under each stop, and a link
 * to the delivery times. A strip between product rows. Mobile stacks.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND } from "../_kit";
import { FLUSH } from "../_modular";
import { SHIPPING_LINK } from "./_shared";

const STOPS = [
  { time: L("٢:٠٠ م", "2:00 pm"), label: L("بتطلب النهارده", "You order today") },
  { time: L("٦:٠٠ م", "6:00 pm"), label: L("بيتشحن", "It ships") },
  { time: L("بكره", "Tomorrow"), label: L("بيوصلك", "It arrives") },
];

export const payPromise = defineDesign({
  id: "pay-promise",
  version: 1,
  category: "payment",
  subcategory: "delivery",
  name: L("وعد التوصيل", "Delivery promise"),
  description: L("شريط بلون البراند بآخر معاد للطلب ومراحل التوصيل.", "A brand band with the order cut-off and the delivery stops."),
  keywords: ["payment", "delivery", "same day", "next day", "cut-off", "التوصيل", "بكره", "وعد"],
  tree: (t) =>
    t.section({ label: L("وعد التوصيل", "Delivery promise"), style: { background: "primary", color: "primaryInk" } }, [
      t.container(
        [
          t.grid(
            [
              t.heading(L("اطلب قبل ٢ الضهر، يوصلك بكره", "Order by 2 pm, get it tomorrow"), "h2", {
                role: "title",
                style: { fontSize: "display-lg", letterSpacing: "tight", lineHeight: "tight", ...ON_BRAND },
              }),
              t.stack(
                [
                  t.grid(
                    STOPS.map((s, i) =>
                      t.stack(
                        [
                          t.box([], {
                            label: L("المحطة", "Stop"),
                            style: {
                              width: "24px",
                              minHeight: 24,
                              radius: 999,
                              borderWidth: 2,
                              borderColor: i === 0 ? "accent" : "primaryInk",
                              background: i === 0 ? "accent" : "primary",
                              marginBottom: 10,
                            },
                          }),
                          t.text(s.time, { style: { fontSize: "2xl", fontWeight: "bold", ...ON_BRAND }, mobile: { fontSize: "lg" } }),
                          t.text(s.label, { style: { fontSize: "sm", ...ON_BRAND, opacity: 85 }, mobile: { fontSize: "xs" } }),
                        ],
                        { label: L("مرحلة", "Stop"), style: { gap: 4, alignItems: "start" } },
                      ),
                    ),
                    {
                      label: L("المراحل", "Track"),
                      role: "items",
                      columns: { desktop: 3, mobile: 3 },
                      style: { gap: 12, width: "100%" },
                    },
                  ),
                  t.divider({ style: { marginTop: 0, marginBottom: 0, opacity: 40, width: "100%" } }),
                  t.link(
                    SHIPPING_LINK,
                    [
                      t.row([t.text(L("مواعيد التوصيل", "Delivery times"), { style: { fontWeight: "semibold", fontSize: "sm", ...ON_BRAND } }), t.icon("arrow", { style: { fontSize: "md", ...ON_BRAND } })], {
                        label: L("نص الرابط", "Link text"),
                        style: { gap: 6, wrap: false },
                      }),
                    ],
                    { label: L("رابط", "Link"), role: "link", style: { ...FLUSH, color: "primaryInk" } },
                  ),
                ],
                { label: L("التوصيل", "Delivery"), style: { gap: 20, alignItems: "start" } },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 56, alignItems: "center" },
              mobile: { gap: 32 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
