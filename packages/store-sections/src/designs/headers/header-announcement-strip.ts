/**
 * Announcement strip header (2026-10-30, after the Void Fashion store on
 * EasyOrders): a slim black strip with three short store promises in one
 * centred row, over one white bar with the store name at the start, the menu
 * in the middle and search, account and cart at the end. Promises only, never
 * a coupon. On phones the strip keeps the first promise and the menu hides
 * (the chrome adds the burger).
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";
import { MENU, cartLink, iconLink, logo, nav, searchLink } from "./_shared";

const MESSAGES: readonly DesignText[] = [
  L("أهلًا بيك في متجرنا", "Welcome to our store"),
  L("شحن مجاني للطلبات الكبيرة", "Free shipping on larger orders"),
  L("تفاصيل بتفرق", "Details that make a difference"),
];

const message = (t: TreeBuilder, text: DesignText, i: number) =>
  t.text(text, {
    label: L("رسالة", "Message"),
    style: { color: "white", fontSize: "sm", fontWeight: "medium", textAlign: "center" },
    mobile: { fontSize: "xs", ...(i > 0 && { hidden: true }) },
    tablet: i > 1 ? { hidden: true } : {},
  });

export const headerAnnouncementStrip = defineDesign({
  id: "header-announcement-strip",
  version: 1,
  category: "headers",
  subcategory: "announcement",
  name: L("شريط رسائل أسود", "Black announcement strip"),
  description: L(
    "شريط أسود رفيع فيه ثلاث رسائل في سطر واحد، وتحته هيدر أبيض: الشعار والقائمة في النص والأيقونات.",
    "A slim black strip with three messages in one row, over a white bar: logo, centred menu and icons.",
  ),
  keywords: ["header", "announcement", "strip", "ticker", "messages", "fashion", "هيدر", "شريط", "رسائل", "إعلان"],
  tree: (t) =>
    t.section({ label: L("الهيدر", "Header"), style: { paddingTop: 0, paddingBottom: 0, background: "background" }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.box(
        [
          t.container(
            [t.row(MESSAGES.map((text, i) => message(t, text, i)), { label: L("الرسائل", "Messages"), style: { gap: 48, justifyContent: "center", wrap: false }, tablet: { gap: 28 }, mobile: { gap: 0 } })],
            { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
          ),
        ],
        { label: L("شريط الرسائل", "Message strip"), style: { background: "black", paddingTop: 11, paddingBottom: 11 }, mobile: { paddingTop: 9, paddingBottom: 9 } },
      ),
      t.container(
        [
          t.row(
            [
              logo(t, { mark: false, size: "2xl" }),
              nav(t, MENU, { style: { gap: 28, justifyContent: "center", wrap: false }, tablet: { gap: 18 }, mobile: { hidden: true } }),
              t.row(
                [searchLink(t), iconLink(t, "user", "/profile", L("حسابي", "Account"), { mobile: { hidden: true } }), cartLink(t)],
                { label: L("الأدوات", "Actions"), style: { gap: 0, wrap: false } },
              ),
            ],
            {
              label: L("الشريط", "Bar"),
              style: { justifyContent: "between", gap: 24, wrap: false, paddingTop: 12, paddingBottom: 12 },
              mobile: { gap: 4, paddingTop: 8, paddingBottom: 8 },
            },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
      t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
    ]),
});
