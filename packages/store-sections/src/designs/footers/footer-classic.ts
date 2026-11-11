/**
 * Classic footer (library Z-a, Classic template): a deep band with four
 * columns (logo, tagline and social circles; shop links; help links; contact
 * list with accent icons), then a rule and a bottom row with the copyright,
 * payment chips and the "by Tallaby" line.
 *
 * v2 (look-first pilot, F-89): the calm multi-column footer. More air, the
 * store name as a wordmark, small quiet column titles and links, contact
 * lines in the footer's own ink (no accent icons), and a slim bottom row with
 * a small copyright and the payment marks. The "by Tallaby" line is hidden:
 * the drawn "Powered by Tallaby" credit takes its place, so the footer no
 * longer credits twice. Same nodes, labels and links as v1.
 */
import type { ElementIconName } from "../../elements/registry";
import { defineDesign } from "../builder";
import { L, ON_BRAND_BODY } from "../_kit";
import { STORE_NAME, WORDMARK } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS, SHOP_LINKS, linkColumn, paymentRow, socialRow } from "./_shared";

const CONTACT: { icon: ElementIconName; text: ReturnType<typeof L> }[] = [
  { icon: "phone", text: L("٠١٠٠ ١٢٣ ٤٥٦٧", "+20 100 123 4567") },
  { icon: "mail", text: L("‏hello@store.com", "hello@store.com") },
  { icon: "map-pin", text: L("١٢ شارع النيل، الزمالك، القاهرة", "12 Nile St, Zamalek, Cairo") },
  { icon: "clock", text: L("السبت إلى الخميس، ١٠ ص – ١٠ م", "Sat to Thu, 10am to 10pm") },
];

export const footerClassic = defineDesign({
  id: "footer-classic",
  version: 2,
  category: "footers",
  subcategory: "multi-column",
  name: L("فوتر كلاسيك", "Classic footer"),
  description: L("شريط داكن بأربعة أعمدة وروابط التواصل وطرق الدفع.", "A deep band with four columns, social links and payment methods."),
  keywords: ["footer", "links", "contact", "payments", "classic", "فوتر", "تذييل", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الفوتر", "Footer"), style: { background: "primary", color: "primaryInk", paddingTop: 80, paddingBottom: 28 }, mobile: { paddingTop: 56, paddingBottom: 24 } }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(STORE_NAME, "h3", { role: "storeName", style: { ...WORDMARK, fontSize: "3xl" } }),
                  t.paragraph(L("أساسيات كل يوم، مختارة بعناية.", "Everyday essentials, picked with care."), {
                    role: "body",
                    style: { ...ON_BRAND_BODY, fontSize: "sm", lineHeight: "relaxed", maxWidth: "300px" },
                  }),
                  socialRow(t, "primaryInk", 36, { marginTop: 6 }),
                ],
                { label: L("المتجر", "Brand"), style: { gap: 14 }, tablet: { colSpan: 2 } },
              ),
              linkColumn(t, L("تسوّق", "Shop"), SHOP_LINKS, "primaryInk", { quiet: true }),
              linkColumn(t, L("المساعدة", "Help"), HELP_LINKS, "primaryInk", { quiet: true }),
              t.stack(
                [
                  t.heading(L("تواصل معنا", "Contact"), "h4", {
                    style: { fontSize: "sm", fontWeight: "semibold", fontFamily: "body", color: "primaryInk", opacity: 60, marginBottom: 6 },
                  }),
                  ...CONTACT.map((c) =>
                    t.row([t.icon(c.icon, { style: { color: "primaryInk", opacity: 60, fontSize: "sm" } }), t.text(c.text, { style: { ...ON_BRAND_BODY, opacity: 90, fontSize: "sm" } })], {
                      label: L("سطر", "Line"),
                      style: { gap: 10, wrap: false, alignItems: "center" },
                    }),
                  ),
                ],
                { label: L("التواصل", "Contact"), style: { gap: 12 } },
              ),
            ],
            { label: L("الأعمدة", "Columns"), columns: { desktop: 4, tablet: 2, mobile: 1 }, style: { gap: 48 }, mobile: { gap: 32 } },
          ),
          t.divider({ style: { marginTop: 64, marginBottom: 20, borderColor: "primaryInk", opacity: 20 }, mobile: { marginTop: 40 } }),
          t.row(
            [
              t.text(COPYRIGHT, { style: { ...ON_BRAND_BODY, fontSize: "xs", opacity: 70 } }),
              paymentRow(t, true),
              // Hidden: every footer is drawn with "Powered by Tallaby" beside the copyright (`drawChrome`), so this showed the credit twice.
              // The node stays for its field name and the templates' copy.
              t.text(L("بواسطة طلبي", "by Tallaby"), {
                style: { ...ON_BRAND_BODY, fontSize: "xs", fontWeight: "semibold", hidden: true },
                // Hidden is set per screen size.
                tablet: { hidden: true },
                mobile: { hidden: true },
              }),
            ],
            { label: L("السطر السفلي", "Bottom row"), style: { justifyContent: "between", alignItems: "center", gap: 16 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
