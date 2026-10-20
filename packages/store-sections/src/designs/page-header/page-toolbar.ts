/**
 * Toolbar header (Modular set): a breadcrumb, then one hairline bar with the
 * title and count in the first cell and quick filter chips in the second. For
 * large collections where filtering matters more than imagery. Each chip links
 * to the shop; the title and count are typed by the seller.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { RULED, RULED_CELL, chip } from "../_modular";
import { crumbs } from "./_crumbs";

const FILTERS = [L("وصل حديثًا", "New"), L("عليه خصم", "On sale"), L("تحت ٥٠٠ ج.م", "Under EGP 500"), L("متاح", "In stock")];

export const pageToolbar = defineDesign({
  id: "page-toolbar",
  version: 1,
  category: "page-header",
  subcategory: "title",
  name: L("عنوان وأدوات", "Toolbar header"),
  description: L("عنوان القسم وعدد المنتجات وشرائح فلترة سريعة في شريط واحد.", "The collection title, count and quick filter chips in one bar."),
  keywords: ["page header", "collection", "filters", "toolbar", "عنوان", "فلترة", "قسم"],
  tree: (t) =>
    t.section(
      {
        label: L("عنوان الصفحة", "Page header"),
        style: { paddingTop: 24, paddingBottom: 24 },
      },
      [
        t.container(
          [
            crumbs(t, [], L("سماعات", "Audio")),
            t.grid(
              [
                t.stack(
                  [
                    t.heading(L("سماعات", "Audio"), "h1", {
                      role: "title",
                      style: { fontSize: "3xl" },
                    }),
                    t.text(L("٢٤ منتج", "24 products"), {
                      role: "count",
                      style: { color: "muted", fontSize: "sm" },
                    }),
                  ],
                  {
                    label: L("العنوان", "Title cell"),
                    style: {
                      ...RULED_CELL,
                      gap: 2,
                      justifyContent: "center",
                      paddingTop: 18,
                      paddingBottom: 18,
                      paddingStart: 24,
                      paddingEnd: 24,
                    },
                  },
                ),
                t.row(
                  FILTERS.map((f, i) => chip(t, f, "/products", { active: i === 1 })),
                  {
                    label: L("الفلاتر", "Filters"),
                    role: "items",
                    style: {
                      ...RULED_CELL,
                      colSpan: 2,
                      gap: 8,
                      alignItems: "center",
                      paddingTop: 16,
                      paddingBottom: 16,
                      paddingStart: 20,
                      paddingEnd: 20,
                    },
                    mobile: { colSpan: 1 },
                  },
                ),
              ],
              {
                label: L("الشريط", "Bar"),
                columns: { desktop: 3, mobile: 1 },
                style: { ...RULED, marginTop: 14 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
