/** Default questions for the FAQ designs, grouped; the seller edits them. */
import { L } from "../_kit";

export const FAQ_GROUPS = [
  {
    name: L("الطلبات", "Orders"),
    items: [
      {
        title: L("كيف أعرف أن طلبي وصل إليكم؟", "How do I know my order went through?"),
        body: L(
          "ستظهر لك صفحة تأكيد بعد إتمام الطلب.",
          "You see a confirmation page once the order is placed.",
        ),
      },
      {
        title: L("هل يمكنني تعديل طلبي أو إلغاؤه؟", "Can I change or cancel my order?"),
        body: L("تواصل معنا في أقرب وقت لنراجع طلبك.", "Contact us as soon as you can so we can check your order."),
      },
    ],
  },
  {
    name: L("التوصيل", "Delivery"),
    items: [
      {
        title: L("كم يستغرق التوصيل؟", "How long does delivery take?"),
        body: L("تظهر تكلفة الشحن ومدته عند إتمام الطلب.", "Shipping cost and time are shown at checkout."),
      },
      {
        title: L("إلى أين يتوفر التوصيل؟", "Where do you deliver?"),
        body: L("تظهر مناطق التوصيل المتاحة عند إتمام الطلب.", "Delivery areas are shown at checkout."),
      },
    ],
  },
  {
    name: L("الدفع والاسترجاع", "Payment & returns"),
    items: [
      {
        title: L("ما طرق الدفع المتاحة؟", "Which payment methods do you accept?"),
        body: L("تظهر طرق الدفع المتاحة عند إتمام الطلب.", "Available payment methods are shown at checkout."),
      },
      {
        title: L("ما سياسة الاسترجاع؟", "What is your return policy?"),
        body: L("راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "See the exchange and return policy page."),
      },
    ],
  },
];

export const FAQ_ITEMS = FAQ_GROUPS.flatMap((g) => g.items);
