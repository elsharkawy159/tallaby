/**
 * Cinema band (library V-c): a full-bleed deep band with the poster inside, a
 * centred play button and a paper title plate anchored at the bottom start.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { playButton } from "./_video";

export const videoCinema = defineDesign({
  id: "video-cinema",
  version: 1,
  category: "video",
  subcategory: "cinematic",
  name: L("غلاف سينمائي", "Cinema band"),
  description: L("شريط داكن بفيديو الحملة وزر تشغيل وعنوان على لوحة.", "A deep band with the campaign video, a play button and a title plate."),
  keywords: ["video", "campaign", "brand film", "فيديو", "حملة", "إعلان"],
  tree: (t) =>
    t.section({ label: L("فيديو الحملة", "Campaign video"), style: { background: "foreground", paddingTop: 48, paddingBottom: 48 } }, [
      t.container(
        [
          t.box(
            [
              t.photo(2, L("غلاف الفيديو", "Video poster"), {
                role: "image",
                style: { aspectRatio: "wide", objectFit: "cover", radius: 24, opacity: 85 },
                mobile: { aspectRatio: "landscape" },
              }),
              playButton(t, 96, { style: { background: "accent" } }),
              t.stack(
                [
                  t.heading(L("الحملة الجديدة", "The new campaign"), "h2", { role: "title", style: { fontSize: "2xl", fontWeight: "extrabold" } }),
                  t.text(L("٣٠ ثانية", "30 seconds"), { style: { color: "muted" } }),
                ],
                {
                  label: L("لوحة العنوان", "Title plate"),
                  style: {
                    position: "absolute",
                    insetBottom: "24px",
                    insetStart: "24px",
                    background: "background",
                    radius: 16,
                    gap: 2,
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingStart: 20,
                    paddingEnd: 20,
                  },
                  mobile: { insetBottom: "12px", insetStart: "12px", paddingTop: 10, paddingBottom: 10, paddingStart: 14, paddingEnd: 14 },
                },
              ),
            ],
            { label: L("المشغل", "Player"), style: { position: "relative", minHeight: 240 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
