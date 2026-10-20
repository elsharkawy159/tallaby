/**
 * Wide player (library V-a): a heading line, then one 16:9 rounded poster
 * across the content width: a YouTube player the seller links in Content.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";

export const videoWide = defineDesign({
  id: "video-wide",
  version: 2,
  category: "video",
  subcategory: "wide",
  name: L("فيديو بعرض الصفحة", "Wide video"),
  description: L("عنوان وفيديو يوتيوب عريض.", "A heading and a wide YouTube video."),
  keywords: ["video", "demo", "unboxing", "youtube", "فيديو", "يوتيوب"],
  tree: (t) =>
    t.section({ label: L("فيديو", "Video") }, [
      t.container(
        [
          sectionHead(t, { title: L("شاهد المنتج على الحقيقة", "See the product for real"), link: { href: "/products", text: L("تسوّق الآن", "Shop now") } }),
          t.video(0, L("فيديو المنتج", "Product video"), {
            label: L("المشغل", "Player"),
            role: "video",
            style: { aspectRatio: "wide", radius: 28 },
            mobile: { radius: 18 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
