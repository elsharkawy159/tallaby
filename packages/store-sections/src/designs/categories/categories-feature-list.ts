/**
 * Feature and list (Modular set): the store's first category as a large photo
 * tile with a paper name plate, and the next six in a ruled list with a
 * thumbnail, count and arrow. Pushes one category while keeping the rest one
 * tap away.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, modHead } from "../_modular";
import { CATEGORY_LINK } from "./_shared";

const NAME = L("اسم القسم", "Category");

export const categoriesFeatureList = defineDesign({
  id: "categories-feature-list",
  version: 1,
  category: "categories",
  subcategory: "collections",
  name: L("قسم وقائمة", "Feature and list"),
  description: L("أول قسم بصورة كبيرة وباقي الأقسام في قائمة بجانبه.", "Your first category as a large photo, the rest in a list beside it."),
  keywords: ["categories", "featured", "list", "editorial", "أقسام", "قائمة", "مميز"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          modHead(t, {
            label: L("الأقسام", "Categories"),
            title: L("الأقسام", "Departments"),
            link: {
              text: L("كل الأقسام", "All categories"),
              href: CATEGORY_LINK,
            },
          }),
          t.grid(
            [
              t.categoryList(
                [
                  t.link(
                    CATEGORY_LINK,
                    [
                      t.image("", NAME, {
                        bind: "image",
                        style: {
                          aspectRatio: "landscape",
                          objectFit: "cover",
                          width: "100%",
                          minHeight: 440,
                        },
                        mobile: { minHeight: 0 },
                      }),
                      t.stack(
                        [
                          t.text(NAME, {
                            bind: "name",
                            style: { fontWeight: "bold", fontSize: "2xl" },
                          }),
                          t.row(
                            [
                              t.text(L("١٢", "12"), {
                                bind: "productCount",
                                style: { color: "muted", fontSize: "sm" },
                              }),
                              t.text(L("منتج", "items"), {
                                style: { color: "muted", fontSize: "sm" },
                              }),
                            ],
                            { label: L("العدد", "Count"), style: { gap: 4 } },
                          ),
                        ],
                        {
                          label: L("لوحة الاسم", "Name plate"),
                          style: {
                            position: "absolute",
                            insetStart: "16px",
                            insetBottom: "16px",
                            background: "background",
                            radius: 14,
                            gap: 2,
                            paddingTop: 14,
                            paddingBottom: 14,
                            paddingStart: 20,
                            paddingEnd: 20,
                          },
                        },
                      ),
                    ],
                    {
                      label: L("القسم المميز", "Featured category"),
                      bind: "href",
                      style: {
                        ...FLUSH,
                        position: "relative",
                        radius: 24,
                        overflow: "hidden",
                        background: "secondary",
                      },
                    },
                  ),
                ],
                {
                  label: L("القسم المميز", "Featured category"),
                  role: "featured",
                  limit: 1,
                  columns: { desktop: 1 },
                },
              ),
              t.categoryList(
                [
                  t.link(
                    CATEGORY_LINK,
                    [
                      t.row(
                        [
                          t.image("", NAME, {
                            bind: "image",
                            style: {
                              aspectRatio: "square",
                              objectFit: "cover",
                              radius: 12,
                              width: "56px",
                              background: "secondary",
                            },
                          }),
                          t.text(NAME, {
                            bind: "name",
                            style: { fontWeight: "semibold", fontSize: "md" },
                          }),
                          t.row(
                            [
                              t.text(L("١٢", "12"), {
                                bind: "productCount",
                                style: { color: "muted", fontSize: "sm" },
                              }),
                              t.icon("arrow", {
                                style: { color: "muted", fontSize: "md" },
                              }),
                            ],
                            {
                              label: L("العدد", "Count"),
                              style: { gap: 12, wrap: false, marginStart: 0 },
                            },
                          ),
                        ],
                        {
                          label: L("السطر", "Row"),
                          style: {
                            gap: 16,
                            wrap: false,
                            justifyContent: "between",
                          },
                        },
                      ),
                    ],
                    {
                      label: L("قسم", "Category"),
                      bind: "href",
                      style: {
                        ...FLUSH,
                        background: "background",
                        paddingTop: 9,
                        paddingBottom: 9,
                        hover: { background: "secondary" },
                      },
                    },
                  ),
                ],
                {
                  label: L("باقي الأقسام", "More categories"),
                  role: "items",
                  limit: 6,
                  offset: 1,
                  optional: true,
                  columns: { desktop: 1 },
                  style: { gap: 1, background: "border", alignItems: "start" },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 24, alignItems: "start" },
              mobile: { gap: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
