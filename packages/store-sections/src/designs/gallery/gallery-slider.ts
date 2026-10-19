/**
 * Lookbook slider (Modular set): one large 16:9 campaign photo and a row of
 * thumbnails underneath, the first ringed in brand. Drawn as a still layout
 * (no slide switching); every photo is its own image the seller replaces.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const gallerySlider = defineDesign({
  id: "gallery-slider",
  version: 1,
  category: "gallery",
  subcategory: "lookbook",
  name: L("لوك بوك", "Lookbook slider"),
  description: L("صورة حملة كبيرة وتحتها صف صور صغيرة.", "One large campaign photo with a row of thumbnails underneath."),
  keywords: ["gallery", "lookbook", "campaign", "slider", "premium", "معرض", "لوك بوك", "حملة"],
  tree: (t) =>
    t.section({ label: L("المعرض", "Gallery") }, [
      t.container(
        [
          t.photo(0, L("صورة الحملة", "Campaign photo"), {
            role: "image",
            style: {
              aspectRatio: "wide",
              objectFit: "cover",
              radius: 24,
              width: "100%",
            },
            mobile: { aspectRatio: "portrait" },
          }),
          t.grid(
            [0, 1, 2, 3, 4, 5].map((i) =>
              t.photo(i, L("صورة مصغرة", "Thumbnail"), {
                style: {
                  aspectRatio: "landscape",
                  objectFit: "cover",
                  radius: 14,
                  width: "100%",
                  borderWidth: 3,
                  borderColor: i === 0 ? "primary" : "transparent",
                  ...(i > 0 && { opacity: 75, hover: { opacity: 100 } }),
                },
              }),
            ),
            {
              label: L("الصور المصغرة", "Thumbnails"),
              role: "items",
              columns: { desktop: 6, mobile: 3 },
              style: { gap: 10, marginTop: 12 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
