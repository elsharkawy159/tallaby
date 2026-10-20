/**
 * One-hour fix (Services W-j): a sun-coloured band. On the start side a short
 * question and promise in large type; on the end side a huge "60" with
 * "minutes" under it and a booking button. A campaign strip for a fast repair
 * service. Mobile stacks the figure under the text.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BIG_NUMBER, pillButton } from "../_modular";
import { WHATSAPP_LINK } from "./_shared";

export const serviceFastFix = defineDesign({
  id: "service-fast-fix",
  version: 1,
  category: "services",
  subcategory: "banners",
  name: L("تصليح في ساعة", "One-hour fix"),
  description: L(
    "شريط بلون مميز: وعد بتصليح سريع ورقم كبير وزرار حجز.",
    "A bright strip: a fast-repair promise, a huge figure and a booking button.",
  ),
  keywords: [
    "services",
    "repair",
    "fast",
    "banner",
    "campaign",
    "صيانة",
    "تصليح",
    "سريع",
  ],
  tree: (t) =>
    t.section(
      {
        label: L("تصليح في ساعة", "One-hour fix"),
        style: { background: "accent", color: "foreground" },
      },
      [
        t.container(
          [
            t.grid(
              [
                t.stack(
                  [
                    t.heading(L("الشاشة اتكسرت؟", "Cracked screen?"), "h2", {
                      role: "title",
                      style: {
                        fontSize: "display-lg",
                        letterSpacing: "tight",
                        lineHeight: "tight",
                        color: "foreground",
                      },
                    }),
                    t.paragraph(
                      L(
                        "بنغيرها وانت مستني، بقطع أصلية وضمان.",
                        "We replace it while you wait, with genuine parts and a warranty.",
                      ),
                      {
                        role: "subtitle",
                        style: {
                          fontSize: "xl",
                          color: "foreground",
                          opacity: 85,
                          maxWidth: "32ch",
                        },
                        mobile: { fontSize: "md" },
                      },
                    ),
                  ],
                  {
                    label: L("الوعد", "Promise"),
                    role: "intro",
                    style: { gap: 14 },
                  },
                ),
                t.stack(
                  [
                    t.text(L("٦٠", "60"), {
                      role: "value",
                      style: {
                        ...BIG_NUMBER,
                        fontSize: "display-lg",
                        color: "foreground",
                      },
                    }),
                    t.text(L("دقيقة", "minutes"), {
                      style: {
                        fontSize: "lg",
                        fontWeight: "semibold",
                        marginTop: -8,
                      },
                    }),
                    pillButton(t, L("احجز دلوقتي", "Book now"), WHATSAPP_LINK, {
                      tone: "ink",
                      style: { marginTop: 12 },
                    }),
                  ],
                  {
                    label: L("الرقم", "Figure"),
                    style: { gap: 6, alignItems: "end" },
                    mobile: { alignItems: "start" },
                  },
                ),
              ],
              {
                label: L("التخطيط", "Layout"),
                columns: { desktop: 2, mobile: 1 },
                style: { gap: 32, alignItems: "center" },
                mobile: { gap: 20 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
