/**
 * Centred logo with an announcement (Claude Design premium set, header
 * `headerCentered`): a deep announcement strip with a scrolling ticker of store promises, then
 * a bar with search at the start, the store name centred and account,
 * wishlist and cart at the end, and the menu centred on its own row under it
 * on tablet and desktop. On phones the chrome adds the burger before search
 * and hides the menu row: burger and search, logo, cart in one row.
 *
 * The strip scrolls its messages as a ticker (the `marquee` element): still
 * and wrapped with reduced motion or Theme › Animations off.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { MENU, STORE_NAME, cartLink, iconLink, nav, searchLink } from "./_shared";

/** Store promises that scroll in the strip (store facts only: no prices or codes). */
const ANNOUNCEMENTS = [
  L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
  L("الدفع عند الاستلام", "Cash on delivery"),
  L("استبدال سهل خلال ١٤ يوم", "Easy exchange within 14 days"),
];

export const headerCenteredTicker = defineDesign({
  id: "header-centered-ticker",
  version: 1,
  category: "headers",
  subcategory: "centered-logo",
  name: L("لوجو في النص مع إعلان", "Centred logo with announcement"),
  description: L(
    "شريط إعلان داكن، ثم اسم المتجر في النص والبحث والسلة على الجانبين، والقائمة في سطر تحته.",
    "A dark announcement strip, then the store name centred between search and cart, with the menu on a row below.",
  ),
  keywords: ["header", "centered", "logo", "announcement", "boutique", "fashion", "هيدر", "لوجو", "منتصف", "إعلان"],
  tree: (t) =>
    t.section({ label: L("الهيدر", "Header"), style: { paddingTop: 0, paddingBottom: 0, background: "background" }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.box(
        [
          t.marquee(
            ANNOUNCEMENTS.flatMap((text) => [
              t.text(text, { label: L("رسالة", "Message"), style: { color: "background", fontSize: "xs", fontWeight: "medium" } }),
              t.icon("sparkles", { label: L("فاصل", "Separator"), style: { color: "background", fontSize: "xs", opacity: 60 } }),
            ]),
            { label: L("الرسائل", "Messages"), speed: 40, style: { gap: 28, alignItems: "center" } },
          ),
        ],
        {
          role: "announcement",
          label: L("شريط الإعلان", "Announcement bar"),
          style: { background: "foreground", paddingTop: 10, paddingBottom: 10 },
        },
      ),
      t.container(
        [
          t.grid(
            [
              t.row([searchLink(t)], { label: L("البداية", "Start"), style: { gap: 0, wrap: false } }),
              t.link(
                "/",
                [
                  t.stack(
                    [
                      t.text(STORE_NAME, {
                        role: "storeName",
                        style: { fontWeight: "bold", fontSize: "2xl", textAlign: "center", letterSpacing: "tight" },
                        mobile: { fontSize: "xl" },
                      }),
                    ],
                    { label: L("الشعار", "Logo"), style: { gap: 0, alignItems: "center" } },
                  ),
                ],
                { label: L("رابط الرئيسية", "Home link"), role: "logo", style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 } },
              ),
              t.row(
                [
                  iconLink(t, "user", "/profile", L("حسابي", "Account"), { mobile: { hidden: true } }),
                  iconLink(t, "heart", "/profile/wishlist", L("المفضلة", "Wishlist"), { mobile: { hidden: true } }),
                  cartLink(t),
                ],
                { label: L("الأدوات", "Actions"), style: { gap: 0, justifyContent: "end", wrap: false } },
              ),
            ],
            {
              label: L("الشريط", "Bar"),
              columns: { desktop: 3, tablet: 3, mobile: 3 },
              style: { gap: 8, alignItems: "center", paddingTop: 14, paddingBottom: 6 },
              mobile: { gap: 4, paddingTop: 8, paddingBottom: 8 },
            },
          ),
          nav(t, MENU, {
            style: { gap: 28, justifyContent: "center", paddingBottom: 12 },
            mobile: { hidden: true },
          }),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
      t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
    ]),
});
