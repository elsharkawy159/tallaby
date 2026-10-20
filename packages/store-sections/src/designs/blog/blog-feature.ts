/**
 * Single feature (library B-e): the newest post as one wide tinted panel, the
 * eyebrow, a large title, the excerpt and a "read" button on the start half
 * and the cover on the end half.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BLOG_LINK, POST_TITLE, postCover } from "./_shared";

export const blogFeature = defineDesign({
  id: "blog-feature",
  version: 1,
  category: "blog",
  subcategory: "featured",
  name: L("مقال واحد", "Single feature"),
  description: L("أحدث مقال في لوحة عريضة بزر للقراءة.", "Your newest post in a wide panel with a read button."),
  keywords: ["blog", "feature", "article", "guide", "مدونة", "مقال"],
  tree: (t) =>
    t.section({ label: L("مقال مميز", "Featured post") }, [
      t.container(
        [
          t.postList(
            [
              t.grid(
                [
                  t.stack(
                    [
                      t.badge(L("اقرأ الأسبوع ده", "Read this week"), { role: "eyebrow", style: { background: "background", color: "primary" } }),
                      t.heading(POST_TITLE, "h2", { bind: "title", style: { fontSize: "display-sm" } }),
                      t.paragraph(L("سطر قصير من المقال يشرح موضوعه.", "A short line from the post about what it covers."), { bind: "excerpt" }),
                      t.button(L("اقرأ المقال", "Read the article"), BLOG_LINK, "solid", { bind: "href", role: "cta", style: { marginTop: 8 } }),
                    ],
                    { label: L("النص", "Copy"), style: { gap: 14, alignItems: "start", justifyContent: "center" } },
                  ),
                  postCover(t, "landscape", 20),
                ],
                {
                  label: L("اللوحة", "Panel"),
                  columns: { desktop: 2, mobile: 1 },
                  style: {
                    gap: 32,
                    alignItems: "center",
                    background: "secondary",
                    radius: 28,
                    paddingTop: 32,
                    paddingBottom: 32,
                    paddingStart: 32,
                    paddingEnd: 32,
                  },
                  mobile: { paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20, gap: 20 },
                },
              ),
            ],
            { label: L("المقال", "Post"), limit: 1, columns: { desktop: 1 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
