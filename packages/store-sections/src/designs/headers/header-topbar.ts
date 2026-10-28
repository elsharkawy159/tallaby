/**
 * Top bar header (2026-10-28): a slim brand-coloured top bar with two short
 * store messages at the start and a "Track your order" link at the end, then
 * one bar with the logo at the start, the menu in the middle and search,
 * account, wishlist and cart at the end. On phones the top bar keeps the
 * first message and the tracking link, and the chrome adds the burger
 * (the menu row is hidden). Messages are store facts only: no prices or codes.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { MENU, cartLink, iconLink, logo, nav, searchLink } from "./_shared";

/** The signed-in customer's orders page, where an order's status lives. */
const TRACK_HREF = "/profile/orders";

export const headerTopbar = defineDesign({
  id: "header-topbar",
  version: 1,
  category: "headers",
  subcategory: "announcement",
  name: L("هيدر بشريط علوي", "Header with top bar"),
  description: L(
    "شريط علوي رفيع برسالتين ورابط تتبع الطلب، ثم الشعار والقائمة والبحث والحساب والسلة في سطر واحد.",
    "A slim top bar with two messages and a track-order link, then the logo, menu, search, account and cart in one bar.",
  ),
  keywords: ["header", "top bar", "announcement", "track order", "messages", "هيدر", "شريط علوي", "إعلان", "تتبع الطلب"],
  tree: (t) =>
    t.section({ label: L("الهيدر", "Header"), style: { paddingTop: 0, paddingBottom: 0, background: "background" }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.box(
        [
          t.container(
            [
              t.row(
                [
                  t.row(
                    [
                      t.row(
                        [
                          t.icon("truck", { style: { color: "primaryInk", fontSize: "sm" } }),
                          t.text(L("توصيل سريع لكل محافظات مصر", "Fast delivery across Egypt"), {
                            label: L("رسالة", "Message"),
                            style: { color: "primaryInk", fontSize: "xs", fontWeight: "medium" },
                          }),
                        ],
                        { label: L("الرسالة الأولى", "First message"), style: { gap: 6, wrap: false, alignItems: "center" } },
                      ),
                      t.row(
                        [
                          t.icon("check", { style: { color: "primaryInk", fontSize: "sm" } }),
                          t.text(L("الدفع عند الاستلام", "Cash on delivery"), {
                            label: L("رسالة", "Message"),
                            style: { color: "primaryInk", fontSize: "xs", fontWeight: "medium" },
                          }),
                        ],
                        { label: L("الرسالة الثانية", "Second message"), style: { gap: 6, wrap: false, alignItems: "center" }, mobile: { hidden: true } },
                      ),
                    ],
                    { label: L("الرسائل", "Messages"), style: { gap: 24, wrap: false, alignItems: "center" } },
                  ),
                  t.link(
                    TRACK_HREF,
                    [
                      t.row(
                        [
                          t.icon("package", { style: { color: "primaryInk", fontSize: "sm" } }),
                          t.text(L("تتبّع طلبك", "Track your order"), { style: { color: "primaryInk", fontSize: "xs", fontWeight: "semibold", underline: true } }),
                        ],
                        { label: L("نص الرابط", "Link text"), style: { gap: 6, wrap: false, alignItems: "center" } },
                      ),
                    ],
                    { label: L("تتبع الطلب", "Track order"), role: "link", style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 } },
                  ),
                ],
                { label: L("محتوى الشريط", "Bar content"), style: { justifyContent: "between", alignItems: "center", gap: 16, wrap: false } },
              ),
            ],
            { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
          ),
        ],
        {
          role: "announcement",
          label: L("الشريط العلوي", "Top bar"),
          style: { background: "primary", paddingTop: 8, paddingBottom: 8 },
        },
      ),
      t.container(
        [
          t.row(
            [
              logo(t, { mark: false }),
              nav(t, MENU, { style: { gap: 28, justifyContent: "center" }, mobile: { hidden: true } }),
              t.row(
                [
                  searchLink(t),
                  iconLink(t, "user", "/profile", L("حسابي", "Account"), { mobile: { hidden: true } }),
                  iconLink(t, "heart", "/profile/wishlist", L("المفضلة", "Wishlist"), { mobile: { hidden: true } }),
                  cartLink(t),
                ],
                { label: L("الأدوات", "Actions"), style: { gap: 0, justifyContent: "end", wrap: false } },
              ),
            ],
            { label: L("الشريط", "Bar"), style: { justifyContent: "between", alignItems: "center", gap: 16, paddingTop: 14, paddingBottom: 14 }, mobile: { gap: 8, paddingTop: 8, paddingBottom: 8 } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
      t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
    ]),
});
