/**
 * App banner (library PU-d), drawn inline: a slim paper strip with the app's
 * initial on a brand tile, the app name with stars and a typed "4.8 · Free"
 * line, and an "Open" pill that links to the app (the seller pastes the
 * app-store link). The seller types the name and rating line; there is no
 * close icon, because the strip is part of the page, not a dismissable banner.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { pillButton } from "../_modular";

export const popupApp = defineDesign({
  id: "popup-app",
  version: 1,
  category: "popups",
  subcategory: "app",
  name: L("نزّل التطبيق", "App banner"),
  description: L("شريط رفيع فيه أيقونة تطبيقك واسمه وتقييمه وزر يفتحه.", "A slim strip with your app's icon, name, rating and an open button."),
  keywords: ["popup", "app", "banner", "download", "mobile", "تطبيق", "نزّل", "شريط"],
  tree: (t) =>
    t.section(
      {
        label: L("شريط التطبيق", "App banner"),
        style: { paddingTop: 10, paddingBottom: 10, background: "background" },
        mobile: { paddingTop: 10, paddingBottom: 10 },
      },
      [
        t.container(
          [
            t.row(
              [
                t.row(
                  [
                    t.box(
                      [
                        t.text(L("ت", "T"), {
                          style: { fontWeight: "bold", fontSize: "2xl", color: "primaryInk", textAlign: "center", fontFamily: "heading" },
                          mobile: { fontSize: "xl" },
                        }),
                      ],
                      {
                        label: L("أيقونة التطبيق", "App icon"),
                        style: { background: "primary", radius: 14, width: "52px", paddingTop: 8, paddingBottom: 8 },
                        mobile: { width: "44px", paddingTop: 6, paddingBottom: 6 },
                      },
                    ),
                    t.stack(
                      [
                        t.text(L("تطبيق المتجر", "Store app"), { role: "title", style: { fontWeight: "semibold", fontFamily: "heading" } }),
                        t.row(
                          [
                            t.row(
                              [1, 2, 3, 4, 5].map(() => t.icon("star", { style: { color: "accent", fontSize: "xs" } })),
                              { label: L("النجوم", "Stars"), style: { gap: 1, wrap: false } },
                            ),
                            t.text(L("٤٫٨ · مجاني", "4.8 · Free"), { style: { fontSize: "xs", color: "muted" } }),
                          ],
                          { label: L("التقييم والسعر", "Rating and price"), style: { gap: 6, alignItems: "center", wrap: false } },
                        ),
                      ],
                      { label: L("اسم التطبيق", "App name"), style: { gap: 2 } },
                    ),
                  ],
                  { label: L("التطبيق", "App"), style: { gap: 14, alignItems: "center", wrap: false }, mobile: { gap: 10 } },
                ),
                pillButton(t, L("افتح", "Open"), "https://play.google.com/store/apps", {
                  style: { paddingTop: 9, paddingBottom: 9, paddingStart: 20, paddingEnd: 20 },
                }),
              ],
              {
                label: L("الشريط", "Strip"),
                style: { gap: 14, alignItems: "center", justifyContent: "between", wrap: false, minHeight: 56 },
                mobile: { gap: 10 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
