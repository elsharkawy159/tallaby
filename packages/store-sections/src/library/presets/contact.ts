import type { SectionPreset } from "../types";

export const CONTACT_PRESETS: readonly SectionPreset[] = [
  {
    id: "contact.form",
    sectionId: "contact-form",
    category: "contact",
    subcategory: "form",
    name: { ar: "نموذج تواصل", en: "Contact form" },
    description: { ar: "نموذج من نماذج متجرك؛ تصلك الرسائل في صندوق الوارد.", en: "One of your store's forms; messages reach your inbox." },
    keywords: ["form", "message", "نموذج", "رسالة"],
    capabilities: ["interactive", "dynamic"],
    dataNeeds: ["forms"],
  },
  {
    id: "contact.info",
    sectionId: "contact-info",
    category: "contact",
    subcategory: "info",
    name: { ar: "بيانات التواصل", en: "Contact details" },
    description: { ar: "الهاتف والبريد وواتساب من إعدادات متجرك.", en: "Phone, email and WhatsApp from your store settings." },
    keywords: ["phone", "email", "whatsapp", "هاتف", "واتساب"],
    capabilities: ["dynamic"],
    dataNeeds: ["storeInfo"],
  },
];
