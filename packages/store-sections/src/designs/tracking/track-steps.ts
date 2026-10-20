/**
 * Order stages (library D-b, reworked): a bordered card with a heading and a
 * sun delivery-time pill, then the four stages an order goes through on one
 * line (a brand dot and a rule per stage), each with what it means and how
 * long it usually takes. The design shows one order's live progress; no
 * section can read an order, so this explains the stages in the seller's
 * words instead, and links signed-in shoppers to their real order status.
 * Mobile stacks the stages.
 */
import type { ElementIconName } from "../../elements/registry";
import { defineDesign } from "../builder";
import { L, arrowLink } from "../_kit";
import { dotLabel } from "../_modular";
import { ORDERS_HREF, TRACK_CARD, TRACK_CARD_MOBILE } from "./_shared";

const STAGES: {
  icon: ElementIconName;
  title: ReturnType<typeof L>;
  text: ReturnType<typeof L>;
  time: ReturnType<typeof L>;
}[] = [
  {
    icon: "check",
    title: L("اتأكد", "Confirmed"),
    text: L(
      "بنكلمك أو نبعتلك رسالة نأكد الطلب والعنوان.",
      "We call or message you to confirm the order and address.",
    ),
    time: L("خلال ساعات", "Within hours"),
  },
  {
    icon: "package",
    title: L("اتجهز", "Packed"),
    text: L(
      "بنفحص المنتجات ونغلّفها كويس.",
      "We check your items and pack them with care.",
    ),
    time: L("خلال يوم", "Within a day"),
  },
  {
    icon: "truck",
    title: L("مع المندوب", "With the courier"),
    text: L(
      "شركة الشحن استلمت الطلب وهو في الطريق ليك.",
      "The courier has your order and it is on the way.",
    ),
    time: L("١–٣ أيام", "1–3 days"),
  },
  {
    icon: "map-pin",
    title: L("وصل", "Delivered"),
    text: L(
      "الطلب وصلك. لو في أي مشكلة كلمنا.",
      "Your order is with you. Any problem, message us.",
    ),
    time: L("وصلك", "Done"),
  },
];

export const trackSteps = defineDesign({
  id: "track-steps",
  version: 1,
  category: "tracking",
  subcategory: "status",
  name: L("مراحل الطلب", "Order stages"),
  description: L(
    "المراحل الأربع اللي بيعدي بيها الطلب، ومعنى كل مرحلة ومدتها.",
    "The four stages an order goes through, what each means and how long it takes.",
  ),
  keywords: [
    "tracking",
    "order status",
    "stages",
    "steps",
    "delivery",
    "تتبع",
    "حالة الطلب",
    "مراحل",
  ],
  tree: (t) =>
    t.section({ label: L("مراحل الطلب", "Order stages") }, [
      t.container(
        [
          t.stack(
            [
              t.row(
                [
                  t.stack(
                    [
                      dotLabel(t, L("حالة الطلب", "Order status")),
                      t.heading(
                        L("طلبك بيمشي إزاي؟", "How your order moves"),
                        "h2",
                        {
                          role: "title",
                          style: {
                            fontSize: "display-sm",
                            letterSpacing: "tight",
                          },
                        },
                      ),
                    ],
                    {
                      label: L("العنوان", "Heading"),
                      role: "intro",
                      style: { gap: 8 },
                    },
                  ),
                  t.row(
                    [
                      t.icon("clock", {
                        style: { fontSize: "lg", color: "foreground" },
                      }),
                      t.text(
                        L(
                          "التوصيل عادةً خلال ٢–٤ أيام",
                          "Delivery usually takes 2–4 days",
                        ),
                        {
                          style: { fontWeight: "semibold", fontSize: "sm" },
                        },
                      ),
                    ],
                    {
                      label: L("مدة التوصيل", "Delivery time"),
                      style: {
                        gap: 8,
                        wrap: false,
                        background: "accent",
                        color: "foreground",
                        radius: 999,
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingStart: 18,
                        paddingEnd: 18,
                      },
                    },
                  ),
                ],
                {
                  label: L("رأس البطاقة", "Card head"),
                  style: {
                    justifyContent: "between",
                    alignItems: "end",
                    gap: 16,
                    marginBottom: 32,
                  },
                  mobile: { marginBottom: 16, alignItems: "start" },
                },
              ),
              t.grid(
                STAGES.map((stage, i) =>
                  t.stack(
                    [
                      t.row(
                        [
                          t.box(
                            [
                              t.icon(stage.icon, {
                                style: { fontSize: "md", color: "primaryInk" },
                              }),
                            ],
                            {
                              label: L("النقطة", "Dot"),
                              style: {
                                background: "primary",
                                radius: 999,
                                width: "36px",
                                minHeight: 36,
                                paddingTop: 7,
                                paddingBottom: 5,
                                textAlign: "center",
                              },
                            },
                          ),
                          ...(i < STAGES.length - 1
                            ? [
                                t.box([], {
                                  label: L("الخط", "Rule"),
                                  style: {
                                    background: "border",
                                    radius: 999,
                                    minHeight: 3,
                                    width: "70%",
                                  },
                                  mobile: { hidden: true },
                                }),
                              ]
                            : []),
                        ],
                        {
                          label: L("المؤشر", "Marker"),
                          style: {
                            gap: 10,
                            wrap: false,
                            alignItems: "center",
                            marginBottom: 8,
                          },
                        },
                      ),
                      t.heading(stage.title, "h3", {
                        style: { fontSize: "lg" },
                      }),
                      t.paragraph(stage.text, { style: { fontSize: "sm" } }),
                      t.text(stage.time, {
                        style: {
                          fontSize: "xs",
                          fontWeight: "semibold",
                          color: "primary",
                        },
                      }),
                    ],
                    { label: L("مرحلة", "Stage"), style: { gap: 4 } },
                  ),
                ),
                {
                  label: L("المراحل", "Stages"),
                  role: "items",
                  columns: { desktop: 4, tablet: 2, mobile: 1 },
                  style: { gap: 20 },
                  tablet: { gap: 24 },
                  mobile: { gap: 22 },
                },
              ),
              t.divider({ style: { marginTop: 28, marginBottom: 16 } }),
              arrowLink(
                t,
                L(
                  "عامل حساب؟ شوف حالة طلبك",
                  "Signed in? See your order's status",
                ),
                ORDERS_HREF,
              ),
            ],
            {
              label: L("البطاقة", "Card"),
              style: TRACK_CARD,
              mobile: TRACK_CARD_MOBILE,
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
