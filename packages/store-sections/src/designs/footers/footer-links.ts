/**
 * Centered links (Modular set): a centred stack of the logo, one row of links
 * separated by dots, social links and a small copyright line, with a single
 * hairline above. For small stores with few pages.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";
import { logo } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS, SHOP_LINKS, socialRow } from "./_shared";

const LINKS = [...SHOP_LINKS.slice(0, 3), ...HELP_LINKS];

export const footerLinks = defineDesign({
  id: "footer-links",
  version: 1,
  category: "footers",
  subcategory: "payment-trust",
  name: L("روابط في النص", "Centered links"),
  description: L("الشعار والروابط والسوشيال في المنتصف تحت خط رفيع.", "Logo, links and social icons centred under a hairline."),
  keywords: ["footer", "centered", "links", "minimal", "editorial", "فوتر", "روابط"],
  tree: (t) =>
    t.section(
      {
        label: L("الفوتر", "Footer"),
        style: { paddingTop: 0, paddingBottom: 32 },
      },
      [
        t.container(
          [
            t.divider({
              style: { marginTop: 0, marginBottom: 48 },
              mobile: { marginBottom: 32 },
            }),
            t.stack(
              [
                logo(t, { size: "lg" }),
                t.row(
                  LINKS.flatMap((l, i) => [
                    ...(i
                      ? [
                          t.box([], {
                            label: L("فاصل", "Separator"),
                            style: {
                              background: "border",
                              radius: 999,
                              width: "4px",
                              minHeight: 4,
                            },
                          }),
                        ]
                      : []),
                    t.link(l.href, [t.text(l.text, { style: { fontSize: "sm" } })], {
                      label: L("رابط", "Link"),
                      style: {
                        ...FLUSH,
                        paddingTop: 6,
                        paddingBottom: 6,
                        hover: { color: "primary" },
                      },
                    }),
                  ]),
                  {
                    label: L("الروابط", "Links"),
                    role: "menu",
                    style: {
                      gap: 12,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                    mobile: { gap: 8 },
                  },
                ),
                socialRow(t, "foreground", 36),
                t.text(COPYRIGHT, {
                  style: {
                    color: "muted",
                    fontSize: "xs",
                    textAlign: "center",
                  },
                }),
              ],
              {
                label: L("المحتوى", "Content"),
                style: { gap: 20, alignItems: "center" },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
