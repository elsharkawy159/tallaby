/**
 * Search hero (Modular set): a centred headline over one large search field
 * and a row of popular searches underneath, on a soft shelf panel. For big
 * catalogues where visitors arrive knowing what they want. The field opens the
 * store's product page, where the search runs.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { chip } from "../_modular";

const POPULAR = [L("وصل حديثًا", "New in"), L("الأكثر مبيعًا", "Best sellers"), L("هدايا", "Gifts"), L("العروض", "Offers")];

export const heroSearch = defineDesign({
  id: "hero-search",
  version: 1,
  category: "hero",
  subcategory: "full-width",
  name: L("بحث أولاً", "Search hero"),
  description: L("عنوان في المنتصف وخانة بحث كبيرة وتحتها الأكثر بحثًا.", "A centred headline over a large search field and popular searches."),
  keywords: ["hero", "search", "catalogue", "practical", "واجهة", "بحث"],
  tree: (t) =>
    t.section(
      {
        label: L("الواجهة", "Hero"),
        style: { paddingTop: 24, paddingBottom: 24 },
      },
      [
        t.container(
          [
            t.stack(
              [
                t.heading(L("بتدور على إيه النهارده؟", "What are you looking for today?"), "h1", {
                  role: "title",
                  style: {
                    fontSize: "display-md",
                    letterSpacing: "tight",
                    textAlign: "center",
                    maxWidth: "18ch",
                  },
                }),
                t.stack(
                  [
                    t.link(
                      "/products",
                      [
                        t.row(
                          [
                            t.row(
                              [
                                t.icon("search", {
                                  style: { fontSize: "xl", color: "muted" },
                                }),
                                t.text(L("اكتب اسم المنتج", "Type a product name"), { style: { color: "muted", fontSize: "lg" } }),
                              ],
                              {
                                label: L("الخانة", "Field"),
                                style: { gap: 12, wrap: false },
                              },
                            ),
                            t.text(L("ابحث", "Search"), {
                              role: "cta",
                              style: {
                                background: "primary",
                                color: "primaryInk",
                                fontWeight: "semibold",
                                radius: 999,
                                paddingTop: 12,
                                paddingBottom: 12,
                                paddingStart: 26,
                                paddingEnd: 26,
                              },
                            }),
                          ],
                          {
                            label: L("المحتوى", "Content"),
                            style: {
                              justifyContent: "between",
                              gap: 12,
                              wrap: false,
                            },
                          },
                        ),
                      ],
                      {
                        label: L("خانة البحث", "Search field"),
                        role: "search",
                        style: {
                          background: "background",
                          radius: 999,
                          borderWidth: 1,
                          borderColor: "border",
                          shadow: "md",
                          paddingTop: 8,
                          paddingBottom: 8,
                          paddingStart: 22,
                          paddingEnd: 8,
                          hover: { borderColor: "primary" },
                        },
                      },
                    ),
                  ],
                  {
                    label: L("البحث", "Search"),
                    style: { width: "100%", maxWidth: "680px" },
                  },
                ),
                t.row(
                  [
                    t.text(L("الأكثر بحثًا", "Popular"), {
                      style: { color: "muted", fontSize: "sm" },
                      mobile: { hidden: true },
                    }),
                    ...POPULAR.map((p) => chip(t, p, "/products")),
                  ],
                  {
                    label: L("الأكثر بحثًا", "Popular searches"),
                    role: "items",
                    style: { gap: 8, justifyContent: "center" },
                  },
                ),
              ],
              {
                label: L("اللوحة", "Panel"),
                style: {
                  background: "secondary",
                  radius: 28,
                  gap: 28,
                  alignItems: "center",
                  paddingTop: 88,
                  paddingBottom: 88,
                  paddingStart: 40,
                  paddingEnd: 40,
                },
                mobile: {
                  paddingTop: 44,
                  paddingBottom: 44,
                  paddingStart: 18,
                  paddingEnd: 18,
                  gap: 20,
                },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
