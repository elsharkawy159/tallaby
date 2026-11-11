/**
 * Big type (Modular set): a sun-coloured panel with a very large headline, and
 * a row below with a short line and the store's sign-up form. For pages where
 * the sign-up offer is the main message. Stacks on mobile.
 *
 * v2 (look-first pilot, F-89): the headline is larger and leads alone, a
 * hairline separates it from the row below, and the form sits straight on the
 * panel on one row (email, name, button) with the consent line small
 * underneath, instead of a white box with stacked fields. Same nodes, labels
 * and copy as v1.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { SUN_TILE, TILE_MOBILE } from "../_modular";

export const newsletterBig = defineDesign({
  id: "newsletter-big",
  version: 2,
  category: "newsletter",
  subcategory: "panel",
  name: L("خط كبير", "Big type"),
  description: L(
    "لوحة مشرقة بعنوان ضخم ونموذج الاشتراك في سطر واحد.",
    "A bright panel with a huge headline and a one-row sign-up form.",
  ),
  keywords: [
    "newsletter",
    "subscribe",
    "bold",
    "big type",
    "inline",
    "نشرة",
    "اشتراك",
  ],
  tree: (t) =>
    t.section({ label: L("النشرة", "Newsletter") }, [
      t.container(
        [
          t.stack(
            [
              t.heading(
                L("خد ١٠٪ خصم على أول طلب", "Get 10% off your first order"),
                "h2",
                {
                  role: "title",
                  style: {
                    fontSize: "display-lg",
                    letterSpacing: "tight",
                    lineHeight: "tight",
                    color: "foreground",
                    maxWidth: "16ch",
                  },
                  motion: { reveal: "words" },
                },
              ),
              t.divider({
                style: {
                  marginTop: 0,
                  marginBottom: 0,
                  borderColor: "foreground",
                  opacity: 20,
                },
              }),
              t.grid(
                [
                  t.paragraph(
                    L(
                      "عروض للمشتركين بس، مرة في الأسبوع.",
                      "Members-only offers, once a week.",
                    ),
                    {
                      role: "subtitle",
                      style: {
                        color: "foreground",
                        fontSize: "lg",
                        maxWidth: "32ch",
                      },
                    },
                  ),
                  t.box([t.storeForm({ layout: "inline" })], {
                    label: L("النموذج", "Form box"),
                    style: { color: "foreground" },
                  }),
                ],
                {
                  label: L("السطر", "Row"),
                  columns: { desktop: 2, tablet: 1, mobile: 1 },
                  style: { gap: 48, alignItems: "start" },
                  tablet: { gap: 20 },
                  mobile: { gap: 16 },
                },
              ),
            ],
            {
              label: L("اللوحة", "Panel"),
              style: {
                ...SUN_TILE,
                gap: 36,
                paddingTop: 72,
                paddingBottom: 56,
                paddingStart: 56,
                paddingEnd: 56,
              },
              tablet: {
                paddingTop: 48,
                paddingBottom: 40,
                paddingStart: 36,
                paddingEnd: 36,
                gap: 28,
              },
              mobile: {
                ...TILE_MOBILE,
                paddingTop: 32,
                paddingBottom: 28,
                gap: 20,
              },
              motion: { reveal: "none" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
