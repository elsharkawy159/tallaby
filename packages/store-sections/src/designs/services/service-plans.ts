/**
 * Protection plans (Services W-f): three plan cards side by side (1, 2 and 3
 * years); the middle one is lifted in brand colour with a "most picked" tag.
 * Each card has the price, a ticked list and a button. Plans are not store
 * products, so the button opens the seller's WhatsApp instead of the cart.
 * Mobile stacks the cards with the highlighted plan first.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { BIG_NUMBER, pillButton } from "../_modular";
import { WHATSAPP_LINK, tickLine } from "./_shared";

const PLANS = [
  {
    name: L("سنة", "1 year"),
    price: L("١٩٩ ج.م", "EGP 199"),
    perks: [
      L("إصلاح الأعطال", "Fault repair"),
      L("فني في البيت", "Home visit"),
    ],
  },
  {
    name: L("سنتين", "2 years"),
    price: L("٣٤٩ ج.م", "EGP 349"),
    perks: [
      L("إصلاح الأعطال", "Fault repair"),
      L("فني في البيت", "Home visit"),
      L("جهاز بديل وقت الصيانة", "Loan device during repair"),
    ],
  },
  {
    name: L("٣ سنين", "3 years"),
    price: L("٤٧٩ ج.م", "EGP 479"),
    perks: [
      L("كل مزايا السنتين", "Everything in 2 years"),
      L("كسر الشاشة مرة واحدة", "One screen accident"),
    ],
  },
];

export const servicePlans = defineDesign({
  id: "service-plans",
  version: 1,
  category: "services",
  subcategory: "list",
  name: L("باقات الحماية", "Protection plans"),
  description: L(
    "ثلاث باقات ضمان جنب بعض، والوسطانية مميزة.",
    "Three warranty plans side by side, the middle one highlighted.",
  ),
  keywords: [
    "services",
    "warranty",
    "plans",
    "protection",
    "pricing",
    "ضمان",
    "باقات",
    "حماية",
  ],
  tree: (t) =>
    t.section({ label: L("باقات الحماية", "Protection plans") }, [
      t.container(
        [
          sectionHead(t, {
            eyebrow: L("الضمان", "Warranty"),
            title: L("احمي جهازك أكتر", "Protect it for longer"),
            align: "center",
          }),
          t.grid(
            PLANS.map((p, i) => {
              const on = i === 1;
              const ink = on ? "primaryInk" : "foreground";
              return t.stack(
                [
                  ...(on
                    ? [
                        t.badge(L("الأكتر طلبًا", "Most picked"), {
                          style: {
                            background: "accent",
                            color: "foreground",
                            fontWeight: "semibold",
                          },
                        }),
                      ]
                    : []),
                  t.heading(p.name, "h3", {
                    style: { fontSize: "xl", color: ink },
                  }),
                  t.text(p.price, {
                    role: "value",
                    style: { ...BIG_NUMBER, fontSize: "4xl", color: ink, lineHeight: "snug" },
                  }),
                  t.divider({
                    style: { width: "100%", ...(on && { opacity: 40 }) },
                  }),
                  t.stack(
                    p.perks.map((k) =>
                      tickLine(
                        t,
                        k,
                        on ? { tick: "accent", ink: "primaryInk" } : {},
                      ),
                    ),
                    {
                      label: L("المزايا", "Perks"),
                      role: "items",
                      style: { gap: 10, width: "100%" },
                    },
                  ),
                  t.stack(
                    [
                      pillButton(
                        t,
                        L("اختار الباقة", "Choose plan"),
                        WHATSAPP_LINK,
                        { tone: on ? "ink" : "outline" },
                      ),
                    ],
                    {
                      label: L("الزر", "Button"),
                      style: { width: "100%", marginTop: 8 },
                    },
                  ),
                ],
                {
                  label: L("باقة", "Plan"),
                  style: {
                    gap: 14,
                    justifyContent: "between",
                    radius: 24,
                    paddingTop: 32,
                    paddingBottom: 32,
                    paddingStart: 32,
                    paddingEnd: 32,
                    ...(on
                      ? {
                          background: "primary",
                          color: "primaryInk",
                          marginTop: -12,
                        }
                      : {
                          background: "background",
                          borderWidth: 1,
                          borderColor: "border",
                        }),
                  },
                  mobile: {
                    paddingTop: 24,
                    paddingBottom: 24,
                    paddingStart: 24,
                    paddingEnd: 24,
                    ...(on && { marginTop: 0, order: -1 }),
                  },
                },
              );
            }),
            {
              label: L("الباقات", "Plans"),
              role: "items",
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 16, alignItems: "stretch", marginTop: 44 },
              mobile: { gap: 20, marginTop: 28 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
