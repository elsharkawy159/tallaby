/**
 * Centered crest (library H-b): three columns, the menu split around a large
 * centred store name with a tagline under it, search and cart at the end.
 * On mobile the name stays centred and the menu wraps under it.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { MENU, STORE_NAME, cartLink, nav, searchLink } from "./_shared";

export const headerCentered = defineDesign({
  id: "header-centered",
  version: 1,
  category: "headers",
  subcategory: "centered-logo",
  name: L("شعار في المنتصف", "Centered crest"),
  description: L("اسم المتجر كبير في المنتصف بشعار قصير، والقائمة على الجانبين.", "The store name large in the centre with a tagline, the menu on both sides."),
  keywords: ["header", "centered", "logo", "boutique", "هيدر", "شعار", "منتصف"],
  tree: (t) =>
    t.section({ label: L("الهيدر", "Header"), style: { paddingTop: 0, paddingBottom: 0, background: "background" } }, [
      t.container(
        [
          t.grid(
            [
              nav(t, MENU.slice(0, 3), { mobile: { hidden: true } }),
              t.link(
                "/",
                [
                  t.stack(
                    [
                      t.text(STORE_NAME, {
                        role: "storeName",
                        style: { fontWeight: "extrabold", fontSize: "3xl", textAlign: "center", letterSpacing: "tight" },
                        mobile: { fontSize: "xl" },
                      }),
                      t.text(L("مختارات بعناية منذ ٢٠١٨", "Carefully curated since 2018"), {
                        style: { color: "muted", fontSize: "xs", textAlign: "center", letterSpacing: "wide" },
                      }),
                    ],
                    { label: L("الشعار", "Crest"), style: { gap: 2, alignItems: "center" } },
                  ),
                ],
                { label: L("رابط الرئيسية", "Home link"), role: "logo", style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 } },
              ),
              t.row([nav(t, MENU.slice(3), { mobile: { hidden: true } }), searchLink(t), cartLink(t)], {
                label: L("النهاية", "End"),
                style: { gap: 8, justifyContent: "end", wrap: false },
              }),
            ],
            { label: L("الشريط", "Bar"), columns: { desktop: 3, mobile: 3 }, style: { gap: 16, alignItems: "center", paddingTop: 18, paddingBottom: 18 } },
          ),
          nav(t, MENU, { style: { hidden: true }, tablet: { hidden: true }, mobile: { justifyContent: "center", gap: 16, paddingBottom: 12 } }),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
    ]),
});
