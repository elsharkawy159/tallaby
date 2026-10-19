/**
 * Brand film (Modular set): a brand-coloured panel with a short headline and a
 * "watch the film" button on the start side and a rounded 4:3 player on the
 * end side. On mobile the player sits above the text.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND } from "../_kit";
import { dotLabel, pillButton } from "../_modular";

export const videoFilm = defineDesign({
  id: "video-film",
  version: 1,
  category: "video",
  subcategory: "with-text",
  name: L("فيلم البراند", "Brand film"),
  description: L("لوحة بلون المتجر فيها جملة قصيرة وفيديو المتجر.", "A brand-coloured panel with a short line and your brand film."),
  keywords: ["video", "brand film", "story", "bold", "فيديو", "فيلم", "قصة"],
  tree: (t) =>
    t.section({ label: L("فيلم البراند", "Brand film") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("دقيقتين", "Two minutes"), { onBrand: true }),
                  t.heading(L("إزاي بنجهّز كل طلب قبل ما يخرج", "How we prepare every order before it ships"), "h2", {
                    role: "title",
                    style: {
                      fontSize: "display-sm",
                      letterSpacing: "tight",
                      ...ON_BRAND,
                    },
                  }),
                  pillButton(t, L("عن المتجر", "About us"), "/about", {
                    tone: "on-brand",
                  }),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { gap: 18, alignItems: "start" },
                },
              ),
              t.video(3, L("فيلم المتجر", "Brand film"), {
                label: L("المشغل", "Player"),
                role: "video",
                style: { aspectRatio: "landscape", radius: 20, width: "100%" },
                mobile: { order: -1 },
              }),
            ],
            {
              label: L("اللوحة", "Panel"),
              columns: { desktop: 2, mobile: 1 },
              style: {
                background: "primary",
                radius: 28,
                gap: 48,
                alignItems: "center",
                paddingTop: 48,
                paddingBottom: 48,
                paddingStart: 48,
                paddingEnd: 48,
              },
              mobile: {
                gap: 20,
                paddingTop: 16,
                paddingBottom: 28,
                paddingStart: 16,
                paddingEnd: 16,
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
