/**
 * Post bento (Modular set): the newest post in a large tile with its cover and
 * title, the next two in smaller tiles, and a brand tile inviting readers to
 * the blog. A magazine front page. Stacks on mobile.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND } from "../_kit";
import { BRAND_TILE, TILE, TILE_MOBILE, modHead, pillButton } from "../_modular";
import { BLOG_LINK, postCover, postDate, postTitle } from "./_shared";

export const blogBento = defineDesign({
  id: "blog-bento",
  version: 1,
  category: "blog",
  subcategory: "cards",
  name: L("بينتو مقالات", "Post bento"),
  description: L("مقال كبير ومقالين أصغر ومربع يدعو للقراءة.", "One large post, two smaller ones and a tile inviting readers in."),
  keywords: ["blog", "bento", "magazine", "posts", "مدونة", "بينتو", "مقالات"],
  tree: (t) =>
    t.section({ label: L("المدونة", "Blog") }, [
      t.container(
        [
          modHead(t, {
            label: L("المدونة", "Journal"),
            title: L("اقرأ قبل ما تشتري", "Read before you buy"),
          }),
          t.grid(
            [
              t.postList(
                [
                  t.stack([postCover(t, "landscape", 18), postDate(t), postTitle(t, { fontSize: "2xl" })], {
                    label: L("المقال الكبير", "Lead post"),
                    style: {
                      ...TILE,
                      gap: 12,
                      paddingTop: 16,
                      paddingBottom: 24,
                      paddingStart: 16,
                      paddingEnd: 16,
                    },
                  }),
                ],
                {
                  label: L("أحدث مقال", "Newest post"),
                  role: "lead",
                  limit: 1,
                  columns: { desktop: 1 },
                  style: { colSpan: 2 },
                  mobile: { colSpan: 1 },
                },
              ),
              t.stack(
                [
                  t.postList(
                    [
                      t.stack([postCover(t, "wide", 14), postDate(t), postTitle(t, { fontSize: "md" })], {
                        label: L("مقال", "Post"),
                        style: {
                          ...TILE,
                          gap: 8,
                          paddingTop: 12,
                          paddingBottom: 16,
                          paddingStart: 12,
                          paddingEnd: 12,
                        },
                      }),
                    ],
                    {
                      label: L("مقالات أخرى", "More posts"),
                      role: "items",
                      limit: 2,
                      offset: 1,
                      optional: true,
                      columns: { desktop: 2, mobile: 1 },
                      style: { gap: 12 },
                    },
                  ),
                  t.stack(
                    [
                      t.heading(L("مقال جديد كل أسبوع", "A new article every week"), "h3", { style: { fontSize: "2xl", ...ON_BRAND } }),
                      pillButton(t, L("كل المقالات", "All articles"), BLOG_LINK, { tone: "on-brand" }),
                    ],
                    {
                      label: L("مربع المدونة", "Blog tile"),
                      style: { ...BRAND_TILE, gap: 16, alignItems: "start" },
                      mobile: TILE_MOBILE,
                    },
                  ),
                ],
                {
                  label: L("العمود الثاني", "Second column"),
                  style: { gap: 12, colSpan: 2 },
                  mobile: { colSpan: 1 },
                },
              ),
            ],
            {
              label: L("المربعات", "Tiles"),
              columns: { desktop: 4, mobile: 1 },
              style: { gap: 12 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
