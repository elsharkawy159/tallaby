/**
 * Chat reviews (Modular set): a phone-width column of chat bubbles on a shelf
 * panel, customer messages on one side and a short store reply on the other,
 * with names and times. For stores whose reviews arrive on WhatsApp. Bubbles
 * are text, not screenshots, so they reflow in any language.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";
import { dotLabel } from "../_modular";
import { REVIEWS } from "./_shared";

function bubble(t: TreeBuilder, o: { name?: DesignText; text: DesignText; time: DesignText; me?: boolean }): NodeTemplate {
  const box = t.stack(
    [
      ...(o.name
        ? [
            t.text(o.name, {
              style: { fontWeight: "bold", fontSize: "sm", color: "primary" },
            }),
          ]
        : []),
      t.paragraph(o.text, {
        style: { color: o.me ? "primaryInk" : "foreground" },
      }),
      t.text(o.time, {
        style: {
          fontSize: "xs",
          textAlign: "end",
          color: o.me ? "primaryInk" : "muted",
          opacity: o.me ? 80 : 100,
        },
      }),
    ],
    {
      label: o.me ? L("رد المتجر", "Store reply") : L("رسالة عميل", "Customer message"),
      style: {
        gap: 4,
        maxWidth: "80%",
        radius: 18,
        paddingTop: 10,
        paddingBottom: 8,
        paddingStart: 14,
        paddingEnd: 14,
        background: o.me ? "primary" : "background",
        shadow: "sm",
      },
    },
  );
  return t.row([box], {
    label: L("سطر", "Line"),
    style: { justifyContent: o.me ? "end" : "start" },
  });
}

export const testimonialsChat = defineDesign({
  id: "testimonials-chat",
  version: 1,
  category: "testimonials",
  subcategory: "review-grid",
  name: L("شات", "Chat reviews"),
  description: L("آراء العملاء كرسايل واتساب مع ردود المتجر.", "Customer reviews as WhatsApp messages with your replies."),
  keywords: ["testimonials", "whatsapp", "chat", "messages", "playful", "آراء", "واتساب", "رسايل"],
  tree: (t) =>
    t.section({ label: L("آراء العملاء", "Testimonials") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("من الواتساب", "From WhatsApp")),
                  t.heading(L("رسايل بتفرّحنا", "Messages that made our day"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", letterSpacing: "tight" },
                  }),
                ],
                { label: L("العنوان", "Heading"), style: { gap: 10 } },
              ),
              t.stack(
                [
                  bubble(t, {
                    name: REVIEWS[0]!.name,
                    text: REVIEWS[0]!.text,
                    time: L("١٠:٢٤ ص", "10:24"),
                  }),
                  bubble(t, {
                    text: L("ده يسعدنا جدًا، شكرًا ليكي!", "So happy to hear that, thank you!"),
                    time: L("١٠:٢٦ ص", "10:26"),
                    me: true,
                  }),
                  bubble(t, {
                    name: REVIEWS[1]!.name,
                    text: REVIEWS[1]!.text,
                    time: L("٢:٠٢ م", "14:02"),
                  }),
                  bubble(t, {
                    name: REVIEWS[3]!.name,
                    text: REVIEWS[3]!.text,
                    time: L("٦:٤٥ م", "18:45"),
                  }),
                ],
                {
                  label: L("المحادثة", "Chat"),
                  role: "items",
                  style: {
                    background: "secondary",
                    radius: 28,
                    gap: 12,
                    maxWidth: "520px",
                    paddingTop: 24,
                    paddingBottom: 24,
                    paddingStart: 20,
                    paddingEnd: 20,
                  },
                  mobile: {
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingStart: 12,
                    paddingEnd: 12,
                  },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 48, alignItems: "center" },
              mobile: { gap: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
