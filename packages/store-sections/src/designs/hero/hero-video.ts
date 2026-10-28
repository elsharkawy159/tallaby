/**
 * Video hero (2026-10-28): a muted, looping video file from edge to edge
 * (the `video` element's background mode), a dim layer and the message
 * centred on it inside the page width. The poster photo is drawn first and
 * stays alone with reduce motion or until a video link is set. The dim layer
 * and the copy are ordinary nodes: change the dim's opacity, or delete it or
 * the copy for a video with no overlay. The heading is the page's `h1`.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const FILL = {
  position: "absolute",
  insetTop: "0px",
  insetBottom: "0px",
  insetStart: "0px",
  insetEnd: "0px",
} as const;

export const heroVideo = defineDesign({
  id: "hero-video",
  version: 1,
  category: "hero",
  subcategory: "full-width",
  name: L("فيديو بعرض الشاشة", "Full-width video"),
  description: L(
    "فيديو صامت يشتغل في الخلفية من طرف الشاشة للطرف، وعليه العنوان وسطر وزرين في النص.",
    "A muted background video from edge to edge, with the headline, a line and two buttons centred on it.",
  ),
  keywords: ["hero", "video", "background video", "full width", "mp4", "premium", "واجهة", "فيديو", "خلفية", "بانر"],
  tree: (t) =>
    t.section(
      {
        label: L("الواجهة", "Hero"),
        style: { paddingTop: 0, paddingBottom: 0 },
        mobile: { paddingTop: 0, paddingBottom: 0 },
      },
      [
        t.box(
          [
            t.backgroundVideo(0, L("فيديو الواجهة", "Hero video"), {
              label: L("الفيديو", "Video"),
              role: "video",
              style: { aspectRatio: "banner", width: "100%", radius: 0 },
              tablet: { aspectRatio: "wide" },
              mobile: { aspectRatio: "story" },
            }),
            t.box([], {
              label: L("التعتيم", "Dim"),
              style: { ...FILL, background: "black", opacity: 35 },
            }),
            t.stack(
              [
                t.container(
                  [
                    t.stack(
                      [
                        t.text(L("المجموعة الجديدة", "The new collection"), {
                          role: "eyebrow",
                          style: {
                            color: "white",
                            fontWeight: "semibold",
                            opacity: 90,
                            textAlign: "center",
                          },
                        }),
                        t.heading(L("مساحتك، بطريقتك", "Your space, your way"), "h1", {
                          role: "title",
                          style: {
                            color: "white",
                            fontSize: "display-lg",
                            fontWeight: "bold",
                            lineHeight: "tight",
                            textAlign: "center",
                            maxWidth: "820px",
                          },
                        }),
                        t.paragraph(L("قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.", "Carefully chosen pieces, delivered fast to your door."), {
                          role: "subtitle",
                          style: {
                            color: "white",
                            fontSize: "lg",
                            opacity: 90,
                            maxWidth: "560px",
                            textAlign: "center",
                          },
                          mobile: { fontSize: "md" },
                        }),
                        t.row(
                          [
                            t.button(L("تسوّق الآن", "Shop now"), "/products", "light", { role: "cta" }),
                            t.button(L("شوف الجديد", "See what’s new"), "/products?sort=newest", "outline", {
                              role: "cta2",
                              style: {
                                background: "transparent",
                                color: "white",
                                borderColor: "white",
                              },
                            }),
                          ],
                          {
                            label: L("الأزرار", "Buttons"),
                            style: {
                              gap: 12,
                              paddingTop: 8,
                              justifyContent: "center",
                            },
                          },
                        ),
                      ],
                      {
                        label: L("النص", "Copy"),
                        style: { gap: 16, alignItems: "center" },
                        mobile: { gap: 12 },
                      },
                    ),
                  ],
                  { label: L("الحاوية", "Container") },
                ),
              ],
              {
                label: L("طبقة النص", "Copy layer"),
                style: { ...FILL, justifyContent: "center" },
              },
            ),
          ],
          {
            label: L("إطار الفيديو", "Video frame"),
            style: {
              position: "relative",
              background: "black",
              overflow: "hidden",
            },
          },
        ),
      ],
    ),
});
