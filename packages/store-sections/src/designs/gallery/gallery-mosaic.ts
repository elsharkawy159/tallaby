/**
 * Mosaic (library G-b): a lookbook. One wide feature photo with a caption
 * card beside it, then a row of three photos, always a full rectangle.
 */
import { defineDesign } from "../builder";
import { L, arrowLink } from "../_kit";

const IMG = { objectFit: "cover", radius: 20 } as const;

export const galleryMosaic = defineDesign({
  id: "gallery-mosaic",
  version: 1,
  category: "gallery",
  subcategory: "lookbook",
  name: L("لوكبوك", "Lookbook mosaic"),
  description: L("صورة عريضة وبطاقة عنوان، ثم صف من ثلاث صور.", "A wide photo and a caption card over a row of three photos."),
  keywords: ["lookbook", "gallery", "mosaic", "collection", "لوكبوك", "معرض", "مجموعة"],
  tree: (t) =>
    t.section({ label: L("لوكبوك", "Lookbook") }, [
      t.container(
        [
          t.grid(
            [
              t.photo(0, L("صورة رئيسية", "Feature photo"), {
                role: "image",
                style: { ...IMG, aspectRatio: "wide", colSpan: 2 },
                mobile: { colSpan: 2, aspectRatio: "landscape" },
              }),
              t.stack(
                [
                  t.badge(L("لوكبوك", "Lookbook"), { role: "eyebrow", style: { background: "background", color: "primary" } }),
                  t.heading(L("لوكبوك الموسم", "The season lookbook"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.paragraph(L("ستة إطلالات من مجموعتنا الجديدة.", "Six looks from our new collection."), { role: "body" }),
                  arrowLink(t, L("تسوّق اللوك", "Shop the look"), "/products"),
                ],
                {
                  label: L("بطاقة العنوان", "Caption card"),
                  style: {
                    background: "secondary",
                    radius: 20,
                    gap: 12,
                    justifyContent: "center",
                    alignItems: "start",
                    paddingTop: 28,
                    paddingBottom: 28,
                    paddingStart: 28,
                    paddingEnd: 28,
                  },
                  mobile: { colSpan: 2 },
                },
              ),
              t.photo(1, L("صورة", "Photo"), { style: { ...IMG, aspectRatio: "square" } }),
              t.photo(2, L("صورة", "Photo"), { style: { ...IMG, aspectRatio: "square" } }),
              t.photo(3, L("صورة", "Photo"), { style: { ...IMG, aspectRatio: "square" }, mobile: { colSpan: 2, aspectRatio: "landscape" } }),
            ],
            { label: L("الموزاييك", "Mosaic"), columns: { desktop: 3, mobile: 2 }, style: { gap: 16 }, mobile: { gap: 10 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
