/**
 * Photo and list (Modular set): a tall photo on the start side; on the end
 * side a title and a ruled list of three short points with ticks, then a link.
 * A quick "what you get" block. On mobile the photo sits on top.
 */
import { defineDesign } from "../builder";
import { L, arrowLink } from "../_kit";
import { dotLabel } from "../_modular";

const POINTS = [
  L("فاتورة رسمية وضمان", "Official invoice and warranty"),
  L("تغليف محمي من الصدمات", "Shock-proof packaging"),
  L("رقم تتبع على واتساب", "Tracking number on WhatsApp"),
];

export const aboutList = defineDesign({
  id: "about-list",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("صورة وقائمة", "Photo and list"),
  description: L("صورة طولية بجانب عنوان وقائمة نقاط قصيرة.", "A tall photo beside a title and a short list of points."),
  keywords: ["image with text", "list", "points", "minimal", "صورة ونص", "نقاط"],
  tree: (t) =>
    t.section({ label: L("صورة ونص", "Image with text") }, [
      t.container(
        [
          t.grid(
            [
              t.photo(5, L("صورة المتجر", "Store photo"), {
                role: "image",
                style: {
                  aspectRatio: "portrait",
                  objectFit: "cover",
                  radius: 24,
                  width: "100%",
                },
                mobile: { aspectRatio: "landscape" },
              }),
              t.stack(
                [
                  dotLabel(t, L("مع كل طلب", "With every order")),
                  t.heading(L("كل منتج بيتراجع قبل ما يوصلك", "Every product is checked before it reaches you"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", letterSpacing: "tight" },
                  }),
                  t.stack(
                    POINTS.flatMap((p, i) => [
                      ...(i
                        ? []
                        : [
                            t.divider({
                              style: { marginTop: 0, marginBottom: 0 },
                            }),
                          ]),
                      t.row(
                        [
                          t.icon("check", {
                            style: { fontSize: "lg", color: "primary" },
                          }),
                          t.text(p, { style: { fontWeight: "medium" } }),
                        ],
                        {
                          label: L("نقطة", "Point"),
                          style: { gap: 12, paddingTop: 14, paddingBottom: 14 },
                        },
                      ),
                      t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
                    ]),
                    {
                      label: L("النقاط", "Points"),
                      role: "items",
                      style: { gap: 0 },
                    },
                  ),
                  arrowLink(t, L("اعرف أكتر", "Learn more"), "/about"),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { gap: 20, alignItems: "start" },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 64, alignItems: "center" },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
