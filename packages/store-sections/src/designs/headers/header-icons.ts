/**
 * Icon header (2026-10-29, after the WoodMart "Accessories" demo): one clean
 * bar on paper with a thin rule under it: the logo at the start, the menu in
 * the middle and four round icon buttons at the end (search, wishlist,
 * account, cart). Phones keep the logo and icons on the bar and move the menu
 * to its own wrapped row under it.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { cartLink, iconLink, logo, nav, searchLink } from "./_shared";

export const headerIcons = defineDesign({
  id: "header-icons",
  version: 1,
  category: "headers",
  subcategory: "commerce",
  name: L("هيدر بأيقونات", "Icon header"),
  description: L("الشعار والقائمة في النص وأربع أيقونات: بحث ومفضلة وحساب وسلة.", "The logo, a centred menu and four icons: search, wishlist, account and cart."),
  keywords: ["header", "navigation", "menu", "icons", "wishlist", "account", "هيدر", "قائمة", "أيقونات", "مفضلة"],
  tree: (t) =>
    t.section({ label: L("الهيدر", "Header"), style: { paddingTop: 0, paddingBottom: 0, background: "background" }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.container(
        [
          t.row(
            [
              logo(t, { mark: false }),
              nav(t, undefined, { style: { gap: 28, justifyContent: "center" }, mobile: { order: 3, width: "100%", gap: 16 } }),
              t.row(
                [
                  searchLink(t),
                  iconLink(t, "heart", "/profile/wishlist", L("المفضلة", "Wishlist"), { mobile: { hidden: true } }),
                  iconLink(t, "user", "/profile", L("حسابي", "My account"), { mobile: { hidden: true } }),
                  cartLink(t),
                ],
                { label: L("الأيقونات", "Icons"), style: { gap: 4, wrap: false } },
              ),
            ],
            { label: L("الشريط", "Bar"), style: { justifyContent: "between", gap: 16, paddingTop: 16, paddingBottom: 16 }, mobile: { gap: 8 } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
      t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
    ]),
});
