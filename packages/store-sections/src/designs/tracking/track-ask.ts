/**
 * Where is my order (library D-a, reworked): a narrow centred panel with a
 * sun icon disc, the title and one line of help, then two ways to find an
 * order: the customer's orders page (signed-in shoppers see the real status
 * there) and a WhatsApp chat for guest orders. The design's order-number
 * lookup form is not drawn: a store form only reaches the seller's inbox, it
 * cannot look an order up, so a lookup form would promise something false.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { pillButton } from "../_modular";
import { ORDERS_HREF, WA, discStyle } from "./_shared";

export const trackAsk = defineDesign({
  id: "track-ask",
  version: 1,
  category: "tracking",
  subcategory: "help",
  name: L("فين طلبي؟", "Where is my order?"),
  description: L(
    "لوحة في النص: صفحة طلباتي للي عامل حساب، وواتساب للي طلب من غير حساب.",
    "A centred panel: the orders page for signed-in shoppers, WhatsApp for guest orders.",
  ),
  keywords: [
    "tracking",
    "order",
    "where is my order",
    "whatsapp",
    "تتبع",
    "طلب",
    "فين طلبي",
  ],
  tree: (t) =>
    t.section({ label: L("فين طلبي؟", "Where is my order?") }, [
      t.container(
        [
          t.stack(
            [
              t.box(
                [
                  t.icon("truck", {
                    style: { fontSize: "3xl", color: "foreground" },
                  }),
                ],
                {
                  label: L("أيقونة", "Icon"),
                  style: discStyle(64),
                },
              ),
              t.heading(L("فين طلبي؟", "Where is my order?"), "h2", {
                role: "title",
                style: {
                  fontSize: "display-sm",
                  letterSpacing: "tight",
                  textAlign: "center",
                },
              }),
              t.paragraph(
                L(
                  "لو عامل حساب، حالة طلبك موجودة في صفحة طلباتي. لو طلبت من غير حساب، ابعتلنا رقم الطلب على واتساب.",
                  "Signed in? Your order's status is on your orders page. Ordered as a guest? Send us your order number on WhatsApp.",
                ),
                {
                  role: "subtitle",
                  style: { textAlign: "center", marginBottom: 8 },
                },
              ),
              t.stack(
                [
                  pillButton(t, L("شوف طلباتي", "See my orders"), ORDERS_HREF, {
                    icon: "package",
                    style: { width: "100%", paddingTop: 15, paddingBottom: 15 },
                  }),
                  pillButton(
                    t,
                    L(
                      "اسأل عن طلبي على واتساب",
                      "Ask about my order on WhatsApp",
                    ),
                    `${WA}?text=Where%20is%20my%20order%3F`,
                    {
                      icon: "chat",
                      tone: "outline",
                      style: {
                        width: "100%",
                        paddingTop: 13,
                        paddingBottom: 13,
                      },
                    },
                  ),
                ],
                {
                  label: L("الأزرار", "Buttons"),
                  role: "actions",
                  style: { gap: 10, width: "100%" },
                },
              ),
              t.text(
                L(
                  "رقم الطلب موجود في رسالة تأكيد الطلب.",
                  "Your order number is in the order confirmation message.",
                ),
                {
                  style: {
                    fontSize: "sm",
                    color: "muted",
                    textAlign: "center",
                  },
                },
              ),
            ],
            {
              label: L("اللوحة", "Panel"),
              style: {
                gap: 16,
                alignItems: "center",
                background: "secondary",
                radius: 24,
                paddingTop: 40,
                paddingBottom: 40,
                paddingStart: 40,
                paddingEnd: 40,
              },
              mobile: {
                paddingTop: 24,
                paddingBottom: 24,
                paddingStart: 20,
                paddingEnd: 20,
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "560px" } },
      ),
    ]),
});
