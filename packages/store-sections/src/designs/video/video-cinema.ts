/**
 * Cinema band (library V-c): a full-bleed deep band with a title line in
 * paper ink over a wide YouTube player.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const videoCinema = defineDesign({
  id: "video-cinema",
  version: 2,
  category: "video",
  subcategory: "cinematic",
  name: L("غلاف سينمائي", "Cinema band"),
  description: L("شريط داكن بعنوان وفيديو الحملة من يوتيوب.", "A deep band with a title and the campaign video from YouTube."),
  keywords: ["video", "campaign", "brand film", "فيديو", "حملة", "إعلان"],
  tree: (t) =>
    t.section({ label: L("فيديو الحملة", "Campaign video"), style: { background: "foreground", paddingTop: 48, paddingBottom: 48 } }, [
      t.container(
        [
          t.stack(
            [
              t.stack(
                [
                  t.heading(L("الحملة الجديدة", "The new campaign"), "h2", { role: "title", style: { fontSize: "2xl", fontWeight: "extrabold", color: "background" } }),
                  t.text(L("٣٠ ثانية", "30 seconds"), { style: { color: "background", opacity: 70 } }),
                ],
                { label: L("العنوان", "Title"), style: { gap: 2 } },
              ),
              t.video(2, L("فيديو الحملة", "Campaign video"), {
                label: L("المشغل", "Player"),
                role: "video",
                style: { aspectRatio: "wide", radius: 24 },
                mobile: { aspectRatio: "landscape", radius: 16 },
              }),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
