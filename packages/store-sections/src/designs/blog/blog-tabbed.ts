/**
 * Tabbed posts (Modular set): a row of topic chips over a three-column grid of
 * posts, each with a 16:9 cover, the date, title and excerpt. The chips link
 * to the blog; the grid shows the newest posts. One column on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { chip, modHead } from "../_modular";
import { BLOG_LINK, postCover, postDate, postExcerpt, postTitle } from "./_shared";

const TOPICS = [L("الكل", "All"), L("مراجعات", "Reviews"), L("نصايح", "Guides"), L("أخبار", "News")];

export const blogTabbed = defineDesign({
  id: "blog-tabbed",
  version: 1,
  category: "blog",
  subcategory: "cards",
  name: L("مقالات بتبويبات", "Tabbed posts"),
  description: L("شرائح مواضيع فوق شبكة مقالات بثلاث أعمدة.", "Topic chips over a three-column grid of posts."),
  keywords: ["blog", "tabs", "topics", "grid", "مدونة", "مواضيع"],
  tree: (t) =>
    t.section({ label: L("المدونة", "Blog") }, [
      t.container(
        [
          modHead(t, { title: L("المدونة", "Journal") }),
          t.row(
            TOPICS.map((topic, i) => chip(t, topic, BLOG_LINK, { active: i === 0 })),
            {
              label: L("المواضيع", "Topics"),
              role: "tabs",
              style: { gap: 8, marginTop: -12, marginBottom: 28 },
              mobile: { marginTop: -8, marginBottom: 20 },
            },
          ),
          t.postList([t.stack([postCover(t, "wide", 18), postDate(t), postTitle(t), postExcerpt(t)], { label: L("مقال", "Post"), style: { gap: 10 } })], {
            label: L("المقالات", "Posts"),
            role: "items",
            limit: 3,
            columns: { desktop: 3, mobile: 1 },
            style: { gap: 28 },
            mobile: { gap: 24 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
