/**
 * Big sign-off (Modular set): a brand-coloured footer that opens with a large
 * sign-off line and a WhatsApp button, then compact link columns and a bottom
 * bar. A memorable ending for brand-led stores.
 *
 * v2 (look-first pilot, F-89): two halves instead of rows that ended in an
 * empty half: the larger sign-off over its WhatsApp button on the start side,
 * two quiet link columns on the end side; then a hairline over the copyright,
 * the social links and the store's payment marks. Same nodes, labels and
 * links as v1 (it adds no copy).
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND } from "../_kit";
import { pillButton } from "../_modular";
import {
  COPYRIGHT,
  HELP_LINKS,
  SHOP_LINKS,
  linkColumn,
  paymentRow,
  socialRow,
} from "./_shared";

export const footerSignoff = defineDesign({
  id: "footer-signoff",
  version: 2,
  category: "footers",
  subcategory: "commerce",
  name: L("توقيع كبير", "Big sign-off"),
  description: L(
    "فوتر بلون المتجر بجملة وداع كبيرة وزر واتساب.",
    "A brand-coloured footer with a large sign-off and a WhatsApp button.",
  ),
  keywords: ["footer", "brand", "bold", "whatsapp", "فوتر", "واتساب"],
  tree: (t) =>
    t.section(
      {
        label: L("الفوتر", "Footer"),
        style: {
          background: "primary",
          color: "primaryInk",
          paddingTop: 88,
          paddingBottom: 28,
        },
        mobile: { paddingTop: 56, paddingBottom: 24 },
      },
      [
        t.container(
          [
            t.grid(
              [
                t.stack(
                  [
                    t.heading(
                      L("شكرًا إنك عدّيت علينا", "Thanks for stopping by"),
                      "h2",
                      {
                        role: "title",
                        style: {
                          fontSize: "display-lg",
                          letterSpacing: "tight",
                          lineHeight: "tight",
                          maxWidth: "14ch",
                          ...ON_BRAND,
                        },
                        motion: { reveal: "words" },
                      },
                    ),
                    pillButton(
                      t,
                      L("كلمنا على واتساب", "WhatsApp us"),
                      "https://wa.me/",
                      { icon: "chat", tone: "ink" },
                    ),
                  ],
                  {
                    label: L("الوداع", "Sign-off"),
                    style: { gap: 32, alignItems: "start" },
                    mobile: { gap: 24 },
                    motion: { reveal: "none" },
                  },
                ),
                t.grid(
                  [
                    linkColumn(t, L("تسوق", "Shop"), SHOP_LINKS, "primaryInk", {
                      quiet: true,
                    }),
                    linkColumn(
                      t,
                      L("المساعدة", "Help"),
                      HELP_LINKS,
                      "primaryInk",
                      { quiet: true },
                    ),
                  ],
                  {
                    label: L("الأعمدة", "Columns"),
                    columns: { desktop: 2, mobile: 2 },
                    style: { gap: 32, paddingTop: 12 },
                    mobile: { gap: 20, paddingTop: 0 },
                  },
                ),
              ],
              {
                label: L("الأعلى", "Top"),
                // A role, so this new wrapper is named `top` and every v1 field name inside stays.
                role: "top",
                columns: { desktop: 2, tablet: 1, mobile: 1 },
                style: { gap: 64, alignItems: "start" },
                tablet: { gap: 44 },
                mobile: { gap: 36 },
              },
            ),
            t.divider({
              style: {
                marginTop: 56,
                marginBottom: 20,
                borderColor: "primaryInk",
                opacity: 20,
              },
              mobile: { marginTop: 36 },
            }),
            t.row(
              [
                t.text(COPYRIGHT, {
                  style: { fontSize: "xs", ...ON_BRAND, opacity: 70 },
                }),
                socialRow(t, "primaryInk", 36),
                paymentRow(t, true),
              ],
              {
                label: L("السطر الأخير", "Bottom bar"),
                style: {
                  justifyContent: "between",
                  alignItems: "center",
                  gap: 16,
                },
                mobile: { direction: "column", alignItems: "start" },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
