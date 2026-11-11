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
 *
 * v2 (look-first pilot, F-89): a slimmer strip with small dots between the
 * messages, the store name as a wordmark in the heading font, a quieter menu
 * row and more air around the bar. Same nodes, labels and links as v1.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { MENU, QUIET_LINK, STORE_NAME, WORDMARK, cartLink, iconLink, nav, searchLink } from "./_shared";

/** Store promises that scroll in the strip (store facts only: no prices or codes). */
const ANNOUNCEMENTS = [
  L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
  L("الدفع عند الاستلام", "Cash on delivery"),
  L("استبدال سهل خلال ١٤ يوم", "Easy exchange within 14 days"),
];

export const headerCenteredTicker = defineDesign({
  id: "header-centered-ticker",
  version: 2,
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
              t.text(text, { label: L("رسالة", "Message"), style: { color: "background", fontSize: "xs", fontWeight: "medium", textTransform: "uppercase" } }),
              // A dot now. Its role keeps the field names the v1 icons had (`icon`, `icon-2`, `icon-3`), so every other name stays.
              t.box([], { label: L("فاصل", "Separator"), role: "icon", style: { background: "background", radius: 999, width: "4px", minHeight: 4, opacity: 50 } }),
            ]),
            { label: L("الرسائل", "Messages"), speed: 45, style: { gap: 36, alignItems: "center" } },
          ),
        ],
        {
          role: "announcement",
          label: L("شريط الإعلان", "Announcement bar"),
          style: { background: "foreground", paddingTop: 7, paddingBottom: 7 },
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
                        style: { ...WORDMARK, fontSize: "3xl", textAlign: "center" },
                        mobile: { fontSize: "2xl" },
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
              style: { gap: 8, alignItems: "center", paddingTop: 20, paddingBottom: 10 },
              mobile: { gap: 4, paddingTop: 10, paddingBottom: 10 },
            },
          ),
          nav(t, MENU, {
            color: "muted",
            textStyle: QUIET_LINK,
            style: { gap: 36, justifyContent: "center", paddingBottom: 14 },
            mobile: { hidden: true },
          }),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
      t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
    ]),
});
