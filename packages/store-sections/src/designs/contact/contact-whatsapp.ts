/**
 * WhatsApp banner (library K-d): a tinted rounded band with the title, the
 * average reply time and a large WhatsApp button on the start side, and a
 * sample conversation in chat bubbles on the end side.
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

const bubble = (t: TreeBuilder, text: DesignText, me: boolean) =>
  t.stack([t.text(text, { style: { fontSize: "md", ...(me && { color: "primaryInk" }) } })], {
    label: me ? L("رسالة العميل", "Customer message") : L("ردّنا", "Our reply"),
    style: {
      background: me ? "primary" : "background",
      radius: 18,
      paddingTop: 12,
      paddingBottom: 12,
      paddingStart: 16,
      paddingEnd: 16,
      maxWidth: "80%",
      shadow: "sm",
      ...(me ? { marginStart: 0 } : { marginStart: 64 }),
    },
    mobile: me ? {} : { marginStart: 32 },
  });

export const contactWhatsapp = defineDesign({
  id: "contact-whatsapp",
  version: 1,
  category: "contact",
  subcategory: "whatsapp",
  name: L("اطلب على واتساب", "Order on WhatsApp"),
  description: L("شريط بزر واتساب كبير ومتوسط وقت الرد ومحادثة توضيحية.", "A band with a big WhatsApp button, the reply time and a sample chat."),
  keywords: ["whatsapp", "chat", "order", "واتساب", "محادثة", "اطلب"],
  tree: (t) =>
    t.section({ label: L("واتساب", "WhatsApp") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("اطلب على واتساب", "Order on WhatsApp"), "h2", { role: "title", style: { fontSize: "display-md", fontWeight: "extrabold" } }),
                  t.row(
                    [
                      t.icon("clock", { style: { color: "primary" } }),
                      t.text(L("متوسط الرد ١٢ دقيقة", "Average reply in 12 minutes"), { style: { fontSize: "md" } }),
                    ],
                    {
                      label: L("وقت الرد", "Reply time"),
                      style: { gap: 8 },
                    },
                  ),
                  t.button(L("ابدأ المحادثة", "Start chatting"), "https://wa.me/201001234567", "solid", { role: "cta", style: { marginTop: 8 } }),
                ],
                { label: L("النص", "Copy"), style: { gap: 14, alignItems: "start" } },
              ),
              t.stack(
                [
                  bubble(t, L("أهلًا، هل المنتج متاح باللون الأبيض؟", "Hi, is it available in white?"), true),
                  bubble(t, L("نعم متاح، ويصلك غدًا 👌", "Yes it is, and it can reach you tomorrow"), false),
                  bubble(t, L("تمام، سأطلبه الآن", "Great, ordering now"), true),
                ],
                { label: L("المحادثة", "Chat"), style: { gap: 10 } },
              ),
            ],
            {
              label: L("الشريط", "Band"),
              columns: { desktop: 2, mobile: 1 },
              style: {
                gap: 40,
                alignItems: "center",
                background: "secondary",
                radius: 32,
                paddingTop: 48,
                paddingBottom: 48,
                paddingStart: 48,
                paddingEnd: 48,
              },
              mobile: { gap: 28, paddingTop: 28, paddingBottom: 28, paddingStart: 20, paddingEnd: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
