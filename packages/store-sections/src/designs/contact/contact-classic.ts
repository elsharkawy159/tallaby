/**
 * Classic contact (library K-a, Classic template Contact page): a message card
 * with WhatsApp and call buttons on the start side; on the end side bordered
 * info rows with tinted icon tiles, and a store photo under them.
 */
import { defineDesign } from "../builder";
import { L, PAPER_CARD, iconTile } from "../_kit";
import { CHANNELS } from "./_shared";

export const contactClassic = defineDesign({
  id: "contact-classic",
  version: 1,
  category: "contact",
  subcategory: "info",
  name: L("تواصل كلاسيك", "Classic contact"),
  description: L(
    "بطاقة مراسلة بأزرار واتساب واتصال بجانب طرق التواصل وصورة المتجر.",
    "A message card with WhatsApp and call buttons beside your contact details and a store photo.",
  ),
  keywords: ["contact", "whatsapp", "phone", "classic", "تواصل", "اتصل بنا", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("تواصل معنا", "Contact us") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.badge(L("تواصل معنا", "Get in touch"), { role: "eyebrow", style: { color: "primary" } }),
                  t.heading(L("راسلنا، نرد عليك بأنفسنا", "Message us, we reply ourselves"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.paragraph(
                    L(
                      "لأي سؤال عن طلب أو منتج أو استرجاع، أسرع طريق هو واتساب.",
                      "For any question about an order, a product or a return, WhatsApp is the fastest way.",
                    ),
                    { role: "body" },
                  ),
                  t.row(
                    [
                      t.button(L("راسلنا على واتساب", "Chat on WhatsApp"), "https://wa.me/201001234567", "solid", { role: "cta" }),
                      t.button(L("اتصل بنا", "Call us"), "tel:+201001234567", "outline"),
                    ],
                    { label: L("الأزرار", "Buttons"), style: { gap: 10 } },
                  ),
                ],
                {
                  label: L("بطاقة المراسلة", "Message card"),
                  style: { ...PAPER_CARD, gap: 14, alignItems: "start", radius: 24, paddingTop: 36, paddingBottom: 36, paddingStart: 32, paddingEnd: 32 },
                },
              ),
              t.stack(
                [
                  ...CHANNELS.map((c) =>
                    t.link(
                      c.href,
                      [
                        t.row(
                          [
                            iconTile(t, c.icon),
                            t.stack(
                              [
                                t.text(c.label, { style: { color: "muted", fontSize: "xs" } }),
                                t.text(c.value, { style: { fontWeight: "semibold", fontSize: "md" } }),
                              ],
                              {
                                label: L("النص", "Copy"),
                                style: { gap: 2 },
                              },
                            ),
                          ],
                          { label: L("المحتوى", "Content"), style: { gap: 14, wrap: false } },
                        ),
                      ],
                      { label: L("طريقة تواصل", "Channel"), style: { ...PAPER_CARD, radius: 16, hover: { borderColor: "primary" } } },
                    ),
                  ),
                  t.person(2, L("صورة المتجر", "Store photo"), { role: "image", style: { aspectRatio: "wide", objectFit: "cover", radius: 20 } }),
                ],
                { label: L("طرق التواصل", "Channels"), role: "items", style: { gap: 10 } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 32, alignItems: "start" }, mobile: { gap: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
