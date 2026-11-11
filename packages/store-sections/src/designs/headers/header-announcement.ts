/**
 * Announcement stack (library H-c): a brand strip with one message and a
 * highlight badge (never a coupon: templates promise no discounts), then a quiet header with the menu gathered at the end beside
 * the icons. On mobile the message wraps and the menu goes under the bar.
 *
 * v2 (look-first pilot, F-89): a slim one-line strip (the highlight is a
 * quiet tick and words, no pill, and leaves phones to the message alone),
 * the store name as a wordmark, a quieter menu and a hairline under the bar.
 * Same nodes, labels and links as v1.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND } from "../_kit";
import { MENU, QUIET_LINK, WORDMARK, cartLink, logo, nav, searchLink } from "./_shared";

export const headerAnnouncement = defineDesign({
  id: "header-announcement",
  version: 2,
  category: "headers",
  subcategory: "announcement",
  name: L("شريط إعلان وهيدر", "Announcement header"),
  description: L("شريط ملون برسالة وشارة فوق هيدر هادئ.", "A coloured strip with a message and a badge over a quiet header."),
  keywords: ["header", "announcement", "badge", "إعلان", "شارة", "هيدر"],
  tree: (t) =>
    t.section({ label: L("الهيدر", "Header"), style: { paddingTop: 0, paddingBottom: 0, background: "background" }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.row(
        [
          t.text(L("توصيل مجاني للطلبات فوق ١٥٠٠ ج.م", "Free delivery on orders over EGP 1,500"), {
            role: "announcement",
            style: { ...ON_BRAND, fontWeight: "medium", fontSize: "sm" },
            mobile: { fontSize: "xs", textAlign: "center" },
          }),
          t.row(
            [
              t.icon("check", { style: { fontSize: "sm", color: "primaryInk" } }),
              t.text(L("الدفع عند الاستلام", "Cash on delivery"), { role: "highlight", style: { ...ON_BRAND, fontWeight: "medium", fontSize: "sm" } }),
            ],
            {
              label: L("الشارة", "Badge"),
              style: { gap: 6, color: "primaryInk", opacity: 85, wrap: false, alignItems: "center" },
              mobile: { hidden: true },
            },
          ),
        ],
        {
          label: L("شريط الإعلان", "Announcement bar"),
          style: {
            background: "primary",
            color: "primaryInk",
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
            paddingTop: 8,
            paddingBottom: 8,
            paddingStart: 16,
            paddingEnd: 16,
          },
        },
      ),
      t.container(
        [
          t.row(
            [
              logo(t, { size: "2xl", nameStyle: WORDMARK }),
              t.row([nav(t, MENU.slice(0, 5), { textStyle: QUIET_LINK, style: { gap: 32, marginEnd: 20 }, mobile: { hidden: true } }), searchLink(t), cartLink(t)], {
                label: L("النهاية", "End"),
                style: { gap: 4, wrap: false, alignItems: "center" },
              }),
              nav(t, MENU.slice(0, 5), { style: { hidden: true }, tablet: { hidden: true }, mobile: { width: "100%", gap: 16 } }),
            ],
            {
              label: L("الشريط", "Bar"),
              style: { justifyContent: "between", alignItems: "center", gap: 16, paddingTop: 16, paddingBottom: 16 },
              mobile: { paddingTop: 8, paddingBottom: 8 },
            },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
      t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
    ]),
});
