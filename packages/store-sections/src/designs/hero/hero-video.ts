/**
 * Video hero (2026-10-28): a muted, looping video file from edge to edge
 * (the `video` element's background mode), a dim layer and the message
 * centred on it inside the page width. The poster photo is drawn first and
 * stays alone with reduce motion or until a video link is set. The dim layer
 * and the copy are ordinary nodes: change the dim's opacity, or delete it or
 * the copy for a video with no overlay. The heading is the page's `h1`.
 *
 * v2 (look-first pilot, 2026-11-11, docs/systems/plan.md §10 L7): the layout
 * language of the full-bleed hero. The video fills most of the first screen
 * (`HERO_FRAME`), the copy sits centred in its lower part, the eyebrow is a
 * small uppercase line, and there is one solid button with a quiet underlined
 * link. The copy fades out as the visitor scrolls on (the section's
 * `fade-exit`, motion v2); the `h1` never reveals. Node order, roles and
 * field names are v1's.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FILL, HERO_EYEBROW, HERO_FRAME, QUIET_LINK } from "./_shared";

export const heroVideo = defineDesign({
  id: "hero-video",
  version: 2,
  category: "hero",
  subcategory: "full-width",
  name: L("فيديو بعرض الشاشة", "Full-width video"),
  description: L(
    "فيديو صامت يشتغل في الخلفية من طرف الشاشة للطرف ويملأ أول الشاشة، وعليه العنوان وسطر وزر ورابط.",
    "A muted background video from edge to edge that fills the first screen, with the headline, a line, a button and a link on it.",
  ),
  keywords: ["hero", "video", "background video", "full width", "mp4", "premium", "واجهة", "فيديو", "خلفية", "بانر"],
  scrollEffect: "fade-exit",
  tree: (t) =>
    t.section({ label: L("الواجهة", "Hero"), style: { paddingTop: 0, paddingBottom: 0 }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.box(
        [
          t.backgroundVideo(0, L("فيديو الواجهة", "Hero video"), {
            label: L("الفيديو", "Video"),
            role: "video",
            style: { ...HERO_FRAME.style, width: "100%", radius: 0 },
            tablet: HERO_FRAME.tablet,
            mobile: HERO_FRAME.mobile,
          }),
          t.box([], { label: L("التعتيم", "Dim"), style: { ...FILL, background: "black", opacity: 35 } }),
          t.stack(
            [
              t.container(
                [
                  t.stack(
                    [
                      t.text(L("المجموعة الجديدة", "The new collection"), {
                        role: "eyebrow",
                        style: { ...HERO_EYEBROW, color: "white", opacity: 90, textAlign: "center" },
                      }),
                      t.heading(L("مساحتك، بطريقتك", "Your space, your way"), "h1", {
                        role: "title",
                        style: { color: "white", fontSize: "display-lg", fontWeight: "bold", lineHeight: "tight", letterSpacing: "tight", textAlign: "center", maxWidth: "820px" },
                      }),
                      t.paragraph(L("قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.", "Carefully chosen pieces, delivered fast to your door."), {
                        role: "subtitle",
                        style: { color: "white", fontSize: "lg", opacity: 90, maxWidth: "520px", textAlign: "center" },
                        mobile: { fontSize: "md" },
                      }),
                      t.row(
                        [
                          t.button(L("تسوّق الآن", "Shop now"), "/products", "light", { role: "cta" }),
                          t.button(L("شوف الجديد", "See what’s new"), "/products?sort=newest", "outline", { role: "cta2", style: QUIET_LINK }),
                        ],
                        { label: L("الأزرار", "Buttons"), style: { gap: 8, paddingTop: 12, justifyContent: "center", alignItems: "center" } },
                      ),
                    ],
                    { label: L("النص", "Copy"), style: { gap: 16, alignItems: "center" }, mobile: { gap: 12 } },
                  ),
                ],
                { label: L("الحاوية", "Container") },
              ),
            ],
            {
              label: L("طبقة النص", "Copy layer"),
              style: { ...FILL, justifyContent: "end", paddingBottom: 88 },
              mobile: { paddingBottom: 44 },
            },
          ),
        ],
        { label: L("إطار الفيديو", "Video frame"), style: { position: "relative", background: "black", overflow: "hidden" } },
      ),
    ]),
});
