/**
 * Buying guides (Product finder E-k): a large lead guide with its cover and
 * title on the start side, and a ruled list of three more on the end side.
 * The guides are the store's blog posts (a post list), so the seller writes
 * them in the blog; the design's read time becomes the post date, which a
 * post has.
 */
import { defineDesign } from "../builder";
import { L, cover } from "../_kit";
import { FLUSH, RULED, RULED_CELL, modHead } from "../_modular";
import { BLOG_LINK, POST_TITLE, postDate } from "../blog/_shared";

export const finderGuides = defineDesign({
  id: "finder-guides",
  version: 1,
  category: "finder",
  subcategory: "guides",
  name: L("أدلة الشراء", "Buying guides"),
  description: L(
    "دليل كبير في المقدمة وقايمة أدلة جنبه، من مقالات المدونة.",
    "A lead buying guide beside a list of more, from your blog posts.",
  ),
  keywords: [
    "finder",
    "buying guide",
    "blog",
    "advice",
    "أدلة",
    "دليل الشراء",
    "مدونة",
  ],
  tree: (t) =>
    t.section({ label: L("أدلة الشراء", "Buying guides") }, [
      t.container(
        [
          modHead(t, {
            label: L("أدلة", "Guides"),
            title: L("قبل ما تشتري", "Before you buy"),
            link: { text: L("كل الأدلة", "All guides"), href: BLOG_LINK },
          }),
          t.grid(
            [
              t.postList(
                [
                  t.link(
                    BLOG_LINK,
                    [
                      t.stack(
                        [
                          t.image("", POST_TITLE, {
                            bind: "image",
                            style: {
                              ...cover("landscape", 20),
                              background: "secondary",
                            },
                          }),
                          t.heading(POST_TITLE, "h3", {
                            bind: "title",
                            style: {
                              fontSize: "3xl",
                              lineHeight: "snug",
                              letterSpacing: "tight",
                            },
                            mobile: { fontSize: "2xl" },
                          }),
                          t.row(
                            [
                              t.icon("clock", {
                                style: { fontSize: "sm", color: "primary" },
                              }),
                              postDate(t),
                            ],
                            {
                              label: L("التاريخ", "Date"),
                              style: { gap: 6, wrap: false },
                            },
                          ),
                        ],
                        { label: L("المحتوى", "Content"), style: { gap: 14 } },
                      ),
                    ],
                    {
                      label: L("الدليل الرئيسي", "Lead guide"),
                      bind: "href",
                      style: {
                        ...FLUSH,
                        color: "foreground",
                        hover: { opacity: 90 },
                      },
                    },
                  ),
                ],
                {
                  label: L("الدليل الرئيسي", "Lead guide"),
                  role: "lead",
                  limit: 1,
                  columns: { desktop: 1 },
                },
              ),
              t.postList(
                [
                  t.link(
                    BLOG_LINK,
                    [
                      t.row(
                        [
                          t.stack(
                            [
                              t.heading(POST_TITLE, "h3", {
                                bind: "title",
                                style: { fontSize: "lg", lineHeight: "snug" },
                              }),
                              postDate(t),
                            ],
                            {
                              label: L("المعلومات", "Details"),
                              style: { gap: 6, width: "100%" },
                            },
                          ),
                          t.icon("arrow", {
                            style: { fontSize: "lg", color: "primary" },
                          }),
                        ],
                        {
                          label: L("السطر", "Row"),
                          style: { gap: 16, wrap: false, alignItems: "center" },
                        },
                      ),
                    ],
                    {
                      label: L("دليل", "Guide"),
                      bind: "href",
                      style: {
                        ...FLUSH,
                        ...RULED_CELL,
                        color: "foreground",
                        paddingTop: 22,
                        paddingBottom: 22,
                        paddingStart: 22,
                        paddingEnd: 22,
                        hover: { background: "secondary" },
                      },
                    },
                  ),
                ],
                {
                  label: L("باقي الأدلة", "More guides"),
                  role: "items",
                  limit: 3,
                  offset: 1,
                  optional: true,
                  columns: { desktop: 1 },
                  style: { ...RULED, radius: 20 },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 32, alignItems: "start" },
              mobile: { gap: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
