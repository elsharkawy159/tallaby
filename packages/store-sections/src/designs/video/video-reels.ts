/**
 * Reels rail (library V-e): a row of tall 9:16 players for short videos
 * (TikTok, Instagram Reels, YouTube Shorts, Facebook Reels), each with a
 * caption under it. The seller pastes each video's link.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";

const CAPTIONS = [L("طريقة الاستخدام", "How to use it"), L("آراء العملاء", "Customer reviews"), L("خلف الكواليس", "Behind the scenes"), L("فتح العلبة", "Unboxing"), L("وصل حديثًا", "Just in")];

export const videoReels = defineDesign({
  id: "video-reels",
  version: 2,
  category: "video",
  subcategory: "reels",
  name: L("ريلز", "Reels"),
  description: L("صف فيديوهات طولية من تيك توك وإنستجرام ويوتيوب.", "A row of vertical videos from TikTok, Instagram and YouTube."),
  keywords: ["reels", "tiktok", "instagram", "shorts", "video", "ريلز", "تيك توك", "إنستجرام"],
  tree: (t) =>
    t.section({ label: L("ريلز", "Reels") }, [
      t.container(
        [
          sectionHead(t, { title: L("من على تيك توك", "From TikTok"), link: { href: "https://www.tiktok.com/", text: L("تابعنا", "Follow us") } }),
          t.grid(
            CAPTIONS.map((caption, i) =>
              t.stack(
                [
                  t.video(i, caption, { label: L("الفيديو", "Video"), style: { aspectRatio: "story", radius: 20 } }),
                  t.text(caption, { style: { fontWeight: "semibold", fontSize: "sm" } }),
                ],
                { label: L("ريل", "Reel"), style: { gap: 8 } },
              ),
            ),
            { label: L("الفيديوهات", "Reels"), role: "items", columns: { desktop: 5, tablet: 3, mobile: 2 }, style: { gap: 14 }, mobile: { gap: 10 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
