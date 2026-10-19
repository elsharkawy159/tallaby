/**
 * Video beside text (library V-b): eyebrow, title, paragraph, three tick
 * points and a button on the start side, and a portrait poster sized for
 * vertical phone videos on the end side.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { playButton } from "./_video";

const POINTS = [L("بدون أدوات", "No tools needed"), L("في أقل من دقيقة", "In under a minute"), L("يناسب كل الأحجام", "Fits every size")];

export const videoSplit = defineDesign({
  id: "video-split",
  version: 1,
  category: "video",
  subcategory: "with-text",
  name: L("فيديو ونص", "Video beside text"),
  description: L("نص ونقاط وزر بجانب فيديو طولي مثل الريلز.", "Text, points and a button beside a vertical, reels-style video."),
  keywords: ["video", "reels", "tiktok", "how to", "فيديو", "ريلز", "تيك توك"],
  tree: (t) =>
    t.section({ label: L("فيديو ونص", "Video and text") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.badge(L("فيديو قصير", "Short video"), { role: "eyebrow", style: { color: "primary" } }),
                  t.heading(L("طريقة الاستخدام في دقيقة", "How to use it, in a minute"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.paragraph(L("شاهد الفيديو لتعرف كل ما تحتاجه قبل الطلب.", "Watch the video to learn everything before you order."), { role: "body" }),
                  t.stack(
                    POINTS.map((p) =>
                      t.row(
                        [t.icon("check", { style: { color: "primary", fontSize: "lg" } }), t.text(p, { style: { fontWeight: "medium", fontSize: "md" } })],
                        {
                          label: L("نقطة", "Point"),
                          style: { gap: 10 },
                        },
                      ),
                    ),
                    { label: L("النقاط", "Points"), role: "items", style: { gap: 10 } },
                  ),
                  t.button(L("اطلب الآن", "Order now"), "/products", "solid", { role: "cta" }),
                ],
                { label: L("النص", "Copy"), style: { gap: 14, alignItems: "start" } },
              ),
              t.box(
                [
                  t.photo(1, L("غلاف الفيديو", "Video poster"), { role: "image", style: { aspectRatio: "portrait", objectFit: "cover", radius: 28 } }),
                  playButton(t, 72),
                ],
                { label: L("المشغل", "Player"), style: { position: "relative", maxWidth: "420px", minHeight: 300 }, mobile: { order: -1 } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 56, alignItems: "center" }, mobile: { gap: 24 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
