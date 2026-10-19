/**
 * Brand bar (Modular set): a solid brand-coloured bar with the logo on the
 * start side, a paper search pill in the middle and a sun cart pill on the end
 * side. On mobile the search drops to a second row inside the bar.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { logo } from "./_shared";

export const headerBrandBar = defineDesign({
  id: "header-brand-bar",
  version: 1,
  category: "headers",
  subcategory: "commerce",
  name: L("شريط البراند", "Brand bar"),
  description: L("شريط بلون المتجر فيه بحث أبيض وزر سلة ملوّن.", "A brand-coloured bar with a white search pill and a bright cart button."),
  keywords: ["header", "brand", "bold", "search", "cart", "هيدر", "بحث", "سلة"],
  tree: (t) =>
    t.section(
      {
        label: L("الهيدر", "Header"),
        style: {
          paddingTop: 0,
          paddingBottom: 0,
          background: "primary",
          color: "primaryInk",
        },
      },
      [
        t.container(
          [
            t.row(
              [
                logo(t, { onBrand: true }),
                t.stack(
                  [
                    t.link(
                      "/products",
                      [
                        t.row(
                          [
                            t.icon("search", {
                              style: { fontSize: "lg", color: "muted" },
                            }),
                            t.text(L("ابحث في المتجر", "Search the store"), {
                              style: { color: "muted" },
                            }),
                          ],
                          {
                            label: L("المحتوى", "Content"),
                            style: { gap: 10, wrap: false },
                          },
                        ),
                      ],
                      {
                        label: L("البحث", "Search"),
                        role: "search",
                        style: {
                          background: "background",
                          radius: 999,
                          paddingTop: 12,
                          paddingBottom: 12,
                          paddingStart: 18,
                          paddingEnd: 18,
                        },
                      },
                    ),
                  ],
                  {
                    label: L("خانة البحث", "Search box"),
                    style: { width: "54%" },
                    mobile: { width: "100%", order: 3 },
                  },
                ),
                t.link(
                  "/cart",
                  [
                    t.row(
                      [
                        t.icon("shopping-bag", {
                          style: { fontSize: "lg", color: "foreground" },
                        }),
                        t.text(L("السلة", "Cart"), {
                          style: {
                            fontWeight: "semibold",
                            color: "foreground",
                          },
                        }),
                      ],
                      {
                        label: L("المحتوى", "Content"),
                        style: { gap: 8, wrap: false },
                      },
                    ),
                  ],
                  {
                    label: L("السلة", "Cart"),
                    role: "cart",
                    style: {
                      background: "accent",
                      radius: 999,
                      paddingTop: 12,
                      paddingBottom: 12,
                      paddingStart: 18,
                      paddingEnd: 18,
                      hover: { opacity: 90 },
                    },
                  },
                ),
              ],
              {
                label: L("الشريط", "Bar"),
                style: {
                  justifyContent: "between",
                  gap: 24,
                  paddingTop: 16,
                  paddingBottom: 16,
                },
                mobile: { gap: 10, paddingTop: 12, paddingBottom: 12 },
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
