/**
 * Logo and menu in one line (Claude Design premium set, header
 * `headerInline`): one slim bar with the store name at the start, the menu in
 * the middle and search, account and cart at the end, over a hairline. On
 * phones the chrome adds the burger before the logo and hides the menu:
 * burger, logo, search and cart in one row.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { MENU, cartLink, iconLink, logo, nav, searchLink } from "./_shared";

export const headerInline = defineDesign({
  id: "header-inline",
  version: 1,
  category: "headers",
  subcategory: "minimal",
  name: L("لوجو ومنيو في سطر", "Logo and menu in one line"),
  description: L(
    "شريط واحد رفيع: الشعار في البداية والقائمة في النص والأيقونات في الآخر.",
    "One slim bar: the logo at the start, the menu in the middle and the icons at the end.",
  ),
  keywords: ["header", "inline", "slim", "modern", "menu", "هيدر", "سطر واحد", "قائمة", "عصري"],
  tree: (t) =>
    t.section({ label: L("الهيدر", "Header"), style: { paddingTop: 0, paddingBottom: 0, background: "background" }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.container(
        [
          t.row(
            [
              logo(t, { mark: false }),
              nav(t, MENU, { style: { gap: 28, justifyContent: "center", wrap: false }, tablet: { gap: 18 }, mobile: { hidden: true } }),
              t.row(
                [searchLink(t), iconLink(t, "user", "/profile", L("حسابي", "Account"), { mobile: { hidden: true } }), cartLink(t)],
                { label: L("الأدوات", "Actions"), style: { gap: 0, wrap: false } },
              ),
            ],
            {
              label: L("الشريط", "Bar"),
              style: { justifyContent: "between", gap: 24, wrap: false, paddingTop: 14, paddingBottom: 14 },
              mobile: { gap: 4, paddingTop: 8, paddingBottom: 8 },
            },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
      t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
    ]),
});
