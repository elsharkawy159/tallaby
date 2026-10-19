/**
 * Playlist (library V-d): a heading, then a player on the start two-thirds
 * and a list of four videos on the end third, each a thumbnail, title and
 * length. Clicking a row plays it in the player; mobile puts the list under it.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";

const VIDEOS = [
  { title: L("فتح العلبة", "Unboxing"), duration: L("٢:١٠", "2:10"), poster: 0 },
  { title: L("أول تشغيل", "First use"), duration: L("١:٠٥", "1:05"), poster: 1 },
  { title: L("نصائح الاستخدام", "Tips"), duration: L("٠:٤٨", "0:48"), poster: 2 },
  { title: L("التنظيف والعناية", "Care and cleaning"), duration: L("١:٣٠", "1:30"), poster: 3 },
];

export const videoPlaylist = defineDesign({
  id: "video-playlist",
  version: 3,
  category: "video",
  subcategory: "playlist",
  name: L("قائمة فيديوهات", "Playlist"),
  description: L("مشغل بجانب قائمة فيديوهات؛ الضغط على أي فيديو يشغّله.", "A player beside a list of videos; click one to play it."),
  keywords: ["video", "playlist", "guides", "series", "فيديوهات", "دليل", "شروحات"],
  tree: (t) =>
    t.section({ label: L("دليل الفيديو", "Video guide") }, [
      t.container(
        [
          sectionHead(t, { title: L("دليل الفيديو", "Video guide") }),
          t.playlist(VIDEOS, { label: L("قائمة الفيديوهات", "Playlist"), role: "items", style: { gap: 24 }, mobile: { gap: 16 } }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
