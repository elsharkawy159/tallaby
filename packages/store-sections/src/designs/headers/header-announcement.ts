/**
 * Announcement stack (library H-c): a brand strip with one message and a
 * highlight badge (never a coupon: templates promise no discounts), then a quiet header with the menu gathered at the end beside
 * the icons. On mobile the message wraps and the menu goes under the bar.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND } from "../_kit";
import { MENU, cartLink, logo, nav, searchLink } from "./_shared";

export const headerAnnouncement = defineDesign({
  id: "header-announcement",
  version: 1,
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
            style: { ...ON_BRAND, fontWeight: "medium" },
          }),
          t.row(
            [t.icon("check", { style: { fontSize: "sm" } }), t.text(L("الدفع عند الاستلام", "Cash on delivery"), { role: "highlight", style: { fontWeight: "bold" } })],
            {
              label: L("الشارة", "Badge"),
              style: {
                gap: 6,
                background: "accent",
                color: "foreground",
                radius: 999,
                paddingTop: 4,
                paddingBottom: 4,
                paddingStart: 12,
                paddingEnd: 12,
                wrap: false,
              },
            },
          ),
        ],
        {
          label: L("شريط الإعلان", "Announcement bar"),
          style: {
            background: "primary",
            color: "primaryInk",
            justifyContent: "center",
            gap: 14,
            paddingTop: 10,
            paddingBottom: 10,
            paddingStart: 16,
            paddingEnd: 16,
          },
        },
      ),
      t.container(
        [
          t.row(
            [
              logo(t),
              t.row([nav(t, MENU.slice(0, 5), { mobile: { hidden: true } }), searchLink(t), cartLink(t)], {
                label: L("النهاية", "End"),
                style: { gap: 12, wrap: false },
              }),
              nav(t, MENU.slice(0, 5), { style: { hidden: true }, tablet: { hidden: true }, mobile: { width: "100%", gap: 16 } }),
            ],
            { label: L("الشريط", "Bar"), style: { justifyContent: "between", gap: 16, paddingTop: 14, paddingBottom: 14 } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
    ]),
});
