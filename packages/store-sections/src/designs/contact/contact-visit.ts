/**
 * Map with card (library K-b): a wide photo of the store with an info card
 * floating over its start side: name, address, opening hours with today
 * highlighted, and directions and WhatsApp buttons. On mobile the card drops
 * under the photo.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const contactVisit = defineDesign({
  id: "contact-visit",
  version: 1,
  category: "contact",
  subcategory: "address",
  name: L("زورنا", "Visit us"),
  description: L("صورة المتجر وبطاقة بالعنوان ومواعيد العمل وزر الاتجاهات.", "A store photo with a card holding the address, hours and directions."),
  keywords: ["visit", "address", "map", "hours", "location", "زورنا", "العنوان", "مواعيد", "خريطة"],
  tree: (t) =>
    t.section({ label: L("زورنا", "Visit us") }, [
      t.container(
        [
          t.box(
            [
              t.person(6, L("واجهة المتجر", "Store front"), {
                role: "image",
                style: { aspectRatio: "wide", objectFit: "cover", radius: 28 },
                mobile: { aspectRatio: "landscape", radius: 18 },
              }),
              t.stack(
                [
                  t.badge(L("زورنا", "Visit us"), { role: "eyebrow", style: { color: "primary" } }),
                  t.heading(L("فرع الدقي", "Dokki branch"), "h2", { role: "title", style: { fontSize: "2xl" } }),
                  t.paragraph(L("٢٤ شارع التحرير، الدقي، الجيزة", "24 Tahrir St, Dokki, Giza"), { role: "body" }),
                  t.row([t.text(L("السبت – الخميس", "Sat – Thu"), { style: { fontWeight: "semibold" } }), t.text(L("١٠ ص – ١٠ م", "10am – 10pm"))], {
                    label: L("اليوم", "Today"),
                    style: {
                      justifyContent: "between",
                      background: "secondary",
                      radius: 10,
                      paddingTop: 8,
                      paddingBottom: 8,
                      paddingStart: 12,
                      paddingEnd: 12,
                    },
                  }),
                  t.row([t.text(L("الجمعة", "Friday"), { style: { fontWeight: "semibold" } }), t.text(L("٢ م – ١٠ م", "2pm – 10pm"))], {
                    label: L("الجمعة", "Friday"),
                    style: { justifyContent: "between", paddingTop: 8, paddingBottom: 8, paddingStart: 12, paddingEnd: 12 },
                  }),
                  t.row(
                    [
                      t.button(L("الاتجاهات", "Directions"), "https://maps.google.com/", "solid"),
                      t.button(L("واتساب", "WhatsApp"), "https://wa.me/201001234567", "outline"),
                    ],
                    {
                      label: L("الأزرار", "Buttons"),
                      style: { gap: 10, marginTop: 6 },
                    },
                  ),
                ],
                {
                  label: L("بطاقة المعلومات", "Info card"),
                  style: {
                    position: "absolute",
                    insetTop: "32px",
                    insetStart: "32px",
                    width: "380px",
                    background: "background",
                    radius: 24,
                    gap: 10,
                    paddingTop: 28,
                    paddingBottom: 28,
                    paddingStart: 28,
                    paddingEnd: 28,
                    shadow: "md",
                  },
                  mobile: {
                    position: "relative",
                    insetTop: "auto",
                    insetStart: "auto",
                    width: "auto",
                    marginTop: -32,
                    marginStart: 12,
                    marginEnd: 12,
                    paddingTop: 20,
                    paddingBottom: 20,
                    paddingStart: 20,
                    paddingEnd: 20,
                  },
                },
              ),
            ],
            { label: L("الصورة والبطاقة", "Photo and card"), style: { position: "relative", minHeight: 480 }, mobile: { minHeight: 0 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
