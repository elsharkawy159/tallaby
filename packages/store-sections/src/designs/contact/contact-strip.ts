/**
 * Contact strip (library K-e): one white rounded strip of four equal cells
 * (WhatsApp, phone, email, address), each a tappable icon, label and value.
 * Mobile shows 2×2.
 */
import { defineDesign } from "../builder";
import { L, PAPER_CARD, iconTile } from "../_kit";
import { CHANNELS } from "./_shared";

export const contactStrip = defineDesign({
  id: "contact-strip",
  version: 1,
  category: "contact",
  subcategory: "info",
  name: L("شريط تواصل", "Contact strip"),
  description: L("شريط مختصر بأربع طرق تواصل قابلة للضغط.", "A compact strip of four tappable ways to reach you."),
  keywords: ["contact", "strip", "phone", "email", "whatsapp", "تواصل", "شريط"],
  tree: (t) =>
    t.section({ label: L("شريط التواصل", "Contact strip"), style: { paddingTop: 32, paddingBottom: 32 } }, [
      t.container(
        [
          t.grid(
            CHANNELS.map((c) =>
              t.link(
                c.href,
                [
                  t.row(
                    [
                      iconTile(t, c.icon),
                      t.stack([t.text(c.label, { style: { color: "muted", fontSize: "xs" } }), t.text(c.value, { style: { fontWeight: "semibold" } })], {
                        label: L("النص", "Copy"),
                        style: { gap: 2 },
                      }),
                    ],
                    { label: L("المحتوى", "Content"), style: { gap: 12, wrap: false }, mobile: { direction: "column", alignItems: "start" } },
                  ),
                ],
                {
                  label: L("طريقة تواصل", "Channel"),
                  style: { paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20, radius: 16, hover: { background: "secondary" } },
                },
              ),
            ),
            {
              label: L("الشريط", "Strip"),
              role: "items",
              columns: { desktop: 4, mobile: 2 },
              style: { ...PAPER_CARD, gap: 0, paddingTop: 6, paddingBottom: 6, paddingStart: 6, paddingEnd: 6 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
