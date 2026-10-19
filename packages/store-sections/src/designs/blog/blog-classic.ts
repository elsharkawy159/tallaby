/**
 * Classic blog (library B-a, Classic template): heading with "all articles",
 * then three post cards: a rounded cover, the date, a bold title and a muted
 * excerpt. Posts are the store's published blog posts, newest first.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { BLOG_LINK, postCover, postDate, postExcerpt, postTitle } from "./_shared";

export const blogClassic = defineDesign({
  id: "blog-classic",
  version: 1,
  category: "blog",
  subcategory: "cards",
  name: L("مدونة كلاسيك", "Classic blog"),
  description: L("آخر ثلاث مقالات منشورة في كروت بالغلاف والعنوان.", "Your three latest published posts as cards with cover and title."),
  keywords: ["blog", "posts", "articles", "classic", "مدونة", "مقالات"],
  tree: (t) =>
    t.section({ label: L("المدونة", "Blog") }, [
      t.container(
        [
          sectionHead(t, { title: L("من المدونة", "From the blog"), link: { href: BLOG_LINK, text: L("كل المقالات", "All articles") } }),
          t.postList(
            [
              t.stack([postCover(t), postDate(t), postTitle(t), postExcerpt(t)], {
                label: L("بطاقة المقال", "Post card"),
                style: { gap: 10 },
              }),
            ],
            { label: L("المقالات", "Posts"), role: "items", limit: 3, columns: { desktop: 3, tablet: 2, mobile: 1 }, style: { gap: 28 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
