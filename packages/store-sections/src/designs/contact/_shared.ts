/** Default contact channels for the contact designs; the seller types their own details. */
import type { ElementIconName } from "../../elements/registry";
import { L } from "../_kit";

export type Channel = { icon: ElementIconName; label: ReturnType<typeof L>; value: ReturnType<typeof L>; note: ReturnType<typeof L>; href: string };

export const CHANNELS: Channel[] = [
  {
    icon: "chat",
    label: L("واتساب", "WhatsApp"),
    value: L("٠١٠٠ ١٢٣ ٤٥٦٧", "+20 100 123 4567"),
    note: L("أسرع رد", "Fastest reply"),
    href: "https://wa.me/201001234567",
  },
  {
    icon: "phone",
    label: L("اتصل بنا", "Call us"),
    value: L("٠١٠٠ ١٢٣ ٤٥٦٧", "+20 100 123 4567"),
    note: L("السبت إلى الخميس، ١٠ ص – ١٠ م", "Sat–Thu, 10am–10pm"),
    href: "tel:+201001234567",
  },
  {
    icon: "mail",
    label: L("البريد", "Email"),
    value: L("‏hello@store.com", "hello@store.com"),
    note: L("نرد خلال يوم", "Reply within a day"),
    href: "mailto:hello@store.com",
  },
  {
    icon: "map-pin",
    label: L("العنوان", "Address"),
    value: L("٢٤ شارع التحرير، الدقي", "24 Tahrir St, Dokki"),
    note: L("الجيزة", "Giza"),
    href: "https://maps.google.com/",
  },
];
