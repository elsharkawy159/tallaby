/**
 * Headline index (library B-c): no images. A ruled list where each row has the
 * date in a narrow start column, a large title and an arrow at the end, for
 * stores that write often without a cover for every post.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { BLOG_LINK, POST_TITLE } from "./_shared";

export const blogIndex = defineDesign({
  id: "blog-index",
  version: 1,
  category: "blog",
  subcategory: "list",
  name: L("عناوين فقط", "Headline index"),
  description: L("قائمة عناوين بالتاريخ بدون صور.", "A list of titles with dates and no images."),
  keywords: ["blog", "index", "headlines", "list", "مدونة", "عناوين"],
  tree: (t) =>
    t.section({ label: L("المدونة", "Blog") }, [
      t.container(
        [
          sectionHead(t, { title: L("اقرأ عندنا", "Read with us"), link: { href: BLOG_LINK, text: L("كل المقالات", "All articles") } }),
          t.postList(
            [
              t.link(
                BLOG_LINK,
                [
                  t.grid(
                    [
                      t.text(L("٢ أكتوبر", "2 Oct"), { bind: "date", style: { color: "muted", fontSize: "sm" } }),
                      t.heading(POST_TITLE, "h3", { bind: "title", style: { fontSize: "xl", colSpan: 4 }, mobile: { colSpan: 1 } }),
                      t.icon("arrow", { style: { fontSize: "lg", color: "primary", textAlign: "end" }, mobile: { hidden: true } }),
                    ],
                    {
                      label: L("الصف", "Row"),
                      columns: { desktop: 6, mobile: 1 },
                      style: { gap: 16, alignItems: "center", paddingTop: 20, paddingBottom: 20, borderColor: "border" },
                      mobile: { gap: 6 },
                    },
                  ),
                ],
                {
                  label: L("مقال", "Post"),
                  bind: "href",
                  style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, color: "foreground", hover: { opacity: 80 } },
                },
              ),
              t.divider(),
            ],
            { label: L("المقالات", "Posts"), role: "items", limit: 6, columns: { desktop: 1 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
