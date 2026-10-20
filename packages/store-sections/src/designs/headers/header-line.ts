/**
 * One line (library H-a original): logo at the start, the menu right after
 * it, search and cart pushed to the end. On mobile the menu wraps under it.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { cartLink, logo, nav, searchLink } from "./_shared";

export const headerLine = defineDesign({
  id: "header-line",
  version: 1,
  category: "headers",
  subcategory: "minimal",
  name: L("سطر واحد", "One line"),
  description: L("الشعار والقائمة والأيقونات في سطر واحد هادئ.", "Logo, menu and icons on one quiet line."),
  keywords: ["header", "minimal", "menu", "هيدر", "بسيط"],
  tree: (t) =>
    t.section({ label: L("الهيدر", "Header"), style: { paddingTop: 0, paddingBottom: 0, background: "background" } }, [
      t.container(
        [
          t.row(
            [
              t.row([logo(t), nav(t, undefined, { mobile: { hidden: true } })], { label: L("البداية", "Start"), style: { gap: 40, wrap: false } }),
              t.row([searchLink(t), cartLink(t)], { label: L("الأدوات", "Actions"), style: { gap: 4, wrap: false } }),
              nav(t, undefined, { style: { hidden: true }, tablet: { hidden: true }, mobile: { width: "100%", gap: 16 } }),
            ],
            { label: L("الشريط", "Bar"), style: { justifyContent: "between", gap: 16, paddingTop: 16, paddingBottom: 16 } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
    ]),
});
