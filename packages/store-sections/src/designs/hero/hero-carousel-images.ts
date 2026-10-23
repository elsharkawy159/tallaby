/**
 * Photo-only banner carousel (owner, 2026-10-23): full-width photos, one at a
 * time, with no text or button on them. Same `carousel` element as
 * `hero-carousel`: autoplays every 5 seconds, pauses on hover, focus, the
 * pause button, a hidden tab or off-screen, and starts paused with reduced
 * motion. Phones swipe; the arrows are desktop only.
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

const slide = (t: TreeBuilder, index: number, alt: DesignText) =>
  t.slide(
    [
      t.photo(index, alt, {
        role: "image",
        style: { aspectRatio: "banner", objectFit: "cover" },
        mobile: { aspectRatio: "portrait" },
      }),
    ],
    { label: L("شريحة", "Slide"), style: { minHeight: 0, gap: 0 } },
  );

export const heroCarouselImages = defineDesign({
  id: "hero-carousel-images",
  version: 1,
  category: "hero",
  subcategory: "full-width",
  name: L("صور متحركة", "Photo carousel"),
  description: L("صور بعرض الصفحة تتغير وحدها، من غير نصوص عليها.", "Full-width photos that change on their own, with no text on them."),
  keywords: ["hero", "carousel", "slider", "banner", "images", "photos", "سلايدر", "بانر", "صور", "شرائح"],
  tree: (t) =>
    t.section({ label: L("الصور", "Photos"), style: { paddingTop: 0, paddingBottom: 0 }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.carousel(
        [
          slide(t, 0, L("الصورة الأولى", "First photo")),
          slide(t, 1, L("الصورة الثانية", "Second photo")),
          slide(t, 2, L("الصورة الثالثة", "Third photo")),
        ],
        { label: L("الشرائح", "Slides"), autoplay: true, interval: 5 },
      ),
    ]),
});
