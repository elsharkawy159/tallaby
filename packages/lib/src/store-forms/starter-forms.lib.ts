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
      success: "شكرًا! وصلتنا رسالتك وسنرد عليك قريبًا.",
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
      description: "اجمع بريد العملاء لترسل لهم الجديد والعروض.",
      submit: "اشترك",
      success: "تم اشتراكك. انتظر عرضنا القادم على بريدك.",
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

type LocalizableForm = { fields: readonly { label: string; placeholder?: string; helpText?: string }[]; submitLabel: string; successMessage: string };

/** Every starter text of one language → the same text in the other (`STARTER_FORM_COPY`). */
const STARTER_SWAPS: Record<"ar" | "en", Map<string, string>> = (() => {
  const swaps = { ar: new Map<string, string>(), en: new Map<string, string>() };
  const flat = (copy: Copy): [string, string][] =>
    Object.entries(copy).flatMap(([key, value]): [string, string][] =>
      typeof value === "string" ? [[key, value]] : Object.entries(value).map(([sub, text]): [string, string] => [`${key}.${sub}`, text]),
    );
  for (const kind of Object.values(STARTER_FORM_COPY)) {
    const en = new Map(flat(kind.en));
    for (const [key, ar] of flat(kind.ar)) {
      const english = en.get(key);
      if (!english) continue;
      swaps.en.set(ar, english);
      swaps.ar.set(english, ar);
    }
  }
  return swaps;
})();

/**
 * A store form as a storefront shows it in `locale`: text that is still the
 * starter copy of the other language (the newsletter and contact forms a
 * store's starting site created in its language then) reads in `locale`.
 * Forms hold one language, so without this an English page showed the Arabic
 * labels of a store created in Arabic. Text the seller wrote is kept. Returns
 * the same object when nothing changes.
 */
export function localizeStarterForm<F extends LocalizableForm>(form: F, locale: string): F {
  const swaps = STARTER_SWAPS[locale === "en" ? "en" : "ar"];
  const swap = (text: string | undefined) => (text ? (swaps.get(text.trim()) ?? text) : text);
  let changed = false;
  const fields = form.fields.map((field) => {
    const next = { ...field, label: swap(field.label)!, ...(field.placeholder && { placeholder: swap(field.placeholder) }), ...(field.helpText && { helpText: swap(field.helpText) }) };
    if (next.label !== field.label || next.placeholder !== field.placeholder || next.helpText !== field.helpText) changed = true;
    return next;
  });
  const submitLabel = swap(form.submitLabel) ?? form.submitLabel;
  const successMessage = swap(form.successMessage) ?? form.successMessage;
  if (!changed && submitLabel === form.submitLabel && successMessage === form.successMessage) return form;
  return { ...form, fields, submitLabel, successMessage };
}

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
