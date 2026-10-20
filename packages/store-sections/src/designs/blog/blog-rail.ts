/**
 * Story rail (Modular set): tall 3:4 post covers in a row, each with the title
 * on a paper plate overlapping the cover's bottom edge, so the title never
 * sits on the photo. For lifestyle blogs with strong photos. Two across on
 * mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { modHead } from "../_modular";
import { BLOG_LINK, postCover, postDate, postTitle } from "./_shared";

export const blogRail = defineDesign({
  id: "blog-rail",
  version: 1,
  category: "blog",
  subcategory: "cards",
  name: L("شريط حكايات", "Story rail"),
  description: L("أغلفة مقالات طولية وعليها العنوان في لوحة بيضا.", "Tall post covers with the title on a white plate."),
  keywords: ["blog", "stories", "rail", "covers", "playful", "مدونة", "حكايات"],
  tree: (t) =>
    t.section({ label: L("المدونة", "Blog") }, [
      t.container(
        [
          modHead(t, {
            title: L("حكايات", "Stories"),
            link: { text: L("كل المقالات", "All articles"), href: BLOG_LINK },
          }),
          t.postList(
            [
              t.stack(
                [
                  postCover(t, "portrait", 22),
                  t.stack([postDate(t), postTitle(t, { fontSize: "md" })], {
                    label: L("لوحة العنوان", "Title plate"),
                    style: {
                      background: "background",
                      radius: 16,
                      gap: 6,
                      shadow: "md",
                      paddingTop: 14,
                      paddingBottom: 14,
                      paddingStart: 16,
                      paddingEnd: 16,
                      marginTop: -48,
                      marginStart: 12,
                      marginEnd: 12,
                      position: "relative",
                    },
                    mobile: {
                      marginStart: 6,
                      marginEnd: 6,
                      paddingStart: 12,
                      paddingEnd: 12,
                    },
                  }),
                ],
                { label: L("مقال", "Post"), style: { gap: 0 } },
              ),
            ],
            {
              label: L("المقالات", "Posts"),
              role: "items",
              limit: 4,
              columns: { desktop: 4, mobile: 2 },
              style: { gap: 20 },
              mobile: { gap: 12 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
