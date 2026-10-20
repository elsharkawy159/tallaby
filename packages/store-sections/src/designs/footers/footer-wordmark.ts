/**
 * Wordmark (library Z-c): link columns and contact on top, then the store
 * name set huge across the bottom of the band, and the copyright with
 * payment chips under it.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { STORE_NAME } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS, SHOP_LINKS, linkColumn, paymentRow, socialRow } from "./_shared";

export const footerWordmark = defineDesign({
  id: "footer-wordmark",
  version: 1,
  category: "footers",
  subcategory: "commerce",
  name: L("اسم كبير", "Wordmark footer"),
  description: L("أعمدة روابط ثم اسم المتجر بخط ضخم بعرض الصفحة.", "Link columns, then the store name set huge across the page."),
  keywords: ["footer", "wordmark", "brand", "فوتر", "اسم المتجر"],
  tree: (t) =>
    t.section({ label: L("الفوتر", "Footer"), style: { background: "accent", color: "foreground", paddingTop: 56, paddingBottom: 24, overflow: "hidden" } }, [
      t.container(
        [
          t.grid(
            [
              linkColumn(t, L("تسوّق", "Shop"), SHOP_LINKS, "foreground"),
              linkColumn(t, L("المساعدة", "Help"), HELP_LINKS, "foreground"),
              t.stack(
                [
                  t.heading(L("تواصل معنا", "Contact"), "h4", { style: { fontSize: "md" } }),
                  t.text(L("٠١٠٠ ١٢٣ ٤٥٦٧", "+20 100 123 4567"), { style: { fontSize: "md" } }),
                  t.text(L("‏hello@store.com", "hello@store.com"), { style: { fontSize: "md" } }),
                  socialRow(t, "foreground"),
                ],
                { label: L("التواصل", "Contact"), style: { gap: 10 }, mobile: { colSpan: 2 } },
              ),
            ],
            { label: L("الأعمدة", "Columns"), columns: { desktop: 3, mobile: 2 }, style: { gap: 40 }, mobile: { gap: 28 } },
          ),
          t.heading(STORE_NAME, "h2", {
            role: "wordmark",
            style: { fontSize: "6xl", fontWeight: "extrabold", lineHeight: "tight", letterSpacing: "tight", marginTop: 48, textAlign: "center" },
            mobile: { fontSize: "4xl", marginTop: 32 },
          }),
          t.row([t.text(COPYRIGHT, { style: { opacity: 80 } }), paymentRow(t, false)], {
            label: L("السطر السفلي", "Bottom row"),
            style: { justifyContent: "between", gap: 16, marginTop: 24 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
