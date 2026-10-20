/**
 * Form section (library K-f, the builder's Forms tab): the title, a line and
 * three reassurance rows on the start side, and one of the store's own forms
 * in a card on the end side. The Forms tab binds the form and puts its name
 * in the title; from the library the seller picks the form in its settings.
 */
import { defineDesign } from "../builder";
import { L, PAPER_CARD, iconTile } from "../_kit";

const POINTS = [
  { icon: "chat", text: L("بنرد على كل رسالة بأنفسنا", "We answer every message ourselves") },
  { icon: "clock", text: L("الرد عادةً خلال يوم عمل", "Replies usually within one working day") },
  { icon: "shield", text: L("بياناتك عندنا بس، ومش بنشاركها", "Your details stay with us and are never shared") },
] as const;

export const contactForm = defineDesign({
  id: "contact-form",
  version: 1,
  category: "contact",
  subcategory: "form",
  name: L("نموذج", "Form"),
  description: L(
    "عنوان ونقاط طمأنة بجانب نموذج من نماذج متجرك، وتوصلك الرسائل في صندوق الوارد.",
    "A title and reassurance points beside one of your store's forms; messages reach your inbox.",
  ),
  keywords: ["form", "contact", "lead", "quote", "booking", "inquiry", "نموذج", "تواصل", "طلب", "حجز", "استفسار"],
  tree: (t) =>
    t.section({ label: L("النموذج", "Form section") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.badge(L("راسلنا", "Write to us"), { role: "eyebrow", style: { color: "primary" } }),
                  t.heading(L("ابعتلنا وهنرجعلك", "Send us a message"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.paragraph(L("املا البيانات وهنتواصل معاك في أقرب وقت.", "Fill in your details and we'll get back to you soon."), {
                    role: "subtitle",
                  }),
                  t.stack(
                    POINTS.map((point) =>
                      t.row([iconTile(t, point.icon), t.text(point.text, { style: { fontSize: "sm", fontWeight: "medium" } })], {
                        label: L("نقطة", "Point"),
                        style: { gap: 12, wrap: false, alignItems: "center" },
                      }),
                    ),
                    { label: L("النقاط", "Points"), role: "items", style: { gap: 12, paddingTop: 8 } },
                  ),
                ],
                { label: L("النص", "Copy"), style: { gap: 14, alignItems: "start" } },
              ),
              t.box([t.storeForm()], {
                label: L("بطاقة النموذج", "Form card"),
                style: { ...PAPER_CARD, radius: 24, paddingTop: 28, paddingBottom: 28, paddingStart: 28, paddingEnd: 28 },
                mobile: { paddingTop: 20, paddingBottom: 20, paddingStart: 18, paddingEnd: 18 },
              }),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 40, alignItems: "start" }, mobile: { gap: 24 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
