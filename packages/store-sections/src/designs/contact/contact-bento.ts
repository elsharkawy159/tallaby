/**
 * Contact bento (Modular set): a large brand tile for WhatsApp with the reply
 * time and number, and smaller shelf tiles for phone, email and address. For
 * stores where WhatsApp is the main channel. On mobile the WhatsApp tile comes
 * first.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";
import { BRAND_TILE, FLUSH, TILE, TILE_MOBILE, dotLabel } from "../_modular";
import { CHANNELS } from "./_shared";

export const contactBento = defineDesign({
  id: "contact-bento",
  version: 1,
  category: "contact",
  subcategory: "whatsapp",
  name: L("بينتو تواصل", "Contact bento"),
  description: L("مربع كبير لواتساب ومربعات للتليفون والإيميل والعنوان.", "A large WhatsApp tile with tiles for phone, email and address."),
  keywords: ["contact", "whatsapp", "bento", "phone", "email", "تواصل", "واتساب", "بينتو"],
  tree: (t) =>
    t.section({ label: L("تواصل معنا", "Contact") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.link(
                    CHANNELS[0]!.href,
                    [
                      t.stack(
                        [
                          t.icon("chat", {
                            style: { fontSize: "2xl", color: "primaryInk" },
                          }),
                          dotLabel(t, L("واتساب", "WhatsApp"), {
                            onBrand: true,
                          }),
                          t.heading(L("كلمنا دلوقتي", "Message us now"), "h2", {
                            role: "title",
                            style: { fontSize: "display-sm", ...ON_BRAND },
                          }),
                          t.text(L("بنرد في ١٢ دقيقة في المتوسط", "Average reply: 12 minutes"), { style: ON_BRAND_BODY }),
                          t.text(CHANNELS[0]!.value, {
                            style: {
                              fontWeight: "bold",
                              fontSize: "xl",
                              marginTop: 12,
                              ...ON_BRAND,
                            },
                          }),
                        ],
                        { label: L("المحتوى", "Content"), style: { gap: 10 } },
                      ),
                    ],
                    {
                      label: L("واتساب", "WhatsApp"),
                      style: { ...FLUSH, hover: { opacity: 90 } },
                    },
                  ),
                ],
                {
                  label: L("مربع واتساب", "WhatsApp tile"),
                  style: {
                    ...BRAND_TILE,
                    colSpan: 2,
                    justifyContent: "end",
                    minHeight: 320,
                  },
                  mobile: { ...TILE_MOBILE, colSpan: 1, minHeight: 0 },
                },
              ),
              ...CHANNELS.slice(1).map((c) =>
                t.link(
                  c.href,
                  [
                    t.stack(
                      [
                        t.icon(c.icon, {
                          style: { fontSize: "xl", color: "primary" },
                        }),
                        t.text(c.label, {
                          style: {
                            color: "muted",
                            fontSize: "sm",
                            marginTop: 8,
                          },
                        }),
                        t.text(c.value, { style: { fontWeight: "bold" } }),
                      ],
                      { label: L("المحتوى", "Content"), style: { gap: 4 } },
                    ),
                  ],
                  {
                    label: c.label,
                    style: { ...FLUSH, ...TILE, hover: { shadow: "md" } },
                  },
                ),
              ),
            ],
            {
              label: L("المربعات", "Tiles"),
              role: "items",
              columns: { desktop: 5, mobile: 1 },
              style: { gap: 12, alignItems: "stretch" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
