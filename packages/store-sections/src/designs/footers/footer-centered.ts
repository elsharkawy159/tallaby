/**
 * Centered stack (library Z-e): everything centred on deep brand: the logo,
 * a one-line tagline, large social circles, one row of links, then payments
 * and the copyright. For boutique stores with few pages.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND_BODY } from "../_kit";
import { logo, nav } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS, paymentRow, socialRow } from "./_shared";

export const footerCentered = defineDesign({
  id: "footer-centered",
  version: 1,
  category: "footers",
  subcategory: "payment-trust",
  name: L("فوتر في المنتصف", "Centered footer"),
  description: L("الشعار والشعار النصي والتواصل والروابط وطرق الدفع في المنتصف.", "Logo, tagline, social links, links and payments, all centred."),
  keywords: ["footer", "centered", "boutique", "payments", "فوتر", "منتصف"],
  tree: (t) =>
    t.section({ label: L("الفوتر", "Footer"), style: { background: "primary", color: "primaryInk", paddingTop: 56, paddingBottom: 32 } }, [
      t.container(
        [
          t.stack(
            [
              logo(t, { size: "2xl", onBrand: true }),
              t.paragraph(L("مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.", "Carefully curated since 2018, for every home in Egypt."), {
                role: "body",
                style: { ...ON_BRAND_BODY, textAlign: "center", maxWidth: "480px" },
              }),
              socialRow(t, "primaryInk", 48),
              nav(t, HELP_LINKS, { color: "primaryInk", style: { gap: 24, justifyContent: "center" } }),
              paymentRow(t, true),
              t.text(COPYRIGHT, { style: { ...ON_BRAND_BODY, textAlign: "center" } }),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 20, alignItems: "center" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
