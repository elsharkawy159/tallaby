/**
 * The few fixed strings sections print themselves (everything else is seller
 * content in props). Arabic first; the brand name is طلبي.
 */
import type { SiteLocale } from "../config/schema";
import type { Localized } from "./types";

export const SECTION_COPY = {
  viewAll: { ar: "عرض الكل", en: "View all" },
  noProducts: { ar: "لا توجد منتجات هنا بعد.", en: "No products here yet." },
  noCategories: { ar: "لا توجد أقسام بعد.", en: "No categories yet." },
  outOfStock: { ar: "نفدت الكمية", en: "Out of stock" },
  menu: { ar: "القائمة", en: "Menu" },
  home: { ar: "الرئيسية", en: "Home" },
  contactUs: { ar: "تواصل معنا", en: "Contact us" },
  phone: { ar: "الهاتف", en: "Phone" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  whatsapp: { ar: "واتساب", en: "WhatsApp" },
  address: { ar: "العنوان", en: "Address" },
  policies: { ar: "السياسات", en: "Policies" },
  followUs: { ar: "تابعنا", en: "Follow us" },
  policyReturn: { ar: "سياسة الاسترجاع", en: "Return policy" },
  policyShipping: { ar: "سياسة الشحن", en: "Shipping policy" },
  policyPrivacy: { ar: "سياسة الخصوصية", en: "Privacy policy" },
  policyTerms: { ar: "الشروط والأحكام", en: "Terms and conditions" },
  copyright: { ar: "© {year} {store}. جميع الحقوق محفوظة.", en: "© {year} {store}. All rights reserved." },
  pickProduct: { ar: "اختر منتجًا لعرضه هنا.", en: "Choose a product to show here." },
  pickForm: { ar: "اختر نموذجًا لعرضه هنا.", en: "Choose a form to show here." },
  emptyCustom: { ar: "قسم فارغ. أضف عناصر من لوحة الإضافة.", en: "Empty section. Add elements from the Add panel." },
  formSubmit: { ar: "إرسال", en: "Send" },
  formSuccess: { ar: "شكرًا لك! وصلتنا رسالتك وسنتواصل معك قريبًا.", en: "Thank you! We received your message and will get back to you soon." },
  formSelect: { ar: "اختر…", en: "Choose…" },
  noPosts: { ar: "لا توجد مقالات منشورة بعد.", en: "No posts published yet." },
  noItems: { ar: "لا يوجد محتوى منشور هنا بعد.", en: "Nothing published here yet." },
  pickCollection: { ar: "اكتب عنوان المجموعة لعرض محتواها هنا.", en: "Enter a collection address to show its content here." },
  readMore: { ar: "اقرأ المزيد", en: "Read more" },
  allPosts: { ar: "كل المقالات", en: "All posts" },
  minutesRead: { ar: "{n} دقائق قراءة", en: "{n} min read" },
} as const satisfies Record<string, Localized>;

export type SectionCopyKey = keyof typeof SECTION_COPY;

export function sectionText(key: SectionCopyKey, locale: SiteLocale, values?: Record<string, string | number>): string {
  let text: string = SECTION_COPY[key][locale] ?? SECTION_COPY[key].ar;
  for (const [name, value] of Object.entries(values ?? {})) text = text.replace(`{${name}}`, String(value));
  return text;
}

export function localized(value: Localized, locale: SiteLocale): string {
  return value[locale] ?? value.ar;
}
