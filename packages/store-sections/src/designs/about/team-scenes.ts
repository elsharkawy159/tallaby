/**
 * Behind the scenes (library Y-j): a photo mosaic with a caption tile set into
 * the grid on the start side: the caption beside one wide photo, then three
 * square photos under them. For the warehouse, the packing table and the team
 * at work. On mobile the caption and wide photo span the width and the last
 * photo turns wide.
 */
import type { StyleValues } from "../../elements/style";
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { TILE, TILE_MOBILE, dotLabel } from "../_modular";

const PHOTO: StyleValues = { objectFit: "cover", radius: 20, width: "100%" };

export const teamScenes = defineDesign({
  id: "team-scenes",
  version: 1,
  category: "about",
  subcategory: "team",
  name: L("ورا الكواليس", "Behind the scenes"),
  description: L("صور من المخزن والتغليف والفريق وهو بيشتغل.", "Photos of the warehouse, the packing table and the team at work."),
  keywords: ["about", "behind the scenes", "photos", "team", "warehouse", "من نحن", "الكواليس", "صور"],
  tree: (t) =>
    t.section({ label: L("ورا الكواليس", "Behind the scenes") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("ورا الكواليس", "Behind the scenes")),
                  t.heading(L("كل طلب بيتغلّف بإيد", "Every order packed by hand"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", letterSpacing: "tight" },
                  }),
                ],
                {
                  label: L("التعليق", "Caption"),
                  style: { ...TILE, gap: 12, justifyContent: "end" },
                  mobile: { ...TILE_MOBILE, colSpan: 2 },
                },
              ),
              t.photo(0, L("صورة من المخزن", "A photo of the warehouse"), {
                role: "image",
                style: { ...PHOTO, aspectRatio: "wide", colSpan: 2 },
              }),
              t.photo(1, L("صورة التغليف", "A photo of the packing table"), { style: { ...PHOTO, aspectRatio: "square" } }),
              t.photo(2, L("صورة من الفريق", "A photo of the team"), { style: { ...PHOTO, aspectRatio: "square" } }),
              t.photo(3, L("صورة من الشغل", "A photo of the work"), {
                style: { ...PHOTO, aspectRatio: "square" },
                mobile: { aspectRatio: "wide", colSpan: 2 },
              }),
            ],
            {
              label: L("الصور", "Photos"),
              role: "items",
              columns: { desktop: 3, mobile: 2 },
              style: { gap: 12, alignItems: "stretch" },
              mobile: { gap: 8 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
