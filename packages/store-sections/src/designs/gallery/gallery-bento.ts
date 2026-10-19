/**
 * Bento feed (Modular set): a bento of one large photo, four small photos and
 * a brand tile with the handle and a follow button, so the Instagram feed
 * feels like part of the brand. On mobile the brand tile spans the width.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";
import { BRAND_TILE, FLUSH, pillButton } from "../_modular";

const PROFILE = "https://www.instagram.com/";

export const galleryBento = defineDesign({
  id: "gallery-bento",
  version: 1,
  category: "gallery",
  subcategory: "instagram",
  name: L("بينتو إنستجرام", "Bento feed"),
  description: L("صور إنستجرام في مربعات مع مربع بلون المتجر للمتابعة.", "Instagram photos in tiles with a brand tile to follow you."),
  keywords: ["gallery", "instagram", "bento", "social", "bold", "إنستجرام", "بينتو"],
  tree: (t) =>
    t.section({ label: L("إنستجرام", "Instagram") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.link(
                    PROFILE,
                    [
                      t.photo(0, L("صورة إنستجرام", "Instagram photo"), {
                        style: {
                          aspectRatio: "square",
                          objectFit: "cover",
                          radius: 24,
                          width: "100%",
                        },
                      }),
                    ],
                    {
                      label: L("رابط الصورة", "Photo link"),
                      style: { ...FLUSH, hover: { opacity: 90 } },
                    },
                  ),
                ],
                {
                  label: L("الصورة الكبيرة", "Large photo"),
                  style: { colSpan: 2 },
                },
              ),
              t.grid(
                [1, 2, 3, 4].map((i) =>
                  t.link(
                    PROFILE,
                    [
                      t.photo(i, L("صورة إنستجرام", "Instagram photo"), {
                        style: {
                          aspectRatio: "square",
                          objectFit: "cover",
                          radius: 20,
                          width: "100%",
                        },
                      }),
                    ],
                    {
                      label: L("صورة", "Photo"),
                      style: { ...FLUSH, hover: { opacity: 90 } },
                    },
                  ),
                ),
                {
                  label: L("الصور", "Photos"),
                  role: "items",
                  columns: { desktop: 2, mobile: 2 },
                  style: { gap: 12, colSpan: 2 },
                },
              ),
              t.stack(
                [
                  t.icon("instagram", {
                    style: { fontSize: "2xl", color: "primaryInk" },
                  }),
                  t.text(L("@اسم_متجرك", "@yourstore"), {
                    role: "title",
                    style: { fontWeight: "bold", fontSize: "2xl", ...ON_BRAND },
                  }),
                  t.text(L("صور جديدة كل أسبوع", "New photos every week"), {
                    style: { fontSize: "sm", ...ON_BRAND_BODY },
                  }),
                  pillButton(t, L("تابعنا", "Follow"), PROFILE, {
                    tone: "on-brand",
                  }),
                ],
                {
                  label: L("مربع المتابعة", "Follow tile"),
                  style: {
                    ...BRAND_TILE,
                    gap: 12,
                    justifyContent: "end",
                    alignItems: "start",
                  },
                  mobile: { colSpan: 2 },
                },
              ),
            ],
            {
              label: L("المربعات", "Tiles"),
              columns: { desktop: 5, mobile: 2 },
              style: { gap: 12, alignItems: "stretch" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
