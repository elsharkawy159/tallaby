/**
 * Note card (Modular set): a sun-coloured note card centred on the page, with
 * a pin dot, a short heading, two lines of text and a signature. A friendly
 * notice: a thank-you, a holiday delay, a small change.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const textNote = defineDesign({
  id: "text-note",
  version: 1,
  category: "rich-text",
  subcategory: "notice",
  name: L("ورقة ملاحظة", "Note card"),
  description: L("ورقة ملاحظة ملوّنة فيها تنبيه قصير.", "A bright note card with a short notice."),
  keywords: ["text", "notice", "note", "announcement", "playful", "ملاحظة", "تنبيه"],
  tree: (t) =>
    t.section({ label: L("ملاحظة", "Note") }, [
      t.container(
        [
          t.stack(
            [
              t.stack(
                [
                  t.box([], {
                    label: L("الدبوس", "Pin"),
                    style: {
                      background: "primary",
                      radius: 999,
                      width: "16px",
                      minHeight: 16,
                      shadow: "sm",
                    },
                  }),
                  t.heading(L("ملحوظة صغيرة", "A small note"), "h2", {
                    role: "title",
                    style: {
                      fontSize: "2xl",
                      color: "foreground",
                      textAlign: "center",
                    },
                  }),
                  t.paragraph(
                    L(
                      "الشحنات هتتأخر يوم واحد الأسبوع ده بسبب الإجازة. شكرًا على صبركم!",
                      "Shipments are one day late this week because of the holiday. Thank you for your patience!",
                    ),
                    {
                      role: "body",
                      style: { color: "foreground", textAlign: "center" },
                    },
                  ),
                  t.text(L("— فريق المتجر", "— The store team"), {
                    style: { fontSize: "sm", color: "foreground", opacity: 70 },
                  }),
                ],
                {
                  label: L("الورقة", "Note"),
                  style: {
                    background: "accent",
                    radius: 6,
                    shadow: "md",
                    gap: 12,
                    alignItems: "center",
                    width: "100%",
                    maxWidth: "480px",
                    paddingTop: 20,
                    paddingBottom: 32,
                    paddingStart: 32,
                    paddingEnd: 32,
                  },
                  mobile: { paddingStart: 20, paddingEnd: 20 },
                },
              ),
            ],
            {
              label: L("المحاذاة", "Alignment"),
              style: { alignItems: "center" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
