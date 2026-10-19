/**
 * Help panel (Modular set): a brand-coloured help panel on the start side with
 * a title, the reply time and WhatsApp and call buttons; the questions on the
 * end side. Every question ends in a conversation. On mobile the panel comes
 * after the questions.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";
import { BRAND_TILE, TILE_MOBILE, dotLabel, pillButton } from "../_modular";
import { FAQ_ITEMS } from "./_faq";

export const faqPanel = defineDesign({
  id: "faq-panel",
  version: 1,
  category: "faq",
  subcategory: "help-center",
  name: L("لوحة مساعدة", "Help panel"),
  description: L("لوحة بلون المتجر فيها أزرار واتساب واتصال بجانب الأسئلة.", "A brand-coloured panel with WhatsApp and call buttons beside the questions."),
  keywords: ["faq", "help", "whatsapp", "support", "bold", "أسئلة", "مساعدة", "واتساب"],
  tree: (t) =>
    t.section({ label: L("الأسئلة الشائعة", "FAQ") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("محتاج مساعدة؟", "Need help?"), {
                    onBrand: true,
                  }),
                  t.heading(L("إحنا هنا", "We are here"), "h2", {
                    role: "title",
                    style: {
                      fontSize: "display-sm",
                      letterSpacing: "tight",
                      ...ON_BRAND,
                    },
                  }),
                  t.row(
                    [
                      t.icon("clock", { style: { color: "primaryInk" } }),
                      t.text(L("بنرد في ١٢ دقيقة في المتوسط", "Average reply: 12 minutes"), { style: ON_BRAND_BODY }),
                    ],
                    {
                      label: L("وقت الرد", "Reply time"),
                      style: { gap: 8 },
                    },
                  ),
                  t.spacer(6),
                  t.row(
                    [
                      pillButton(t, L("واتساب", "WhatsApp"), "https://wa.me/201001234567", { icon: "chat", tone: "ink" }),
                      pillButton(t, L("اتصل", "Call"), "tel:+201001234567", {
                        icon: "phone",
                        tone: "on-brand",
                      }),
                    ],
                    { label: L("الأزرار", "Buttons"), style: { gap: 10 } },
                  ),
                ],
                {
                  label: L("لوحة المساعدة", "Help panel"),
                  style: {
                    ...BRAND_TILE,
                    gap: 12,
                    alignItems: "start",
                    position: "sticky",
                    insetTop: "96px",
                  },
                  mobile: {
                    ...TILE_MOBILE,
                    order: 2,
                    position: "relative",
                    insetTop: "auto",
                  },
                },
              ),
              t.accordion(
                FAQ_ITEMS.map((q, i) => ({ ...q, open: i === 0 })),
                {
                  label: L("الأسئلة", "Questions"),
                  role: "items",
                  style: { colSpan: 2 },
                  mobile: { colSpan: 1 },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 40, alignItems: "start" },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
