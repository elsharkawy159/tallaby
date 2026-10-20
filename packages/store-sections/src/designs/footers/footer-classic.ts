/**
 * Classic footer (library Z-a, Classic template): a deep band with four
 * columns (logo, tagline and social circles; shop links; help links; contact
 * list with accent icons), then a rule and a bottom row with the copyright,
 * payment chips and the "by Tallaby" line.
 */
import type { ElementIconName } from "../../elements/registry";
import { defineDesign } from "../builder";
import { L, ON_BRAND_BODY } from "../_kit";
import { STORE_NAME } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS, SHOP_LINKS, linkColumn, paymentRow, socialRow } from "./_shared";

const CONTACT: { icon: ElementIconName; text: ReturnType<typeof L> }[] = [
  { icon: "phone", text: L("٠١٠٠ ١٢٣ ٤٥٦٧", "+20 100 123 4567") },
  { icon: "mail", text: L("‏hello@store.com", "hello@store.com") },
  { icon: "map-pin", text: L("١٢ شارع النيل، الزمالك، القاهرة", "12 Nile St, Zamalek, Cairo") },
  { icon: "clock", text: L("السبت إلى الخميس، ١٠ ص – ١٠ م", "Sat to Thu, 10am to 10pm") },
];

export const footerClassic = defineDesign({
  id: "footer-classic",
  version: 1,
  category: "footers",
  subcategory: "multi-column",
  name: L("فوتر كلاسيك", "Classic footer"),
  description: L("شريط داكن بأربعة أعمدة وروابط التواصل وطرق الدفع.", "A deep band with four columns, social links and payment methods."),
  keywords: ["footer", "links", "contact", "payments", "classic", "فوتر", "تذييل", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الفوتر", "Footer"), style: { background: "primary", color: "primaryInk", paddingTop: 56, paddingBottom: 24 } }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(STORE_NAME, "h3", { role: "storeName", style: { fontSize: "2xl", fontWeight: "extrabold" } }),
                  t.paragraph(L("أساسيات كل يوم، مختارة بعناية.", "Everyday essentials, picked with care."), {
                    role: "body",
                    style: { ...ON_BRAND_BODY, maxWidth: "320px" },
                  }),
                  socialRow(t, "primaryInk"),
                ],
                { label: L("المتجر", "Brand"), style: { gap: 14 }, tablet: { colSpan: 2 } },
              ),
              linkColumn(t, L("تسوّق", "Shop"), SHOP_LINKS, "primaryInk"),
              linkColumn(t, L("المساعدة", "Help"), HELP_LINKS, "primaryInk"),
              t.stack(
                [
                  t.heading(L("تواصل معنا", "Contact"), "h4", { style: { fontSize: "md", marginBottom: 6 } }),
                  ...CONTACT.map((c) =>
                    t.row([t.icon(c.icon, { style: { color: "accent" } }), t.text(c.text, { style: ON_BRAND_BODY })], {
                      label: L("سطر", "Line"),
                      style: { gap: 10, wrap: false, alignItems: "start" },
                    }),
                  ),
                ],
                { label: L("التواصل", "Contact"), style: { gap: 10 } },
              ),
            ],
            { label: L("الأعمدة", "Columns"), columns: { desktop: 4, tablet: 2, mobile: 1 }, style: { gap: 40 }, mobile: { gap: 28 } },
          ),
          t.divider({ style: { marginTop: 40, marginBottom: 20, opacity: 30 } }),
          t.row(
            [
              t.text(COPYRIGHT, { style: ON_BRAND_BODY }),
              paymentRow(t, true),
              t.text(L("بواسطة طلبي", "by Tallaby"), { style: { ...ON_BRAND_BODY, fontWeight: "semibold" } }),
            ],
            { label: L("السطر السفلي", "Bottom row"), style: { justifyContent: "between", gap: 16 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
