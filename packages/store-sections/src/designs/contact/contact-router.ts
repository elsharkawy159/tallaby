/**
 * Help router (Modular set): "What do you need?" over four large option tiles
 * (track an order, return, warranty, something else); each opens WhatsApp
 * with a matching message already typed. Routes customers before they write.
 * 2×2 on every size.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, iconDisc, modHead } from "../_modular";

const WA = "https://wa.me/201001234567?text=";
const OPTIONS = [
  {
    icon: "truck",
    text: L("أتابع طلبي", "Track my order"),
    message: "Track%20my%20order",
  },
  {
    icon: "rotate",
    text: L("أرجّع منتج", "Return a product"),
    message: "Return%20a%20product",
  },
  {
    icon: "shield",
    text: L("الضمان", "Warranty claim"),
    message: "Warranty%20claim",
  },
  { icon: "chat", text: L("حاجة تانية", "Something else"), message: "Hello" },
] as const;

export const contactRouter = defineDesign({
  id: "contact-router",
  version: 1,
  category: "contact",
  subcategory: "whatsapp",
  name: L("دليل المساعدة", "Help router"),
  description: L("أربع اختيارات، كل واحد يفتح واتساب برسالة جاهزة.", "Four options, each opening WhatsApp with a ready message."),
  keywords: ["contact", "help", "whatsapp", "support", "تواصل", "مساعدة", "واتساب"],
  tree: (t) =>
    t.section({ label: L("المساعدة", "Help") }, [
      t.container(
        [
          modHead(t, {
            label: L("المساعدة", "Help"),
            title: L("محتاج إيه؟", "What do you need?"),
          }),
          t.grid(
            OPTIONS.map((o) =>
              t.link(
                WA + o.message,
                [
                  t.row(
                    [
                      t.row(
                        [
                          iconDisc(t, o.icon, { color: "primary" }),
                          t.text(o.text, {
                            style: { fontWeight: "semibold", fontSize: "lg" },
                            mobile: { fontSize: "md" },
                          }),
                        ],
                        {
                          label: L("المحتوى", "Content"),
                          style: { gap: 14 },
                          mobile: {
                            direction: "column",
                            alignItems: "start",
                            gap: 10,
                          },
                        },
                      ),
                      t.icon("arrow", {
                        style: { fontSize: "lg", color: "primary" },
                      }),
                    ],
                    {
                      label: L("السطر", "Row"),
                      style: {
                        justifyContent: "between",
                        gap: 12,
                        wrap: false,
                      },
                    },
                  ),
                ],
                {
                  label: L("اختيار", "Option"),
                  style: {
                    ...FLUSH,
                    background: "secondary",
                    radius: 20,
                    paddingTop: 22,
                    paddingBottom: 22,
                    paddingStart: 22,
                    paddingEnd: 22,
                    hover: { background: "border" },
                  },
                  mobile: {
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingStart: 16,
                    paddingEnd: 16,
                  },
                },
              ),
            ),
            {
              label: L("الاختيارات", "Options"),
              role: "items",
              columns: { desktop: 2, mobile: 2 },
              style: { gap: 12 },
              mobile: { gap: 10 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
