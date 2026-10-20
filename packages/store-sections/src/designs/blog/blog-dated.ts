/**
 * Dated list (Modular set): a ruled list of the store's posts: the date on the
 * start side, the title in the middle and an arrow on the end side. No covers,
 * so it suits news-style blogs or uneven photos.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, modHead } from "../_modular";
import { BLOG_LINK, POST_TITLE, postDate } from "./_shared";

export const blogDated = defineDesign({
  id: "blog-dated",
  version: 1,
  category: "blog",
  subcategory: "list",
  name: L("قائمة بالتاريخ", "Dated list"),
  description: L("قائمة مقالات بالتاريخ والعنوان من غير صور.", "A list of posts with date and title, no images."),
  keywords: ["blog", "list", "dates", "news", "minimal", "مدونة", "مقالات", "قائمة"],
  tree: (t) =>
    t.section({ label: L("المدونة", "Blog") }, [
      t.container(
        [
          modHead(t, {
            label: L("المدونة", "Journal"),
            title: L("آخر المقالات", "Latest articles"),
            link: { text: L("كل المقالات", "All articles"), href: BLOG_LINK },
          }),
          t.postList(
            [
              t.link(
                BLOG_LINK,
                [
                  t.row(
                    [
                      t.stack([postDate(t)], {
                        label: L("التاريخ", "Date"),
                        style: { width: "140px" },
                        mobile: { width: "100%" },
                      }),
                      t.heading(POST_TITLE, "h3", {
                        bind: "title",
                        style: {
                          fontSize: "xl",
                          lineHeight: "snug",
                          width: "100%",
                        },
                        mobile: { fontSize: "lg" },
                      }),
                      t.icon("arrow", {
                        style: { fontSize: "lg", color: "primary" },
                      }),
                    ],
                    {
                      label: L("السطر", "Row"),
                      style: { gap: 24, wrap: false, alignItems: "center" },
                      mobile: { wrap: true, gap: 6 },
                    },
                  ),
                ],
                {
                  label: L("مقال", "Post"),
                  bind: "href",
                  style: {
                    ...FLUSH,
                    background: "background",
                    paddingTop: 22,
                    paddingBottom: 22,
                    color: "foreground",
                    hover: { color: "primary" },
                  },
                },
              ),
            ],
            {
              label: L("المقالات", "Posts"),
              role: "items",
              limit: 5,
              columns: { desktop: 1 },
              style: {
                gap: 1,
                background: "border",
                paddingTop: 1,
                paddingBottom: 1,
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
