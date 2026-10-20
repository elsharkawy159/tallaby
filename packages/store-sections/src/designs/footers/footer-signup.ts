/**
 * Footer with sign-up (library Z-d): a tinted band with a white sign-up card
 * across the top (title on the start side, the store's form on the end side),
 * then the logo with social links and two link columns, and a bottom bar with
 * the copyright and payment chips.
 */
import { defineDesign } from "../builder";
import { L, PAPER_CARD } from "../_kit";
import { logo } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS, SHOP_LINKS, linkColumn, paymentRow, socialRow } from "./_shared";

export const footerSignup = defineDesign({
  id: "footer-signup",
  version: 1,
  category: "footers",
  subcategory: "newsletter",
  name: L("فوتر بنشرة", "Footer with sign-up"),
  description: L("فوتر فيه نموذج الاشتراك فوق الروابط.", "A footer with the sign-up form above the links."),
  keywords: ["footer", "newsletter", "subscribe", "فوتر", "نشرة", "اشتراك"],
  tree: (t) =>
    t.section({ label: L("الفوتر", "Footer"), style: { background: "secondary", paddingTop: 48, paddingBottom: 24 } }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("اشترك في النشرة", "Join the newsletter"), "h3", { role: "title", style: { fontSize: "2xl" } }),
                  t.paragraph(L("عروض ومنتجات جديدة، مرة في الأسبوع.", "Offers and new arrivals, once a week."), { role: "subtitle" }),
                ],
                { label: L("النص", "Copy"), style: { gap: 6 } },
              ),
              t.storeForm(),
            ],
            {
              label: L("بطاقة الاشتراك", "Sign-up card"),
              columns: { desktop: 2, mobile: 1 },
              style: { ...PAPER_CARD, gap: 24, alignItems: "center", paddingTop: 28, paddingBottom: 28, paddingStart: 28, paddingEnd: 28 },
              mobile: { paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20, gap: 16 },
            },
          ),
          t.grid(
            [
              t.stack([logo(t, { size: "lg" }), socialRow(t, "foreground", 36)], { label: L("المتجر", "Store"), style: { gap: 16 } }),
              linkColumn(t, L("تسوق", "Shop"), SHOP_LINKS, "foreground"),
              linkColumn(t, L("المساعدة", "Help"), HELP_LINKS, "foreground"),
            ],
            { label: L("الأعمدة", "Columns"), columns: { desktop: 3, mobile: 1 }, style: { gap: 32, marginTop: 40 }, mobile: { gap: 24 } },
          ),
          t.divider({ style: { marginTop: 32, marginBottom: 16 } }),
          t.row([t.text(COPYRIGHT, { style: { color: "muted" } }), paymentRow(t, false)], {
            label: L("السطر الأخير", "Bottom bar"),
            style: { justifyContent: "between", gap: 16 },
            mobile: { direction: "column", alignItems: "start" },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
