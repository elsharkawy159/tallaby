/**
 * Centered links (Modular set): a centred stack of the logo, one row of links
 * separated by dots, social links and a small copyright line, with a single
 * hairline above. For small stores with few pages.
 *
 * v2 (look-first pilot, F-89): more air, the store name as a wordmark, a
 * quieter link row, and a second hairline over the store's payment marks and
 * a small copyright line. Same nodes, labels and links as v1.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";
import { WORDMARK, logo } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS, SHOP_LINKS, paymentRow, socialRow } from "./_shared";

const LINKS = [...SHOP_LINKS.slice(0, 3), ...HELP_LINKS];

export const footerLinks = defineDesign({
  id: "footer-links",
  version: 2,
  category: "footers",
  subcategory: "payment-trust",
  name: L("روابط في النص", "Centered links"),
  description: L("الشعار والروابط والسوشيال في المنتصف تحت خط رفيع.", "Logo, links and social icons centred under a hairline."),
  keywords: ["footer", "centered", "links", "minimal", "editorial", "فوتر", "روابط"],
  tree: (t) =>
    t.section(
      {
        label: L("الفوتر", "Footer"),
        style: { paddingTop: 0, paddingBottom: 28 },
      },
      [
        t.container(
          [
            t.divider({
              style: { marginTop: 0, marginBottom: 64 },
              mobile: { marginBottom: 40 },
            }),
            t.stack(
              [
                logo(t, { size: "2xl", nameStyle: { ...WORDMARK, fontSize: "3xl" } }),
                t.row(
                  LINKS.flatMap((l, i) => [
                    ...(i
                      ? [
                          t.box([], {
                            label: L("فاصل", "Separator"),
                            style: {
                              background: "border",
                              radius: 999,
                              width: "3px",
                              minHeight: 3,
                            },
                          }),
                        ]
                      : []),
                    t.link(l.href, [t.text(l.text, { style: { fontSize: "sm", fontWeight: "medium" } })], {
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
                      gap: 18,
                      justifyContent: "center",
                      alignItems: "center",
                      maxWidth: "860px",
                    },
                    mobile: { gap: 14 },
                  },
                ),
                socialRow(t, "foreground", 36, { justifyContent: "center" }),
              ],
              {
                label: L("المحتوى", "Content"),
                style: { gap: 28, alignItems: "center" },
                mobile: { gap: 22 },
              },
            ),
            t.divider({ style: { marginTop: 56, marginBottom: 24 }, mobile: { marginTop: 36, marginBottom: 20 } }),
            t.stack(
              [
                paymentRow(t, false, { justifyContent: "center" }),
                t.text(COPYRIGHT, {
                  style: {
                    color: "muted",
                    fontSize: "xs",
                    textAlign: "center",
                  },
                }),
              ],
              { label: L("السطر الأخير", "Bottom bar"), style: { gap: 14, alignItems: "center" } },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
