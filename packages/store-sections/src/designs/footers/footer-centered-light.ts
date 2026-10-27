/**
 * Centred and light (Claude Design premium set, footer `footerCentered`):
 * everything centred on the shelf colour: the store name, a one-line
 * tagline, one wrapped row of menu and help links, social links, payment
 * methods and the copyright. Nothing is hidden on phones; the links wrap onto
 * more rows. For small catalogues and single-brand stores.
 *
 * Gap: payments are text chips the renderer swaps for the store's real
 * methods, not logos yet (section rules G23).
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { STORE_NAME } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS, socialRow } from "./_shared";

const LINKS = [
  { text: L("الرئيسية", "Home"), href: "/" },
  { text: L("المتجر", "Shop"), href: "/products" },
  { text: L("من نحن", "About"), href: "/about" },
  { text: L("تواصل معنا", "Contact"), href: "/contact" },
  ...HELP_LINKS.slice(0, 3),
];

/** Only methods the store checkout offers; the renderer swaps in the store's own. */
const PAYMENTS = [L("الدفع عند الاستلام", "Cash on delivery"), L("إنستاباي", "InstaPay"), L("فودافون كاش", "Vodafone Cash")];

export const footerCenteredLight = defineDesign({
  id: "footer-centered-light",
  version: 1,
  category: "footers",
  subcategory: "payment-trust",
  name: L("في النص وفاتح", "Centred and light"),
  description: L(
    "اسم المتجر وسطر عنه والروابط والسوشيال وطرق الدفع، كلها في النص على خلفية فاتحة.",
    "The store name, a tagline, links, social and payments, all centred on a light background.",
  ),
  keywords: ["footer", "centered", "light", "minimal", "payments", "فوتر", "منتصف", "فاتح", "بسيط"],
  tree: (t) =>
    t.section(
      {
        label: L("الفوتر", "Footer"),
        style: { background: "secondary", paddingTop: 64, paddingBottom: 28 },
        mobile: { paddingTop: 40, paddingBottom: 24 },
      },
      [
        t.container(
          [
            t.stack(
              [
                t.link("/", [t.text(STORE_NAME, { role: "storeName", style: { fontWeight: "bold", fontSize: "2xl", textAlign: "center" } })], {
                  label: L("رابط الرئيسية", "Home link"),
                  role: "logo",
                  style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 },
                }),
                t.paragraph(L("قطع مختارة بعناية، بتوصل لحد باب البيت.", "Carefully chosen pieces, delivered to your door."), {
                  role: "body",
                  style: { color: "muted", textAlign: "center", maxWidth: "440px" },
                }),
                t.row(
                  LINKS.map((l) =>
                    t.link(l.href, [t.text(l.text, { style: { fontSize: "sm" } })], {
                      label: L("رابط", "Link"),
                      style: { paddingTop: 10, paddingBottom: 10, paddingStart: 10, paddingEnd: 10, color: "foreground", hover: { opacity: 70 } },
                    }),
                  ),
                  { label: L("الروابط", "Links"), role: "menu", style: { gap: 4, justifyContent: "center" } },
                ),
                socialRow(t, "foreground", 44),
                t.row(
                  PAYMENTS.map((p) =>
                    t.badge(p, { style: { background: "background", color: "foreground", borderWidth: 1, borderColor: "border", radius: 6 } }),
                  ),
                  { label: L("طرق الدفع", "Payment methods"), role: "payments", style: { gap: 8, justifyContent: "center" } },
                ),
                t.divider({ style: { width: "100%", marginTop: 8, marginBottom: 0 } }),
                t.text(COPYRIGHT, { role: "copyright", style: { color: "muted", fontSize: "xs", textAlign: "center" } }),
              ],
              { label: L("المحتوى", "Content"), style: { gap: 16, alignItems: "center" } },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
