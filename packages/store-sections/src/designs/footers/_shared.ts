/** Footer pieces: link columns, social circles, payment chips and the copyright line. */
import type { ElementIconName } from "../../elements/registry";
import type { NodeTemplate } from "../../elements/tree";
import type { DesignText, TreeBuilder } from "../builder";
import { L } from "../_kit";

export const SHOP_LINKS = [
  { text: L("كل المنتجات", "All products"), href: "/products" },
  { text: L("وصل حديثًا", "New in"), href: "/products" },
  { text: L("الأكثر مبيعًا", "Best sellers"), href: "/products" },
  { text: L("العروض", "Offers"), href: "/products" },
];

export const HELP_LINKS = [
  { text: L("الشحن والتوصيل", "Shipping & delivery"), href: "/shipping" },
  { text: L("الاسترجاع والاستبدال", "Returns & refunds"), href: "/returns" },
  { text: L("الأسئلة الشائعة", "FAQs"), href: "/faq" },
  { text: L("من نحن", "About us"), href: "/about" },
];

const SOCIAL: { icon: ElementIconName; href: string; label: DesignText }[] = [
  { icon: "facebook", href: "https://www.facebook.com/", label: L("فيسبوك", "Facebook") },
  { icon: "instagram", href: "https://www.instagram.com/", label: L("إنستجرام", "Instagram") },
  { icon: "youtube", href: "https://www.youtube.com/", label: L("يوتيوب", "YouTube") },
  { icon: "chat", href: "https://wa.me/", label: L("واتساب", "WhatsApp") },
];

const PAYMENTS = [L("فيزا", "VISA"), L("ماستركارد", "Mastercard"), L("ميزة", "Meeza"), L("إنستاباي", "InstaPay"), L("الدفع عند الاستلام", "Cash on delivery")];

/** A titled column of links. `color` is the link colour on the footer background. */
export function linkColumn(t: TreeBuilder, title: DesignText, links: { text: DesignText; href: string }[], color: string): NodeTemplate {
  return t.stack(
    [
      t.heading(title, "h4", { style: { fontSize: "md", marginBottom: 6 } }),
      ...links.map((l) =>
        t.link(l.href, [t.text(l.text, { style: { color, opacity: 80 } })], {
          label: L("رابط", "Link"),
          style: { paddingTop: 4, paddingBottom: 4, paddingStart: 0, paddingEnd: 0, hover: { opacity: 70 } },
        }),
      ),
    ],
    { label: L("عمود روابط", "Link column"), style: { gap: 4 } },
  );
}

/** Outlined social circles. */
export function socialRow(t: TreeBuilder, color: string, size = 40): NodeTemplate {
  return t.row(
    SOCIAL.map((s) =>
      t.link(s.href, [t.icon(s.icon, { style: { fontSize: "md", color } })], {
        label: s.label,
        style: {
          width: `${size}px`,
          paddingTop: Math.round(size * 0.28),
          paddingBottom: Math.round(size * 0.22),
          paddingStart: 0,
          paddingEnd: 0,
          radius: 999,
          borderWidth: 1,
          borderColor: color,
          textAlign: "center",
          hover: { opacity: 70 },
        },
      }),
    ),
    { label: L("التواصل الاجتماعي", "Social links"), role: "social", style: { gap: 8 } },
  );
}

/** Payment method chips. */
export function paymentRow(t: TreeBuilder, onDark: boolean): NodeTemplate {
  return t.row(
    PAYMENTS.map((p) =>
      t.badge(p, {
        style: onDark ? { background: "transparent", borderWidth: 1, borderColor: "primaryInk", color: "primaryInk" } : { background: "secondary" },
      }),
    ),
    { label: L("طرق الدفع", "Payment methods"), role: "payments", style: { gap: 6 } },
  );
}

export const COPYRIGHT = L("© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.", "© 2026 Your store. All rights reserved.");
