/**
 * Big headline (Modular set): the newest post as a typographic spread: the
 * date, a very large title, the excerpt and a read link, with a slim 3:4 cover
 * on the end side. Features one long read. On mobile the cover comes first.
 */
import { defineDesign } from "../builder";
import { L, arrowLink } from "../_kit";
import { BLOG_LINK, postCover, postDate, postExcerpt, postTitle } from "./_shared";

export const blogHeadline = defineDesign({
  id: "blog-headline",
  version: 1,
  category: "blog",
  subcategory: "featured",
  name: L("عنوان كبير", "Big headline"),
  description: L("أحدث مقال بعنوان ضخم وغلاف طولي على الجنب.", "Your newest post with a huge title and a slim cover beside it."),
  keywords: ["blog", "featured", "headline", "editorial", "long read", "مدونة", "مقال مميز"],
  tree: (t) =>
    t.section({ label: L("المدونة", "Blog") }, [
      t.container(
        [
          t.postList(
            [
              t.grid(
                [
                  t.stack(
                    [
                      postDate(t),
                      postTitle(t, {
                        fontSize: "display-md",
                        letterSpacing: "tight",
                        lineHeight: "tight",
                      }),
                      t.stack([postExcerpt(t)], {
                        label: L("المقتطف", "Excerpt"),
                        style: { maxWidth: "52ch" },
                      }),
                      arrowLink(t, L("اقرأ المقال", "Read the article"), BLOG_LINK, { bind: "href" }),
                    ],
                    {
                      label: L("النص", "Copy"),
                      style: { gap: 18, alignItems: "start", colSpan: 2 },
                      mobile: { colSpan: 1 },
                    },
                  ),
                  t.stack([postCover(t, "portrait", 24)], {
                    label: L("الغلاف", "Cover"),
                    mobile: { order: -1 },
                  }),
                ],
                {
                  label: L("المقال", "Post"),
                  columns: { desktop: 3, mobile: 1 },
                  style: { gap: 56, alignItems: "center" },
                  mobile: { gap: 20 },
                },
              ),
            ],
            {
              label: L("أحدث مقال", "Newest post"),
              role: "items",
              limit: 1,
              columns: { desktop: 1 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
