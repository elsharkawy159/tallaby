/**
 * Search hero (Modular set): a centred headline over one large, working
 * search field (owner, 2026-10-27: no popular-search chips). The field is a
 * search link holding one icon and its placeholder, so the storefront draws a
 * live search there: typing lists the store's matching products, Enter opens
 * the results page (`/products?search=…`). A preview with no live search gets
 * a plain search form that opens the same page (`elements/render.tsx`).
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const heroSearch = defineDesign({
  id: "hero-search",
  version: 2,
  category: "hero",
  subcategory: "full-width",
  name: L("بحث أولاً", "Search hero"),
  description: L("عنوان في المنتصف وتحته خانة بحث كبيرة شغالة.", "A centred headline over a large, working search field."),
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
                            t.text(L("اكتب اسم المنتج", "Type a product name"), {
                              style: { color: "muted", fontSize: "lg", textAlign: "center" },
                            }),
                            t.icon("search", {
                              style: { fontSize: "xl", color: "primary" },
                            }),
                          ],
                          {
                            label: L("الخانة", "Field"),
                            style: { gap: 12, wrap: false, justifyContent: "center" },
                          },
                        ),
                      ],
                      {
                        label: L("خانة البحث", "Search field"),
                        role: "search",
                        style: {
                          background: "background",
                          color: "foreground",
                          textAlign: "center",
                          fontSize: "lg",
                          radius: 999,
                          borderWidth: 1,
                          borderColor: "border",
                          shadow: "md",
                          // The start padding is the end padding plus the icon and its gap, so the
                          // placeholder sits in the true centre of the field (owner, 2026-10-27).
                          paddingTop: 18,
                          paddingBottom: 18,
                          paddingStart: 56,
                          paddingEnd: 24,
                          hover: { borderColor: "primary" },
                        },
                        mobile: { paddingTop: 14, paddingBottom: 14, paddingStart: 48, paddingEnd: 18 },
                      },
                    ),
                  ],
                  {
                    label: L("البحث", "Search"),
                    style: { width: "100%", maxWidth: "680px" },
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
