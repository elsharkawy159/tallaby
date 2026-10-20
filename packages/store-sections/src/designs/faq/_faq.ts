/** Default questions for the FAQ designs, grouped; the seller edits them. */
import { L } from "../_kit";

export const FAQ_GROUPS = [
  {
    name: L("الطلبات", "Orders"),
    items: [
      {
        title: L("كيف أعرف أن طلبي وصل إليكم؟", "How do I know my order went through?"),
        body: L(
          "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.",
          "You see a confirmation page and get a message; we also call to confirm cash orders.",
        ),
      },
      {
        title: L("هل يمكنني تعديل طلبي أو إلغاؤه؟", "Can I change or cancel my order?"),
        body: L("نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.", "Yes, until it ships. Message us as soon as you can."),
      },
    ],
  },
  {
    name: L("التوصيل", "Delivery"),
    items: [
      {
        title: L("كم يستغرق التوصيل؟", "How long does delivery take?"),
        body: L("القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.", "Cairo and Giza in 1 to 2 days, other governorates in 2 to 6 days."),
      },
      {
        title: L("هل التوصيل متاح لكل المحافظات؟", "Do you deliver everywhere?"),
        body: L("نعم، نوصل لكل محافظات مصر.", "Yes, we deliver to every governorate in Egypt."),
      },
    ],
  },
  {
    name: L("الدفع والاسترجاع", "Payment & returns"),
    items: [
      {
        title: L("ما طرق الدفع المتاحة؟", "Which payment methods do you accept?"),
        body: L("الدفع عند الاستلام، والبطاقات، والمحافظ الإلكترونية، وإنستاباي.", "Cash on delivery, cards, mobile wallets and InstaPay."),
      },
      {
        title: L("ما سياسة الاسترجاع؟", "What is your return policy?"),
        body: L("يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.", "Return any unused item within 14 days in its original box."),
      },
    ],
  },
];

export const FAQ_ITEMS = FAQ_GROUPS.flatMap((g) => g.items);
