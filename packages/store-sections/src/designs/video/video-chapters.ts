/**
 * Chapters (Modular set): a large 16:9 player on the start side and a ruled
 * chapter list on the end side, each chapter a timestamp and a title, with
 * the current one highlighted. For long reviews and tutorials. On mobile the
 * list goes under the video.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { modHead } from "../_modular";

const CHAPTERS = [
  { time: L("٠:٠٠", "0:00"), title: L("المقدمة", "Intro") },
  {
    time: L("١:٢٠", "1:20"),
    title: L("التصميم والخامة", "Design and material"),
  },
  { time: L("٣:٤٥", "3:45"), title: L("الاستخدام اليومي", "Everyday use") },
  { time: L("٦:١٠", "6:10"), title: L("العيوب", "The downsides") },
  { time: L("٨:٣٠", "8:30"), title: L("الحكم النهائي", "Verdict") },
];

export const videoChapters = defineDesign({
  id: "video-chapters",
  version: 1,
  category: "video",
  subcategory: "cinematic",
  name: L("فصول", "Chapters"),
  description: L("فيديو كبير بجانب قائمة فصوله بالتوقيت.", "A large video beside its list of timed chapters."),
  keywords: ["video", "chapters", "review", "tutorial", "فيديو", "فصول", "مراجعة"],
  tree: (t) =>
    t.section({ label: L("الفيديو", "Video") }, [
      t.container(
        [
          modHead(t, {
            label: L("مراجعة كاملة", "Full review"),
            title: L("بعد شهر استخدام", "One month in"),
          }),
          t.grid(
            [
              t.video(0, L("المراجعة الكاملة", "Full review"), {
                label: L("المشغل", "Player"),
                role: "video",
                style: {
                  aspectRatio: "wide",
                  radius: 24,
                  width: "100%",
                  colSpan: 2,
                },
                mobile: { colSpan: 1 },
              }),
              t.stack(
                CHAPTERS.map((c, i) =>
                  t.row(
                    [
                      t.text(c.time, {
                        style: {
                          fontSize: "sm",
                          fontWeight: "semibold",
                          background: i === 2 ? "accent" : "secondary",
                          radius: 999,
                          paddingStart: 10,
                          paddingEnd: 10,
                          paddingTop: 2,
                          paddingBottom: 2,
                        },
                      }),
                      t.text(c.title, {
                        style: {
                          fontWeight: i === 2 ? "bold" : "medium",
                          color: i === 2 ? "foreground" : "muted",
                        },
                      }),
                    ],
                    {
                      label: L("فصل", "Chapter"),
                      style: {
                        background: "background",
                        gap: 14,
                        wrap: false,
                        paddingTop: 16,
                        paddingBottom: 16,
                      },
                    },
                  ),
                ),
                {
                  label: L("الفصول", "Chapters"),
                  role: "items",
                  style: {
                    gap: 1,
                    background: "border",
                    paddingTop: 1,
                    paddingBottom: 1,
                  },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 32, alignItems: "start" },
              mobile: { gap: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
