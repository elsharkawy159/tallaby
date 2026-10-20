/**
 * Lead and list (library B-b): the newest post large on the start side (cover,
 * date, big title, excerpt) and the next three as compact rows with a square thumbnail on the end side
 * (that list skips the first post and may be empty).
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { BLOG_LINK, postCover, postDate, postExcerpt, postTitle } from "./_shared";

export const blogLead = defineDesign({
  id: "blog-lead",
  version: 1,
  category: "blog",
  subcategory: "featured",
  name: L("مقال مميز وقائمة", "Lead and list"),
  description: L("أحدث مقال كبير وبجانبه قائمة بالمقالات التالية.", "The newest post large, with the next ones listed beside it."),
  keywords: ["blog", "lead", "featured", "list", "مدونة", "مقال مميز"],
  tree: (t) =>
    t.section({ label: L("المدونة", "Blog") }, [
      t.container(
        [
          sectionHead(t, { title: L("آخر المقالات", "Latest stories"), link: { href: BLOG_LINK, text: L("كل المقالات", "All articles") } }),
          t.grid(
            [
              t.postList(
                [
                  t.stack([postCover(t, "landscape", 20), postDate(t), postTitle(t, { fontSize: "2xl" }), postExcerpt(t)], {
                    label: L("المقال الرئيسي", "Lead post"),
                    style: { gap: 12 },
                  }),
                ],
                { label: L("المقال الرئيسي", "Lead post"), limit: 1, columns: { desktop: 1 } },
              ),
              t.postList(
                [
                  t.row(
                    [
                      t.box([postCover(t, "square", 12)], {
                        label: L("الصورة", "Thumbnail"),
                        style: { width: "88px", paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, background: "transparent" },
                      }),
                      t.stack([postDate(t), postTitle(t, { fontSize: "md" })], { label: L("المعلومات", "Details"), style: { gap: 4, width: "100%" } }),
                    ],
                    { label: L("صف المقال", "Post row"), style: { gap: 14, wrap: false, alignItems: "center" } },
                  ),
                ],
                { label: L("المقالات", "Posts"), role: "items", limit: 3, offset: 1, optional: true, columns: { desktop: 1 }, style: { gap: 18 } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 32, alignItems: "start" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
