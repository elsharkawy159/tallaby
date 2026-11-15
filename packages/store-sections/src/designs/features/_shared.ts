/** Default service promises shared by the feature designs. */
import type { ElementIconName } from "../../elements/registry";
import { L } from "../_kit";

export const PROMISES: { icon: ElementIconName; title: ReturnType<typeof L>; text: ReturnType<typeof L> }[] = [
  { icon: "truck", title: L("الشحن", "Shipping"), text: L("تظهر تكلفة الشحن ومدته عند إتمام الطلب", "Cost and time shown at checkout") },
  { icon: "credit-card", title: L("الدفع عند الاستلام", "Cash on delivery"), text: L("أو بطرق الدفع المتاحة عند الطلب", "Or other methods shown at checkout") },
  { icon: "rotate", title: L("الاستبدال والاسترجاع", "Exchanges and returns"), text: L("التفاصيل في صفحة السياسات", "Details on the policy page") },
  { icon: "chat", title: L("تواصل معنا", "Contact us"), text: L("لأي سؤال عن طلب أو منتج", "With any question about an order or a product") },
];
