/**
 * Big type (Modular set): a sun-coloured panel with a very large headline, and
 * a row below with a short line and the store's sign-up form. For pages where
 * the sign-up offer is the main message. Stacks on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { SUN_TILE, TILE_MOBILE } from "../_modular";

export const newsletterBig = defineDesign({
  id: "newsletter-big",
  version: 1,
  category: "newsletter",
  subcategory: "panel",
  name: L("خط كبير", "Big type"),
  description: L("لوحة مشرقة بعنوان ضخم ونموذج الاشتراك.", "A bright panel with a huge headline and the sign-up form."),
  keywords: ["newsletter", "subscribe", "bold", "big type", "نشرة", "اشتراك"],
  tree: (t) =>
    t.section({ label: L("النشرة", "Newsletter") }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("خد ١٠٪ خصم على أول طلب", "Get 10% off your first order"), "h2", {
                role: "title",
                style: {
                  fontSize: "display-lg",
                  letterSpacing: "tight",
                  lineHeight: "tight",
                  color: "foreground",
                  maxWidth: "16ch",
                },
              }),
              t.grid(
                [
                  t.paragraph(L("عروض للمشتركين بس، مرة في الأسبوع.", "Members-only offers, once a week."), {
                    role: "subtitle",
                    style: { color: "foreground", fontSize: "lg" },
                  }),
                  t.box([t.storeForm()], {
                    label: L("النموذج", "Form box"),
                    style: {
                      background: "background",
                      radius: 20,
                      paddingTop: 16,
                      paddingBottom: 16,
                      paddingStart: 16,
                      paddingEnd: 16,
                    },
                  }),
                ],
                {
                  label: L("السطر", "Row"),
                  columns: { desktop: 2, mobile: 1 },
                  style: { gap: 32, alignItems: "center" },
                  mobile: { gap: 16 },
                },
              ),
            ],
            {
              label: L("اللوحة", "Panel"),
              style: {
                ...SUN_TILE,
                gap: 32,
                paddingTop: 56,
                paddingBottom: 48,
                paddingStart: 48,
                paddingEnd: 48,
              },
              mobile: { ...TILE_MOBILE, gap: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
