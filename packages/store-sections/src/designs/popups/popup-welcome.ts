/**
 * Welcome offer (library PU-a), drawn inline: the welcome pop-up's split card
 * set in the page, centred on a shelf band, with a lifestyle photo on the
 * start side and a small label, the offer in large type, a line and the
 * store's form on the end side. No overlay, trigger or "no thanks" link: it
 * is an ordinary section. On mobile the photo hides, like the design's bottom
 * sheet.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const popupWelcome = defineDesign({
  id: "popup-welcome",
  version: 1,
  category: "popups",
  subcategory: "welcome",
  name: L("نافذة الترحيب", "Welcome offer"),
  description: L("كارت ترحيب بصورة وعرض كبير ونموذج يجمع رقم أو إيميل العميل.", "A welcome card with a photo, a big offer and a form that collects a number or email."),
  keywords: ["popup", "welcome", "offer", "discount", "first order", "نافذة", "ترحيب", "خصم", "أول طلب"],
  tree: (t) =>
    t.section({ label: L("نافذة الترحيب", "Welcome offer"), style: { background: "secondary" } }, [
      t.container(
        [
          t.row(
            [
              t.grid(
                [
                  t.photo(2, L("صورة الترحيب", "Welcome photo"), {
                    role: "image",
                    style: { objectFit: "cover", width: "100%", minHeight: 420, aspectRatio: "portrait" },
                    mobile: { hidden: true },
                  }),
                  t.stack(
                    [
                      t.text(L("أهلاً بيك", "Welcome"), {
                        role: "eyebrow",
                        style: { fontSize: "sm", fontWeight: "semibold", color: "muted" },
                      }),
                      t.heading(L("خصم ١٠٪ على أول طلب", "10% off your first order"), "h2", {
                        role: "title",
                        style: { fontSize: "display-md", lineHeight: "tight", letterSpacing: "tight" },
                        mobile: { fontSize: "display-sm" },
                      }),
                      t.paragraph(L("سيب رقمك وهنبعتلك الكود على واتساب.", "Leave your number and we send the code on WhatsApp."), {
                        role: "subtitle",
                      }),
                      t.storeForm(),
                    ],
                    {
                      label: L("العرض", "Offer"),
                      style: { gap: 14, justifyContent: "center", paddingTop: 40, paddingBottom: 40, paddingStart: 32, paddingEnd: 32 },
                      mobile: { paddingTop: 28, paddingBottom: 28, paddingStart: 20, paddingEnd: 20 },
                    },
                  ),
                ],
                {
                  label: L("الكارت", "Card"),
                  columns: { desktop: 2, mobile: 1 },
                  style: {
                    background: "background",
                    radius: 24,
                    overflow: "hidden",
                    shadow: "lg",
                    gap: 0,
                    alignItems: "stretch",
                    width: "100%",
                    maxWidth: "760px",
                  },
                },
              ),
            ],
            { label: L("المنتصف", "Centre"), style: { justifyContent: "center" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
