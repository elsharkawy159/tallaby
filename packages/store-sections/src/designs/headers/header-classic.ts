/**
 * Classic header (library H-a, Classic template): a dark announcement line,
 * then one bar with the logo mark and name, pill menu links with the current
 * page tinted, a rounded search box and the cart button. On mobile the menu
 * moves to its own swipe-free wrapped row under the bar.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { cartLink, logo, nav } from "./_shared";

export const headerClassic = defineDesign({
  id: "header-classic",
  version: 1,
  category: "headers",
  subcategory: "commerce",
  name: L("هيدر كلاسيك", "Classic header"),
  description: L("سطر إعلان، ثم الشعار والقائمة ومربع البحث والسلة.", "An announcement line, then the logo, menu, search box and cart."),
  keywords: ["header", "navigation", "menu", "classic", "هيدر", "قائمة", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الهيدر", "Header"), style: { paddingTop: 0, paddingBottom: 0, background: "background" } }, [
      t.text(L("توصيل مجاني للطلبات فوق ١٥٠٠ ج.م", "Free delivery on orders over EGP 1,500"), {
        role: "announcement",
        style: {
          background: "foreground",
          color: "background",
          textAlign: "center",
          fontWeight: "medium",
          paddingTop: 10,
          paddingBottom: 10,
          paddingStart: 16,
          paddingEnd: 16,
        },
      }),
      t.container(
        [
          t.row(
            [
              logo(t),
              nav(t, undefined, { pills: true, mobile: { order: 3, width: "100%", gap: 2 } }),
              t.row(
                [
                  t.link(
                    "/products",
                    [
                      t.row([t.icon("search", { style: { color: "muted" } }), t.text(L("ابحث عن منتج", "Search products"), { style: { color: "muted" } })], {
                        label: L("المحتوى", "Content"),
                        style: { gap: 8, wrap: false },
                      }),
                    ],
                    {
                      label: L("البحث", "Search"),
                      style: { background: "secondary", radius: 999, paddingTop: 10, paddingBottom: 10, paddingStart: 16, paddingEnd: 20 },
                      mobile: { hidden: true },
                    },
                  ),
                  cartLink(t),
                ],
                { label: L("الأدوات", "Actions"), style: { gap: 8, wrap: false } },
              ),
            ],
            { label: L("الشريط", "Bar"), style: { justifyContent: "between", gap: 16, paddingTop: 14, paddingBottom: 14 }, mobile: { gap: 8 } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
    ]),
});
