/**
 * Wide player (library V-a): a heading line, then one 16:9 rounded poster
 * across the content width with a large play button and a duration chip.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { playButton } from "./_video";

export const videoWide = defineDesign({
  id: "video-wide",
  version: 1,
  category: "video",
  subcategory: "wide",
  name: L("فيديو بعرض الصفحة", "Wide video"),
  description: L("عنوان وصورة فيديو عريضة بزر تشغيل ومدة الفيديو.", "A heading and a wide video poster with a play button and its length."),
  keywords: ["video", "demo", "unboxing", "youtube", "فيديو", "يوتيوب"],
  tree: (t) =>
    t.section({ label: L("فيديو", "Video") }, [
      t.container(
        [
          sectionHead(t, { title: L("شاهد المنتج على الحقيقة", "See the product for real"), link: { href: "/products", text: L("تسوّق الآن", "Shop now") } }),
          t.box(
            [
              t.photo(0, L("غلاف الفيديو", "Video poster"), {
                role: "image",
                style: { aspectRatio: "wide", objectFit: "cover", radius: 28 },
                mobile: { radius: 18 },
              }),
              playButton(t, 88),
              t.badge(L("١:٢٤", "1:24"), {
                style: { position: "absolute", insetBottom: "16px", insetEnd: "16px", background: "foreground", color: "background" },
              }),
            ],
            { label: L("المشغل", "Player"), style: { position: "relative", minHeight: 240 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
