/**
 * Video reviews (Modular set): a row of 9:16 players for short customer clips
 * from TikTok or Reels, each with the customer's name and the product under
 * it. Two across on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { modHead } from "../_modular";
import { REVIEWS } from "./_shared";

const PRODUCTS = [L("الطقم الكلاسيك", "Classic set"), L("الحقيبة اليومية", "Everyday bag"), L("العلبة الهدية", "Gift box"), L("الإصدار الجديد", "New edition")];

export const testimonialsVideos = defineDesign({
  id: "testimonials-videos",
  version: 1,
  category: "testimonials",
  subcategory: "carousel",
  name: L("فيديوهات عملاء", "Video reviews"),
  description: L("فيديوهات قصيرة من العملاء بأساميهم والمنتج.", "Short customer clips with their names and the product."),
  keywords: ["testimonials", "video", "ugc", "reels", "tiktok", "آراء", "فيديو", "ريلز"],
  tree: (t) =>
    t.section({ label: L("آراء بالفيديو", "Video reviews") }, [
      t.container(
        [
          modHead(t, {
            label: L("فيديو", "Video"),
            title: L("شوفوا بنفسكم", "See for yourself"),
          }),
          t.grid(
            REVIEWS.slice(0, 4).map((r, i) =>
              t.stack(
                [
                  t.video(i + 4, r.name, {
                    label: L("المشغل", "Player"),
                    style: { aspectRatio: "story", radius: 20, width: "100%" },
                  }),
                  t.text(r.name, {
                    style: { fontWeight: "semibold", marginTop: 4 },
                  }),
                  t.text(PRODUCTS[i]!, {
                    style: { color: "muted", fontSize: "sm" },
                  }),
                ],
                { label: L("فيديو", "Clip"), style: { gap: 4 } },
              ),
            ),
            {
              label: L("الفيديوهات", "Clips"),
              role: "items",
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
