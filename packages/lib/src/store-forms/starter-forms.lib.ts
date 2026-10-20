/**
 * The ready-made forms a new store's starting site needs (the default
 * template's newsletter and contact forms), in both store languages. Store
 * creation runs outside the dashboard's translations, so the copy lives here;
 * it is the same text as `storeForms.templates.{contact,newsletter}` in the
 * dashboard messages (a test keeps them equal). No React here.
 */
import { buildTemplateForm, getFormTemplate } from "./form-templates.lib";
import { formInputSchema, type FormDefinitionData, type FormInput } from "./store-forms.lib";

type Copy = Record<string, string | Record<string, string>>;

export const STARTER_FORM_COPY: Record<"contact" | "newsletter", Record<"ar" | "en", Copy>> = {
  contact: {
    ar: {
      name: "نموذج تواصل",
      description: "الاسم والهاتف والبريد ورسالة. نموذج «تواصل معنا» المعتاد.",
      submit: "إرسال الرسالة",
      success: "شكرًا! وصلتنا رسالتك وهنرد عليك قريب.",
      fields: { name: "الاسم", phone: "رقم الهاتف", email: "البريد الإلكتروني", message: "رسالتك" },
    },
    en: {
      name: "Contact form",
      description: 'Name, phone, email and a message. The everyday "Contact us" form.',
      submit: "Send message",
      success: "Thanks! We got your message and will reply soon.",
      fields: { name: "Your name", phone: "Phone number", email: "Email", message: "Your message" },
    },
  },
  newsletter: {
    ar: {
      name: "اشتراك في النشرة",
      description: "اجمع بريد العملاء علشان تبعتلهم الجديد والعروض.",
      submit: "اشترك",
      success: "اشتراكك تم. استنى عرضنا الجاي على بريدك.",
      fields: { email: "البريد الإلكتروني", name: "الاسم الأول", consent: "أوافق على استلام رسائل بالعروض والمنتجات الجديدة" },
    },
    en: {
      name: "Newsletter sign-up",
      description: "Collect emails for new arrivals and offers.",
      submit: "Subscribe",
      success: "You're on the list. Watch your inbox for our next offer.",
      fields: { email: "Email", name: "First name", consent: "I agree to receive emails about offers and new arrivals" },
    },
  },
};

/**
 * A starter form as a storefront draws it, for template previews (the
 * tallaby.com gallery): the same fields and copy a store gets on "Use
 * template", under a made-up id. Never stored and never submitted.
 */
export function starterPreviewForm(kind: string, locale: "ar" | "en", id: string): PreviewForm | undefined {
  const input = starterFormInput(kind, locale);
  const parsed = input ? formInputSchema.safeParse(input) : undefined;
  if (!parsed?.success) return undefined;
  return { id, fields: parsed.data.fields, submitLabel: parsed.data.settings.submitLabel, successMessage: parsed.data.settings.successMessage };
}

export type PreviewForm = { id: string; fields: FormDefinitionData["fields"]; submitLabel: string; successMessage: string };

/** A starter form in the store's language, or undefined for a kind the starting site does not use. */
export function starterFormInput(kind: string, locale: "ar" | "en"): FormInput | undefined {
  const copy = STARTER_FORM_COPY[kind as keyof typeof STARTER_FORM_COPY]?.[locale];
  const template = getFormTemplate(kind);
  if (!copy || !template) return undefined;
  const text = (key: string) => {
    const [head, tail] = key.split(".") as [string, string | undefined];
    const value = copy[head];
    return (tail ? (value as Record<string, string> | undefined)?.[tail] : (value as string | undefined)) ?? "";
  };
  return buildTemplateForm(template, text);
}
