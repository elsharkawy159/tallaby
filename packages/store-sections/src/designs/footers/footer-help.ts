/**
 * Help first (Modular set): a shelf band of three help tiles (WhatsApp, call,
 * track an order) at the top of the footer, then the logo, link columns and
 * bottom bar on paper. For stores whose footer visits are mostly people
 * looking for help.
 */
import type { ElementIconName } from "../../elements/registry";
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";
import { FLUSH, iconDisc } from "../_modular";
import { logo } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS, SHOP_LINKS, linkColumn, paymentRow, socialRow } from "./_shared";

function helpTile(t: TreeBuilder, icon: ElementIconName, label: DesignText, value: DesignText, href: string): NodeTemplate {
  return t.link(
    href,
    [
      t.row(
        [
          iconDisc(t, icon, { color: "primary" }),
          t.stack([t.text(label, { style: { color: "muted", fontSize: "sm" } }), t.text(value, { style: { fontWeight: "bold" } })], {
            label: L("النص", "Text"),
            style: { gap: 2 },
          }),
        ],
        { label: L("المحتوى", "Content"), style: { gap: 14, wrap: false } },
      ),
    ],
    {
      label,
      style: {
        ...FLUSH,
        paddingTop: 6,
        paddingBottom: 6,
        hover: { opacity: 80 },
      },
    },
  );
}

export const footerHelp = defineDesign({
  id: "footer-help",
  version: 1,
  category: "footers",
  subcategory: "multi-column",
  name: L("المساعدة أولاً", "Help first"),
  description: L("شريط مساعدة فيه واتساب واتصال وتتبع الطلب فوق روابط الفوتر.", "A help band with WhatsApp, call and order tracking above the footer links."),
  keywords: ["footer", "help", "support", "whatsapp", "فوتر", "مساعدة", "واتساب"],
  tree: (t) =>
    t.section(
      {
        label: L("الفوتر", "Footer"),
        style: { paddingTop: 0, paddingBottom: 28 },
      },
      [
        t.container(
          [
            t.grid(
              [
                helpTile(t, "chat", L("واتساب", "WhatsApp"), L("٠١٠٠ ١٢٣ ٤٥٦٧", "+20 100 123 4567"), "https://wa.me/201001234567"),
                helpTile(t, "phone", L("اتصل", "Call"), L("٠١٠٠ ١٢٣ ٤٥٦٧", "+20 100 123 4567"), "tel:+201001234567"),
                helpTile(t, "truck", L("تتبع طلبك", "Track your order"), L("برقم الطلب", "With your order number"), "/contact"),
              ],
              {
                label: L("المساعدة", "Help band"),
                role: "items",
                columns: { desktop: 3, mobile: 1 },
                style: { gap: 24, paddingTop: 28, paddingBottom: 28 },
                mobile: { gap: 12, paddingTop: 20, paddingBottom: 20 },
              },
            ),
          ],
          {
            label: L("شريط المساعدة", "Help container"),
            style: { background: "secondary", maxWidth: "100%" },
          },
        ),
        t.container(
          [
            t.grid(
              [
                t.stack([logo(t, { size: "lg" }), socialRow(t, "foreground", 36)], { label: L("المتجر", "Store"), style: { gap: 16 } }),
                linkColumn(t, L("تسوق", "Shop"), SHOP_LINKS, "foreground"),
                linkColumn(t, L("المساعدة", "Help"), HELP_LINKS, "foreground"),
              ],
              {
                label: L("الأعمدة", "Columns"),
                columns: { desktop: 3, mobile: 1 },
                style: { gap: 32, marginTop: 40 },
                mobile: { gap: 24, marginTop: 28 },
              },
            ),
            t.divider({ style: { marginTop: 32, marginBottom: 16 } }),
            t.row(
              [
                t.text(COPYRIGHT, {
                  style: { color: "muted", fontSize: "sm" },
                }),
                paymentRow(t, false),
              ],
              {
                label: L("السطر الأخير", "Bottom bar"),
                style: { justifyContent: "between", gap: 16 },
                mobile: { direction: "column", alignItems: "start" },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
