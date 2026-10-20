/**
 * Vertical clip (Modular set): a 9:16 phone-shaped player for a TikTok or
 * Reels clip on the start side; on the end side a title, three short points
 * and a button. On mobile the clip comes first, centred.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { dotLabel, pillButton } from "../_modular";

const POINTS = [
  L("الخامة عن قرب", "The material up close"),
  L("المقاسات على الطبيعة", "Real-life sizing"),
  L("إزاي تستخدمه كل يوم", "How to use it every day"),
];

export const videoVertical = defineDesign({
  id: "video-vertical",
  version: 1,
  category: "video",
  subcategory: "reels",
  name: L("فيديو طولي", "Vertical clip"),
  description: L("فيديو طولي من تيك توك أو ريلز بجانب نقاط وزر.", "A vertical TikTok or Reels clip beside points and a button."),
  keywords: ["video", "vertical", "tiktok", "reels", "shorts", "فيديو", "تيك توك", "ريلز"],
  tree: (t) =>
    t.section({ label: L("فيديو طولي", "Vertical clip") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.video(2, L("شوفها في دقيقة", "See it in a minute"), {
                    label: L("المشغل", "Player"),
                    role: "video",
                    style: {
                      aspectRatio: "story",
                      radius: 28,
                      width: "100%",
                      maxWidth: "320px",
                    },
                    mobile: { maxWidth: "260px" },
                  }),
                ],
                {
                  label: L("الفيديو", "Clip"),
                  style: { alignItems: "center" },
                  mobile: { order: -1 },
                },
              ),
              t.stack(
                [
                  dotLabel(t, L("شوفها في دقيقة", "See it in a minute")),
                  t.heading(L("جربناه قبل ما نبيعه", "We tried it before selling it"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", letterSpacing: "tight" },
                  }),
                  t.stack(
                    POINTS.map((p) =>
                      t.row(
                        [
                          t.icon("check", {
                            style: { color: "primary", fontSize: "lg" },
                          }),
                          t.text(p, { style: { fontWeight: "medium" } }),
                        ],
                        {
                          label: L("نقطة", "Point"),
                          style: { gap: 10 },
                        },
                      ),
                    ),
                    {
                      label: L("النقاط", "Points"),
                      role: "items",
                      style: { gap: 12 },
                    },
                  ),
                  pillButton(t, L("اطلبه دلوقتي", "Order now"), "/products", {
                    icon: "shopping-bag",
                  }),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { gap: 18, alignItems: "start" },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 56, alignItems: "center" },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
