/**
 * Columns with sign-up (Claude Design premium set, footer `footerColumns`):
 * a deep band with a sign-up row on top (title and line at the start, the
 * store's newsletter form at the end), then the store name with a tagline and
 * social links, Shop and Help link columns and a contact column (phone,
 * WhatsApp, email, address), and a bottom bar with the copyright and the
 * payment methods. On phones the two link columns sit side by side, with the
 * brand and contact blocks full width.
 *
 * Gaps: link columns are not collapsed dropdowns on phones yet (no details
 * element, section rules G22), and payments are text chips the renderer swaps
 * for the store's real methods, not logos (G23).
 */
import type { ElementIconName } from "../../elements/registry";
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";
import { STORE_NAME } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS, SHOP_LINKS, linkColumn, socialRow } from "./_shared";

const FLUSH = { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 };
const SOFT = { color: "background", opacity: 75 } as const;

/** Only methods the store checkout offers; the renderer swaps in the store's own. */
const PAYMENTS = [L("الدفع عند الاستلام", "Cash on delivery"), L("إنستاباي", "InstaPay"), L("فودافون كاش", "Vodafone Cash")];

/** One contact line: an icon and its text, linked when `href` is given. Demo values are swapped for the store's. */
function contactLine(t: TreeBuilder, icon: ElementIconName, text: DesignText, label: DesignText, href?: string): NodeTemplate {
  const content = t.row(
    [t.icon(icon, { style: { fontSize: "md", color: "background", opacity: 70 } }), t.text(text, { style: { color: "background", opacity: 90 } })],
    { label: L("المحتوى", "Content"), style: { gap: 10, wrap: false, alignItems: "start" } },
  );
  if (!href) return t.box([content], { label, style: { paddingTop: 6, paddingBottom: 6 } });
  return t.link(href, [content], { label, style: { ...FLUSH, paddingTop: 6, paddingBottom: 6, hover: { opacity: 75 } } });
}

export const footerColumnsSignup = defineDesign({
  id: "footer-columns-signup",
  version: 1,
  category: "footers",
  subcategory: "newsletter",
  name: L("أعمدة مع اشتراك", "Columns with sign-up"),
  description: L(
    "فوتر داكن فيه الاشتراك فوق، ثم المتجر والروابط والتواصل، وتحتهم الحقوق وطرق الدفع.",
    "A dark footer with sign-up on top, then the store, links and contact, with copyright and payments below.",
  ),
  keywords: ["footer", "newsletter", "columns", "contact", "payments", "dark", "فوتر", "اشتراك", "أعمدة", "تواصل", "دفع"],
  tree: (t) =>
    t.section(
      {
        label: L("الفوتر", "Footer"),
        style: { background: "foreground", color: "background", paddingTop: 64, paddingBottom: 28 },
        mobile: { paddingTop: 40, paddingBottom: 24 },
      },
      [
        t.container(
          [
            t.grid(
              [
                t.stack(
                  [
                    t.heading(L("اعرف العروض الأول", "Get offers first"), "h3", {
                      role: "title",
                      style: { fontSize: "xl", fontWeight: "semibold", color: "background" },
                    }),
                    t.paragraph(L("إيميل واحد في الشهر، من غير إزعاج.", "One email a month, no spam."), { role: "subtitle", style: SOFT }),
                  ],
                  { label: L("النص", "Copy"), style: { gap: 4 } },
                ),
                t.storeForm({ formTemplate: "newsletter" }),
              ],
              {
                label: L("صف الاشتراك", "Sign-up row"),
                columns: { desktop: 2, tablet: 2, mobile: 1 },
                style: { gap: 24, alignItems: "center" },
                mobile: { gap: 16 },
              },
            ),
            t.divider({ style: { marginTop: 32, marginBottom: 32, opacity: 20 } }),
            t.grid(
              [
                t.stack(
                  [
                    t.link("/", [t.text(STORE_NAME, { role: "storeName", style: { fontWeight: "bold", fontSize: "2xl", color: "background" } })], {
                      label: L("رابط الرئيسية", "Home link"),
                      role: "logo",
                      style: FLUSH,
                    }),
                    t.paragraph(L("قطع مختارة بعناية، بتوصل لحد باب البيت.", "Carefully chosen pieces, delivered to your door."), {
                      role: "body",
                      style: { ...SOFT, maxWidth: "360px" },
                    }),
                    socialRow(t, "background", 44),
                  ],
                  { label: L("المتجر", "Brand"), style: { gap: 14 }, tablet: { colSpan: 2 }, mobile: { colSpan: 2 } },
                ),
                linkColumn(t, L("تسوق", "Shop"), SHOP_LINKS, "background"),
                linkColumn(t, L("المساعدة", "Help"), HELP_LINKS, "background"),
                t.stack(
                  [
                    t.heading(L("تواصل معنا", "Contact"), "h4", { style: { fontSize: "md", marginBottom: 6 } }),
                    contactLine(t, "phone", L("٠١٠٠ ١٢٣ ٤٥٦٧", "+20 100 123 4567"), L("الهاتف", "Phone"), "tel:+201001234567"),
                    contactLine(t, "chat", L("واتساب", "WhatsApp"), L("واتساب", "WhatsApp"), "https://wa.me/201001234567"),
                    contactLine(t, "mail", L("‏hello@store.com", "hello@store.com"), L("البريد", "Email"), "mailto:hello@store.com"),
                    contactLine(t, "map-pin", L("١٢ شارع النيل، الزمالك، القاهرة", "12 Nile St, Zamalek, Cairo"), L("العنوان", "Address")),
                  ],
                  { label: L("التواصل", "Contact"), role: "contact", style: { gap: 2 }, tablet: { colSpan: 2 }, mobile: { colSpan: 2 } },
                ),
              ],
              {
                label: L("الأعمدة", "Columns"),
                columns: { desktop: 4, tablet: 2, mobile: 2 },
                style: { gap: 40 },
                tablet: { gap: 32 },
                mobile: { gap: 28 },
              },
            ),
            t.divider({ style: { marginTop: 40, marginBottom: 20, opacity: 20 } }),
            t.row(
              [
                t.text(COPYRIGHT, { role: "copyright", style: { ...SOFT, fontSize: "xs" } }),
                t.row(
                  PAYMENTS.map((p) =>
                    t.badge(p, { style: { background: "background", color: "foreground", borderWidth: 1, borderColor: "border", radius: 6 } }),
                  ),
                  { label: L("طرق الدفع", "Payment methods"), role: "payments", style: { gap: 8 }, mobile: { justifyContent: "center" } },
                ),
              ],
              {
                label: L("السطر الأخير", "Bottom bar"),
                style: { justifyContent: "between", gap: 16 },
                mobile: { direction: "column", alignItems: "center", textAlign: "center" },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
