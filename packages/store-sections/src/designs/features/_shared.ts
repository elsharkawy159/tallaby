/** Default service promises shared by the feature designs. */
import type { ElementIconName } from "../../elements/registry";
import { L } from "../_kit";

export const PROMISES: { icon: ElementIconName; title: ReturnType<typeof L>; text: ReturnType<typeof L> }[] = [
  { icon: "truck", title: L("توصيل سريع", "Fast delivery"), text: L("من يوم إلى ٤ أيام لكل المحافظات", "1 to 4 days to every governorate") },
  { icon: "credit-card", title: L("الدفع عند الاستلام", "Cash on delivery"), text: L("أو ادفع بالبطاقة والمحفظة", "Or pay by card and wallet") },
  { icon: "rotate", title: L("استرجاع سهل", "Easy returns"), text: L("١٤ يومًا لتغيّر رأيك", "14 days to change your mind") },
  { icon: "chat", title: L("دعم على واتساب", "WhatsApp support"), text: L("أشخاص حقيقيون طوال الأسبوع", "Real people, 7 days a week") },
];
