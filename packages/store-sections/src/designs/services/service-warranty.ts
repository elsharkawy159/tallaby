/**
 * Register warranty (Services W-d): a brand tile with a shield, the title and
 * three ticked benefits, beside an outlined tile holding one of the store's
 * forms. The seller builds the form (serial number, purchase date, phone) in
 * their forms and picks it here; requests arrive in the dashboard.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BRAND_TILE, TILE_MOBILE } from "../_modular";
import { tickLine } from "./_shared";

const BENEFITS = [
  L("مش محتاج تحتفظ بالفاتورة", "No need to keep the receipt"),
  L("تتابع طلب الصيانة أونلاين", "Track repair requests online"),
  L("تنبيه قبل ما الضمان يخلص", "A reminder before it expires"),
];

export const serviceWarranty = defineDesign({
  id: "service-warranty",
  version: 1,
  category: "services",
  subcategory: "requests",
  name: L("سجّل ضمانك", "Register warranty"),
  description: L(
    "مربع بمزايا تسجيل الضمان، وجنبه نموذج التسجيل.",
    "A tile with the benefits of registering, beside the registration form.",
  ),
  keywords: [
    "services",
    "warranty",
    "register",
    "form",
    "ضمان",
    "تسجيل",
    "نموذج",
  ],
  tree: (t) =>
    t.section({ label: L("سجّل ضمانك", "Register warranty") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.icon("shield", {
                    style: { fontSize: "4xl", color: "primaryInk" },
                  }),
                  t.heading(
                    L(
                      "سجّل ضمانك في دقيقة",
                      "Register your warranty in a minute",
                    ),
                    "h2",
                    {
                      role: "title",
                      style: {
                        fontSize: "5xl",
                        letterSpacing: "tight",
                        lineHeight: "tight",
                        color: "primaryInk",
                        maxWidth: "14ch",
                        marginTop: 24,
                      },
                      mobile: { fontSize: "3xl", marginTop: 8 },
                    },
                  ),
                  t.stack(
                    BENEFITS.map((b) =>
                      tickLine(t, b, { tick: "accent", ink: "primaryInk" }),
                    ),
                    {
                      label: L("المزايا", "Benefits"),
                      role: "items",
                      style: { gap: 10 },
                    },
                  ),
                ],
                {
                  label: L("المزايا", "Benefits tile"),
                  style: {
                    ...BRAND_TILE,
                    gap: 18,
                    justifyContent: "between",
                    paddingTop: 44,
                    paddingBottom: 44,
                    paddingStart: 44,
                    paddingEnd: 44,
                  },
                  mobile: TILE_MOBILE,
                },
              ),
              t.stack([t.storeForm()], {
                label: L("النموذج", "Form tile"),
                style: {
                  borderWidth: 1,
                  borderColor: "border",
                  radius: 24,
                  justifyContent: "center",
                  paddingTop: 40,
                  paddingBottom: 40,
                  paddingStart: 40,
                  paddingEnd: 40,
                },
                mobile: TILE_MOBILE,
              }),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 12 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
