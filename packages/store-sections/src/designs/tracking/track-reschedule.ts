/**
 * Won't be home? (library D-g, reworked): a narrow bordered card with the
 * title, one line, the store's delivery windows as plain rows and a WhatsApp
 * button to ask for another time. The design's day chips and radio windows
 * would change the delivery; nothing in the store can, so the windows are
 * the seller's typed information and the change happens in the chat.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { pillButton } from "../_modular";
import { TRACK_CARD, TRACK_CARD_MOBILE, WA } from "./_shared";

const WINDOWS = [
  L("١٠ ص – ١ م", "10 am – 1 pm"),
  L("١ – ٥ م", "1 – 5 pm"),
  L("٥ – ٩ م", "5 – 9 pm"),
];

export const trackReschedule = defineDesign({
  id: "track-reschedule",
  version: 1,
  category: "tracking",
  subcategory: "delivery",
  name: L("غيّر معاد التوصيل", "Change the delivery time"),
  description: L(
    "مواعيد التوصيل عندك وزرار واتساب للعميل اللي مش هيكون موجود.",
    "Your delivery windows and a WhatsApp button for shoppers who won't be home.",
  ),
  keywords: [
    "tracking",
    "delivery",
    "reschedule",
    "time",
    "whatsapp",
    "توصيل",
    "معاد",
    "تغيير",
  ],
  tree: (t) =>
    t.section({ label: L("معاد التوصيل", "Delivery time") }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("مش هتكون موجود؟", "Won't be home?"), "h2", {
                role: "title",
                style: { fontSize: "display-sm", letterSpacing: "tight" },
              }),
              t.paragraph(
                L(
                  "كلمنا قبل ما المندوب يتحرك ونتفق على يوم ومعاد يناسبك.",
                  "Message us before the courier sets off and we'll agree a day and time that suit you.",
                ),
                { role: "subtitle" },
              ),
              t.text(L("مواعيد التوصيل عندنا", "Our delivery windows"), {
                style: {
                  fontSize: "sm",
                  fontWeight: "semibold",
                  color: "muted",
                  marginTop: 4,
                },
              }),
              t.stack(
                WINDOWS.map((w) =>
                  t.row(
                    [
                      t.icon("clock", {
                        style: { fontSize: "lg", color: "primary" },
                      }),
                      t.text(w, { style: { fontWeight: "medium" } }),
                    ],
                    {
                      label: L("معاد", "Window"),
                      style: {
                        gap: 14,
                        wrap: false,
                        alignItems: "center",
                        background: "secondary",
                        radius: 14,
                        minHeight: 56,
                        paddingStart: 18,
                        paddingEnd: 18,
                      },
                    },
                  ),
                ),
                {
                  label: L("المواعيد", "Windows"),
                  role: "items",
                  style: { gap: 8 },
                },
              ),
              pillButton(
                t,
                L("غيّر المعاد على واتساب", "Change the time on WhatsApp"),
                `${WA}?text=I%20need%20to%20change%20my%20delivery%20time`,
                {
                  icon: "chat",
                  style: {
                    width: "100%",
                    marginTop: 4,
                    paddingTop: 15,
                    paddingBottom: 15,
                  },
                },
              ),
            ],
            {
              label: L("البطاقة", "Card"),
              style: { ...TRACK_CARD, gap: 14 },
              mobile: TRACK_CARD_MOBILE,
            },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "560px" } },
      ),
    ]),
});
