/**
 * Ruled bar (Modular set): one rounded hairline bar split into three ruled
 * cells: menu links on the start side, the logo centred between two rules,
 * and search and cart on the end side. On mobile the menu becomes one icon.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { RULED, RULED_CELL } from "../_modular";
import { MENU, cartLink, iconLink, logo, nav, searchLink } from "./_shared";

const CELL = {
  ...RULED_CELL,
  paddingTop: 10,
  paddingBottom: 10,
  paddingStart: 22,
  paddingEnd: 22,
};

export const headerRuled = defineDesign({
  id: "header-ruled",
  version: 1,
  category: "headers",
  subcategory: "centered-logo",
  name: L("شريط مقسم", "Ruled bar"),
  description: L("شريط بخطوط رفيعة من ثلاث خانات: القائمة والشعار في المنتصف والسلة.", "A hairline bar in three cells: menu, a centred logo, and cart."),
  keywords: ["header", "ruled", "centered", "minimal", "هيدر", "شعار", "بسيط"],
  tree: (t) =>
    t.section(
      {
        label: L("الهيدر", "Header"),
        style: { paddingTop: 14, paddingBottom: 14, background: "background" },
      },
      [
        t.container(
          [
            t.grid(
              [
                t.row(
                  [
                    nav(t, MENU.slice(0, 3), {
                      style: { gap: 20 },
                      tablet: { hidden: true },
                      mobile: { hidden: true },
                    }),
                    iconLink(t, "menu", "/products", L("القائمة", "Menu"), {
                      style: { hidden: true },
                      tablet: { hidden: false },
                    }),
                  ],
                  {
                    label: L("خانة القائمة", "Menu cell"),
                    style: { ...CELL, gap: 8 },
                    mobile: { paddingStart: 8, paddingEnd: 8 },
                  },
                ),
                t.row([logo(t, { size: "lg" })], {
                  label: L("خانة الشعار", "Logo cell"),
                  style: { ...CELL, justifyContent: "center" },
                  mobile: { paddingStart: 8, paddingEnd: 8 },
                }),
                t.row([searchLink(t), cartLink(t)], {
                  label: L("خانة الأيقونات", "Icon cell"),
                  style: {
                    ...CELL,
                    justifyContent: "end",
                    gap: 2,
                    wrap: false,
                    paddingStart: 10,
                    paddingEnd: 10,
                  },
                  mobile: { paddingStart: 4, paddingEnd: 4 },
                }),
              ],
              {
                label: L("الشريط", "Bar"),
                columns: { desktop: 3, mobile: 3 },
                style: { ...RULED, radius: 999, alignItems: "stretch" },
              },
            ),
          ],
          {
            label: L("الحاوية", "Container"),
            style: { paddingTop: 0, paddingBottom: 0 },
          },
        ),
      ],
    ),
});
