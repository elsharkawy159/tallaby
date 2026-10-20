/**
 * Classic page header (library Cb-a, Classic template inner pages): a
 * breadcrumb, a large page title and a muted line, right on the page.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { crumbs } from "./_crumbs";

export const pageHeader = defineDesign({
  id: "page-header",
  version: 1,
  category: "page-header",
  subcategory: "title",
  name: L("عنوان صفحة كلاسيك", "Classic page header"),
  description: L("مسار الصفحة وعنوان كبير وسطر وصف.", "A breadcrumb, a large page title and a line of text."),
  keywords: ["page header", "title", "breadcrumb", "عنوان الصفحة", "مسار"],
  tree: (t) =>
    t.section({ label: L("عنوان الصفحة", "Page header"), style: { paddingTop: 40, paddingBottom: 24 } }, [
      t.container(
        [
          t.stack(
            [
              crumbs(t, [], L("من نحن", "About us")),
              t.heading(L("من نحن", "About us"), "h1", { role: "title", style: { fontSize: "display-md", fontWeight: "extrabold" } }),
              t.paragraph(L("فريق صغير يختار منتجات نشتريها نحن أنفسنا.", "A small team choosing products we would buy ourselves."), {
                role: "subtitle",
                style: { fontSize: "lg", maxWidth: "640px" },
              }),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 12 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
