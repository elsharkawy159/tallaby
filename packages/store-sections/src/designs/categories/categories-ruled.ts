/**
 * Ruled list (Modular set): the store's categories as an editorial index,
 * each with its photo, name and product count, so the names lead and the
 * photos support them.
 *
 * v2 (look-first pilot, 2026-11-11, docs/systems/plan.md §10 L7): v1 was a
 * boxed table with a 72px round photo in each cell, which read as a settings
 * list. Now each entry is a portrait photo at the start, the name and count
 * in calm type beside it and a small arrow at the end, over one hairline (no
 * outer box, so a short last row leaves no grey cells). Three across on
 * desktop, two on tablets and one column on phones. The heading is the quiet
 * one the product sections use, with "View all". The card's nodes keep v1's
 * order (the photo is still last in the tree and moves to the start with
 * `order`); the heading's dot label is gone, so the layout boxes after it are
 * renumbered.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";
import { CATEGORY_LINK, CATEGORY_SECTION, categoryHead } from "./_shared";

export const categoriesRuled = defineDesign({
  id: "categories-ruled",
  version: 2,
  category: "categories",
  subcategory: "grid",
  name: L("فهرس الأقسام", "Ruled list"),
  description: L(
    "أقسام متجرك كفهرس هادئ: صورة طولية واسم القسم وعدد منتجاته فوق خط رفيع.",
    "Your categories as a quiet index: a portrait photo, the name and its product count over a hairline.",
  ),
  keywords: ["categories", "grid", "ruled", "list", "index", "editorial", "minimal", "أقسام", "شبكة", "فهرس"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories"), ...CATEGORY_SECTION }, [
      t.container(
        [
          // The head row and the link row stay unnamed: they take v1's `box-2` and `box-3`, so the card keeps `box-4`…`box-6`.
          categoryHead(t, { eyebrow: L("الأقسام", "Categories"), title: L("تسوق بالقسم", "Shop by category"), link: { href: CATEGORY_LINK } }, { link: "viewAll", linkText: "viewAllText" }),
          t.categoryList(
            [
              t.link(
                CATEGORY_LINK,
                [
                  t.row(
                    [
                      t.stack(
                        [
                          t.text(L("اسم القسم", "Category"), { bind: "name", style: { fontWeight: "medium", fontSize: "lg", lineHeight: "snug" }, mobile: { fontSize: "md" } }),
                          t.row(
                            [
                              t.text(L("١٢", "12"), { bind: "productCount", style: { color: "muted", fontSize: "sm" } }),
                              t.text(L("منتج", "items"), { style: { color: "muted", fontSize: "sm" } }),
                            ],
                            { label: L("العدد", "Count"), style: { gap: 4 } },
                          ),
                        ],
                        { label: L("الاسم", "Name"), style: { gap: 4, width: "100%" } },
                      ),
                      t.image("", L("صورة القسم", "Category photo"), {
                        bind: "image",
                        // First on the row (the start side), though last in the tree.
                        style: { aspectRatio: "portrait", objectFit: "cover", radius: 4, width: "96px", background: "secondary", order: -1 },
                        mobile: { width: "64px", aspectRatio: "square" },
                      }),
                      t.icon("arrow", { style: { fontSize: "md", color: "muted" } }),
                    ],
                    { label: L("المحتوى", "Content"), style: { alignItems: "center", gap: 20, wrap: false }, mobile: { gap: 16 } },
                  ),
                  t.divider({ label: L("الخط", "Rule"), style: { marginTop: 24, marginBottom: 0 }, mobile: { marginTop: 16 } }),
                ],
                {
                  label: L("قسم", "Category"),
                  bind: "href",
                  style: { ...FLUSH, color: "foreground", hover: { opacity: 70 } },
                },
              ),
            ],
            {
              label: L("الأقسام", "Categories"),
              role: "items",
              limit: 6,
              columns: { desktop: 3, tablet: 2, mobile: 1 },
              style: { gap: 24 },
              mobile: { gap: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
