/**
 * Playlist (library V-d): a main poster on the start two-thirds and a list of
 * four videos on the end third, each a thumbnail, title and length; the first
 * row is highlighted. Mobile puts the list under the player.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { VIDEO_LINK, playButton } from "./_video";

const VIDEOS = [
  { title: L("فتح العلبة", "Unboxing"), length: L("٢:١٠", "2:10") },
  { title: L("أول تشغيل", "First use"), length: L("١:٠٥", "1:05") },
  { title: L("نصائح الاستخدام", "Tips"), length: L("٠:٤٨", "0:48") },
  { title: L("التنظيف والعناية", "Care and cleaning"), length: L("١:٣٠", "1:30") },
];

export const videoPlaylist = defineDesign({
  id: "video-playlist",
  version: 1,
  category: "video",
  subcategory: "playlist",
  name: L("قائمة فيديوهات", "Playlist"),
  description: L("فيديو رئيسي بجانب قائمة فيديوهات قصيرة بعناوينها ومدتها.", "A main video beside a list of short videos with titles and lengths."),
  keywords: ["video", "playlist", "guides", "series", "فيديوهات", "دليل", "شروحات"],
  tree: (t) =>
    t.section({ label: L("دليل الفيديو", "Video guide") }, [
      t.container(
        [
          sectionHead(t, { title: L("دليل الفيديو", "Video guide") }),
          t.grid(
            [
              t.box(
                [
                  t.photo(0, L("الفيديو الرئيسي", "Main video"), { role: "image", style: { aspectRatio: "wide", objectFit: "cover", radius: 24 } }),
                  playButton(t, 80),
                ],
                {
                  label: L("المشغل", "Player"),
                  style: { position: "relative", colSpan: 2, minHeight: 240 },
                  mobile: { colSpan: 1 },
                },
              ),
              t.stack(
                VIDEOS.map((v, i) =>
                  t.link(
                    VIDEO_LINK,
                    [
                      t.row(
                        [
                          t.photo(i + 1, v.title, { style: { aspectRatio: "landscape", objectFit: "cover", radius: 12, width: "104px" } }),
                          t.stack([t.text(v.title, { style: { fontWeight: "semibold" } }), t.text(v.length, { style: { color: "muted", fontSize: "xs" } })], {
                            label: L("العنوان", "Title"),
                            style: { gap: 4 },
                          }),
                        ],
                        { label: L("السطر", "Row"), style: { gap: 12, wrap: false } },
                      ),
                    ],
                    {
                      label: L("فيديو", "Video"),
                      style: {
                        radius: 16,
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingStart: 10,
                        paddingEnd: 10,
                        ...(i === 0 ? { background: "secondary" } : {}),
                        hover: { background: "secondary" },
                      },
                    },
                  ),
                ),
                { label: L("القائمة", "List"), role: "items", style: { gap: 6 } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 3, mobile: 1 }, style: { gap: 24, alignItems: "start" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
