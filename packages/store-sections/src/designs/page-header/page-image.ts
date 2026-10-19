/**
 * Image banner (library Cb-c): a wide photo band with a paper title plate
 * anchored at the bottom start, holding the breadcrumb, title and a line.
 * Text sits on paper, never on the photo.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { crumbs } from "./_crumbs";

export const pageImage = defineDesign({
  id: "page-image",
  version: 1,
  category: "page-header",
  subcategory: "image-banner",
  name: L("بانر بصورة", "Image banner"),
  description: L("صورة عريضة عليها لوحة بمسار الصفحة وعنوانها.", "A wide photo with a plate holding the breadcrumb and title."),
  keywords: ["banner", "category", "page header", "image", "بانر", "صورة", "قسم"],
  tree: (t) =>
    t.section({ label: L("بانر بصورة", "Image banner"), style: { paddingTop: 24, paddingBottom: 24 } }, [
      t.container(
        [
          t.box(
            [
              t.photo(0, L("صورة البانر", "Banner photo"), {
                role: "image",
                style: { aspectRatio: "wide", objectFit: "cover", radius: 28 },
                mobile: { aspectRatio: "landscape", radius: 18 },
              }),
              t.stack(
                [
                  crumbs(t, [{ text: L("المتجر", "Shop") }], L("اسم القسم", "Category")),
                  t.heading(L("اسم القسم", "Category name"), "h1", { role: "title", style: { fontSize: "display-sm", fontWeight: "extrabold" } }),
                  t.text(L("تشكيلة مختارة لهذا الموسم", "A picked range for this season"), { role: "subtitle", style: { color: "muted" } }),
                ],
                {
                  label: L("لوحة العنوان", "Title plate"),
                  style: {
                    position: "absolute",
                    insetBottom: "24px",
                    insetStart: "24px",
                    maxWidth: "480px",
                    background: "background",
                    radius: 20,
                    gap: 8,
                    paddingTop: 22,
                    paddingBottom: 22,
                    paddingStart: 24,
                    paddingEnd: 24,
                  },
                  mobile: {
                    position: "relative",
                    insetBottom: "auto",
                    insetStart: "auto",
                    marginTop: -32,
                    marginStart: 12,
                    marginEnd: 12,
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingStart: 16,
                    paddingEnd: 16,
                  },
                },
              ),
            ],
            { label: L("البانر", "Banner"), style: { position: "relative", minHeight: 240 }, mobile: { minHeight: 0 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
