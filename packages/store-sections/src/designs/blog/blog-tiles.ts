/**
 * Cover tiles (library B-d): four tall cover tiles in a row; each title sits on
 * a paper plate inside the bottom of the photo, never on the photo itself.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { BLOG_LINK, POST_TITLE } from "./_shared";

export const blogTiles = defineDesign({
  id: "blog-tiles",
  version: 1,
  category: "blog",
  subcategory: "cards",
  name: L("صور بعناوين", "Cover tiles"),
  description: L("أغلفة طولية والعنوان على لوحة فاتحة داخل الصورة.", "Tall covers with the title on a light plate inside the photo."),
  keywords: ["blog", "tiles", "covers", "stories", "مدونة", "حكايات"],
  tree: (t) =>
    t.section({ label: L("المدونة", "Blog") }, [
      t.container(
        [
          sectionHead(t, { title: L("حكايات", "Stories"), link: { href: BLOG_LINK, text: L("كل المقالات", "All articles") } }),
          t.postList(
            [
              t.link(
                BLOG_LINK,
                [
                  t.image("", POST_TITLE, { bind: "image", style: { aspectRatio: "portrait", objectFit: "cover", width: "100%" } }),
                  t.stack(
                    [
                      t.text(L("٢ أكتوبر", "2 Oct"), { bind: "date", style: { color: "primary", fontSize: "xs", fontWeight: "semibold" } }),
                      t.heading(POST_TITLE, "h3", { bind: "title", style: { fontSize: "md", lineHeight: "snug" } }),
                    ],
                    {
                      label: L("اللوحة", "Plate"),
                      style: {
                        gap: 4,
                        position: "absolute",
                        insetBottom: "12px",
                        insetStart: "12px",
                        insetEnd: "12px",
                        background: "background",
                        radius: 14,
                        paddingTop: 12,
                        paddingBottom: 12,
                        paddingStart: 14,
                        paddingEnd: 14,
                      },
                    },
                  ),
                ],
                {
                  label: L("مقال", "Post"),
                  bind: "href",
                  style: {
                    position: "relative",
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingStart: 0,
                    paddingEnd: 0,
                    radius: 20,
                    overflow: "hidden",
                    background: "secondary",
                    color: "foreground",
                  },
                },
              ),
            ],
            { label: L("المقالات", "Posts"), role: "items", limit: 4, columns: { desktop: 4, tablet: 2, mobile: 2 }, style: { gap: 16 }, mobile: { gap: 10 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
