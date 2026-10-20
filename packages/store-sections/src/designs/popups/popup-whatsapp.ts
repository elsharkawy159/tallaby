/**
 * WhatsApp button (library PU-f), drawn inline: the floating chat button and
 * its speech-bubble tooltip, set at the end of a slim row instead of floating
 * over the page (a tree cannot pin itself to the screen corner). The whole
 * group is one WhatsApp link; the seller pastes their number into it. The
 * bubble holds a greeting and the usual reply time. On mobile the bubble
 * shrinks and the row keeps the button at the end.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";

export const popupWhatsapp = defineDesign({
  id: "popup-whatsapp",
  version: 1,
  category: "popups",
  subcategory: "chat",
  name: L("زر واتساب", "WhatsApp button"),
  description: L("زر واتساب مدوّر جنبه فقاعة فيها ترحيب ومدة الرد.", "A round WhatsApp button with a speech bubble: a greeting and the reply time."),
  keywords: ["popup", "whatsapp", "chat", "button", "support", "واتساب", "محادثة", "زر", "تواصل"],
  tree: (t) =>
    t.section(
      { label: L("زر واتساب", "WhatsApp button"), style: { paddingTop: 24, paddingBottom: 24 }, mobile: { paddingTop: 16, paddingBottom: 16 } },
      [
        t.container(
          [
            t.row(
              [
                t.link(
                  "https://wa.me/201001234567",
                  [
                    t.row(
                      [
                        t.stack(
                          [
                            t.text(L("أهلاً! نقدر نساعدك في إيه؟", "Hi! How can we help?"), {
                              role: "title",
                              style: { fontWeight: "semibold", color: "foreground" },
                              mobile: { fontSize: "sm" },
                            }),
                            t.text(L("بنرد عادةً خلال دقايق", "Usually replies in minutes"), {
                              role: "subtitle",
                              style: { fontSize: "xs", color: "muted" },
                            }),
                          ],
                          {
                            label: L("الفقاعة", "Bubble"),
                            style: {
                              gap: 2,
                              background: "background",
                              borderWidth: 1,
                              borderColor: "border",
                              radius: 18,
                              shadow: "md",
                              paddingTop: 12,
                              paddingBottom: 12,
                              paddingStart: 16,
                              paddingEnd: 16,
                            },
                            mobile: { paddingTop: 10, paddingBottom: 10, paddingStart: 12, paddingEnd: 12 },
                          },
                        ),
                        t.box(
                          [
                            t.icon("chat", { style: { fontSize: "2xl", color: "primaryInk" } }),
                            t.box([], {
                              label: L("نقطة جديد", "Unread dot"),
                              style: {
                                position: "absolute",
                                insetTop: "2px",
                                insetEnd: "2px",
                                background: "accent",
                                radius: 999,
                                width: "14px",
                                minHeight: 14,
                                borderWidth: 2,
                                borderColor: "background",
                              },
                            }),
                          ],
                          {
                            label: L("الزر", "Button"),
                            style: {
                              position: "relative",
                              background: "primary",
                              radius: 999,
                              width: "60px",
                              paddingTop: 15,
                              paddingBottom: 13,
                              textAlign: "center",
                              shadow: "lg",
                            },
                          },
                        ),
                      ],
                      { label: L("المحتوى", "Content"), style: { gap: 12, alignItems: "center", wrap: false } },
                    ),
                  ],
                  { label: L("رابط واتساب", "WhatsApp link"), role: "cta", style: { ...FLUSH, hover: { opacity: 90 } } },
                ),
              ],
              { label: L("الصف", "Row"), style: { justifyContent: "end" } },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
