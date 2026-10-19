/**
 * Video grid (Modular set): a heading and a channel link over three 16:9
 * players, each with its title underneath. A set of reviews or how-to videos.
 * One column on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { modHead } from "../_modular";

const VIDEOS = [
  { title: L("فتح العلبة", "Unboxing"), poster: 0 },
  { title: L("إزاي تختار المقاس", "How to pick a size"), poster: 1 },
  { title: L("مقارنة سريعة", "A quick comparison"), poster: 2 },
];

export const videoGrid = defineDesign({
  id: "video-grid",
  version: 1,
  category: "video",
  subcategory: "playlist",
  name: L("شبكة فيديوهات", "Video grid"),
  description: L("ثلاث فيديوهات جنب بعض بعناوينها ورابط القناة.", "Three videos side by side with titles and a channel link."),
  keywords: ["video", "grid", "youtube", "reviews", "فيديوهات", "يوتيوب"],
  tree: (t) =>
    t.section({ label: L("الفيديوهات", "Videos") }, [
      t.container(
        [
          modHead(t, {
            label: L("يوتيوب", "YouTube"),
            title: L("شوف قبل ما تشتري", "Watch before you buy"),
            link: {
              text: L("القناة", "Channel"),
              href: "https://www.youtube.com/",
            },
          }),
          t.grid(
            VIDEOS.map((v) =>
              t.stack(
                [
                  t.video(v.poster, v.title, {
                    label: L("المشغل", "Player"),
                    style: { aspectRatio: "wide", radius: 20, width: "100%" },
                  }),
                  t.heading(v.title, "h3", { style: { fontSize: "lg" } }),
                ],
                { label: L("فيديو", "Video"), style: { gap: 12 } },
              ),
            ),
            {
              label: L("الفيديوهات", "Videos"),
              role: "items",
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
