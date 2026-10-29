/**
 * Dark bar (2026-10-29, after the WoodMart "Accessories" demo): one slim
 * near-black bar with the store name at the start, short help links in the
 * middle and the copyright at the end. Phones stack the three, centred.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { STORE_NAME, nav } from "../headers/_shared";
import { COPYRIGHT, HELP_LINKS } from "./_shared";

export const footerDarkBar = defineDesign({
  id: "footer-dark-bar",
  version: 1,
  category: "footers",
  subcategory: "minimal",
  name: L("شريط داكن", "Dark bar"),
  description: L("شريط داكن رفيع: اسم المتجر والروابط وحقوق النشر في سطر.", "A slim dark bar: the store name, links and copyright on one line."),
  keywords: ["footer", "dark", "minimal", "bar", "فوتر", "داكن", "بسيط"],
  tree: (t) =>
    t.section({ label: L("الفوتر", "Footer"), style: { paddingTop: 28, paddingBottom: 28, background: "foreground", color: "background" } }, [
      t.container(
        [
          t.row(
            [
              t.link("/", [t.text(STORE_NAME, { role: "storeName", style: { fontWeight: "extrabold", fontSize: "xl", color: "background" } })], {
                label: L("رابط الرئيسية", "Home link"),
                role: "logo",
                style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 },
              }),
              nav(t, HELP_LINKS, { color: "background", style: { gap: 24, justifyContent: "center" }, mobile: { gap: 16 } }),
              t.text(COPYRIGHT, { style: { color: "background", opacity: 70, fontSize: "sm" } }),
            ],
            { label: L("السطر", "Row"), style: { justifyContent: "between", gap: 20 }, mobile: { direction: "column", alignItems: "center", gap: 14 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
