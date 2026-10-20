/**
 * Big sign-off (Modular set): a brand-coloured footer that opens with a large
 * sign-off line and a WhatsApp button, then compact link columns and a bottom
 * bar. A memorable ending for brand-led stores.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND } from "../_kit";
import { pillButton } from "../_modular";
import { COPYRIGHT, HELP_LINKS, SHOP_LINKS, linkColumn, socialRow } from "./_shared";

export const footerSignoff = defineDesign({
  id: "footer-signoff",
  version: 1,
  category: "footers",
  subcategory: "commerce",
  name: L("توقيع كبير", "Big sign-off"),
  description: L("فوتر بلون المتجر بجملة وداع كبيرة وزر واتساب.", "A brand-coloured footer with a large sign-off and a WhatsApp button."),
  keywords: ["footer", "brand", "bold", "whatsapp", "فوتر", "واتساب"],
  tree: (t) =>
    t.section(
      {
        label: L("الفوتر", "Footer"),
        style: {
          background: "primary",
          color: "primaryInk",
          paddingTop: 64,
          paddingBottom: 28,
        },
      },
      [
        t.container(
          [
            t.row(
              [
                t.heading(L("شكرًا إنك عدّيت علينا", "Thanks for stopping by"), "h2", {
                  role: "title",
                  style: {
                    fontSize: "display-md",
                    letterSpacing: "tight",
                    maxWidth: "16ch",
                    ...ON_BRAND,
                  },
                }),
                pillButton(t, L("كلمنا على واتساب", "WhatsApp us"), "https://wa.me/", { icon: "chat", tone: "ink" }),
              ],
              {
                label: L("الوداع", "Sign-off"),
                style: {
                  justifyContent: "between",
                  alignItems: "end",
                  gap: 24,
                },
                mobile: { direction: "column", alignItems: "start" },
              },
            ),
            t.divider({
              style: {
                marginTop: 40,
                marginBottom: 32,
                borderColor: "primaryInk",
                opacity: 30,
              },
            }),
            t.grid([linkColumn(t, L("تسوق", "Shop"), SHOP_LINKS, "primaryInk"), linkColumn(t, L("المساعدة", "Help"), HELP_LINKS, "primaryInk")], {
              label: L("الأعمدة", "Columns"),
              columns: { desktop: 4, mobile: 2 },
              style: { gap: 32 },
              mobile: { gap: 20 },
            }),
            t.row(
              [
                t.text(COPYRIGHT, {
                  style: { fontSize: "sm", ...ON_BRAND, opacity: 80 },
                }),
                socialRow(t, "primaryInk", 36),
              ],
              {
                label: L("السطر الأخير", "Bottom bar"),
                style: { justifyContent: "between", gap: 16, marginTop: 36 },
                mobile: { direction: "column", alignItems: "start" },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
