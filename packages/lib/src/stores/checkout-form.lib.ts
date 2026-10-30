import { normalizeLeadPhone } from "../checkout-leads/checkout-leads.lib";

/**
 * Checkout form & thank-you page settings (ROADMAP.md F-25). Pure, safe on
 * the client.
 *
 * Stored in `stores.settings.checkoutForm` and `stores.settings.thankYou`
 * (other keys kept); no migration. Only store websites read them; the
 * marketplace checkout never does.
 *
 * The delivery address (name, phone, governorate, area, street) is the
 * customer's saved address and always stays required; these settings only
 * cover the extra fields on the checkout page itself. With nothing saved the
 * checkout is exactly as before: the order notes box, optional, and nothing
 * else.
 */

/** Extra checkout fields, in their default order. */
export const CHECKOUT_FIELDS = ["email", "secondPhone", "customQuestion", "notes"] as const;
export type CheckoutFieldKey = (typeof CHECKOUT_FIELDS)[number];

export const CHECKOUT_FIELD_MODES = ["hidden", "optional", "required"] as const;
export type CheckoutFieldMode = (typeof CHECKOUT_FIELD_MODES)[number];

/** The seller's own question (label) and the customer's answer, in characters. */
export const CHECKOUT_QUESTION_MAX = 80;
export const CHECKOUT_ANSWER_MAX = 300;
export const CHECKOUT_EMAIL_MAX = 254;
/** The customer's own order note when the store saved a checkout form, in characters. */
export const CHECKOUT_NOTES_MAX = 1000;
/** Thank-you page message, in characters (plain text, no HTML). */
export const THANK_YOU_MESSAGE_MAX = 500;

export type StoreCheckoutForm = {
  fields: Record<CheckoutFieldKey, CheckoutFieldMode>;
  /** Every field once, in the order the checkout shows them. */
  order: CheckoutFieldKey[];
  /** The custom question's label; an empty label hides the question. */
  question: string;
};

export const CHECKOUT_FORM_DEFAULTS: StoreCheckoutForm = {
  fields: { email: "hidden", secondPhone: "hidden", customQuestion: "hidden", notes: "optional" },
  order: [...CHECKOUT_FIELDS],
  question: "",
};

export type StoreThankYou = {
  /** Shown under "Order placed"; empty shows nothing. */
  message: string;
  /** "Confirm on WhatsApp" with the order number, to the store's WhatsApp. */
  whatsappButton: boolean;
  /** A few of the store's own products. */
  suggestedProducts: boolean;
};

export const THANK_YOU_DEFAULTS: StoreThankYou = { message: "", whatsappButton: false, suggestedProducts: false };

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Plain text: no control characters (newlines kept when asked), trimmed, capped. */
export function cleanPlainText(value: unknown, max: number, { multiline = false } = {}): string {
  if (typeof value !== "string") return "";
  let text = value.replace(/\r\n?/g, "\n").replace(CONTROL_CHARS, "");
  text = multiline ? text.replace(/\n{3,}/g, "\n\n") : text.replace(/\s*\n\s*/g, " ");
  return text.trim().slice(0, max).trim();
}

function isMode(value: unknown): value is CheckoutFieldMode {
  return typeof value === "string" && (CHECKOUT_FIELD_MODES as readonly string[]).includes(value);
}

function cleanOrder(value: unknown): CheckoutFieldKey[] {
  const picked = Array.isArray(value)
    ? value.filter((key, index): key is CheckoutFieldKey =>
        (CHECKOUT_FIELDS as readonly unknown[]).includes(key) && value.indexOf(key) === index,
      )
    : [];
  // Missing fields go to the end in their default order.
  return [...picked, ...CHECKOUT_FIELDS.filter((key) => !picked.includes(key))];
}

/** The store's checkout form from `stores.settings`, every field re-validated. */
export function parseStoreCheckoutForm(settings: unknown): StoreCheckoutForm {
  const raw = (settings as { checkoutForm?: unknown } | null | undefined)?.checkoutForm;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...CHECKOUT_FORM_DEFAULTS, fields: { ...CHECKOUT_FORM_DEFAULTS.fields }, order: [...CHECKOUT_FORM_DEFAULTS.order] };
  }
  const value = raw as { fields?: unknown; order?: unknown; question?: unknown };
  const rawFields = (value.fields && typeof value.fields === "object" ? value.fields : {}) as Record<string, unknown>;
  const fields = { ...CHECKOUT_FORM_DEFAULTS.fields };
  for (const key of CHECKOUT_FIELDS) {
    const mode = rawFields[key];
    if (isMode(mode)) fields[key] = mode;
  }
  const question = cleanPlainText(value.question, CHECKOUT_QUESTION_MAX);
  // A question with no label cannot be asked.
  if (!question) fields.customQuestion = "hidden";
  return { fields, order: cleanOrder(value.order), question };
}

/** A save from the dashboard, cleaned the same way (never trusted as sent). */
export function normalizeCheckoutFormInput(input: unknown): StoreCheckoutForm {
  return parseStoreCheckoutForm({ checkoutForm: input });
}

/** The store's thank-you page settings from `stores.settings`, re-validated. */
export function parseStoreThankYou(settings: unknown): StoreThankYou {
  const raw = (settings as { thankYou?: unknown } | null | undefined)?.thankYou;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...THANK_YOU_DEFAULTS };
  const value = raw as { message?: unknown; whatsappButton?: unknown; suggestedProducts?: unknown };
  return {
    message: cleanPlainText(value.message, THANK_YOU_MESSAGE_MAX, { multiline: true }),
    whatsappButton: value.whatsappButton === true,
    suggestedProducts: value.suggestedProducts === true,
  };
}

export function normalizeThankYouInput(input: unknown): StoreThankYou {
  return parseStoreThankYou({ thankYou: input });
}

/** Nothing on the thank-you page changes. */
export function isDefaultThankYou(value: StoreThankYou): boolean {
  return !value.message && !value.whatsappButton && !value.suggestedProducts;
}

/** The checkout looks exactly as it does without settings (only the optional notes box). */
export function isDefaultCheckoutForm(form: StoreCheckoutForm): boolean {
  return CHECKOUT_FIELDS.every((key) => form.fields[key] === CHECKOUT_FORM_DEFAULTS.fields[key]);
}

/** The fields the checkout shows, in the seller's order, each with whether it is required. */
export function visibleCheckoutFields(form: StoreCheckoutForm): { key: CheckoutFieldKey; required: boolean }[] {
  return form.order
    .filter((key) => form.fields[key] !== "hidden")
    .map((key) => ({ key, required: form.fields[key] === "required" }));
}

/** What the customer typed in the extra fields (any may be missing). */
export type CheckoutAnswersInput = {
  email?: unknown;
  secondPhone?: unknown;
  customAnswer?: unknown;
  notes?: unknown;
};

export type CheckoutAnswersError =
  | "emailRequired"
  | "emailInvalid"
  | "secondPhoneRequired"
  | "secondPhoneInvalid"
  | "customAnswerRequired"
  | "notesRequired";

export type CheckoutAnswersResult =
  | { ok: true; notes: string | undefined }
  | { ok: false; field: CheckoutFieldKey; error: CheckoutAnswersError };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Labels in the seller's order notes: both languages, the seller may use either. */
const NOTE_LABELS = {
  email: "البريد الإلكتروني / Email",
  secondPhone: "رقم تليفون آخر / Second phone",
} as const;

/**
 * Checks the extra fields against the store's form (server side at checkout,
 * and in the browser for instant errors) and builds the order notes.
 *
 * Hidden fields are ignored whatever was sent; required ones must be filled;
 * the email and second phone must be valid; the answer is capped. The extra
 * answers are written into the order notes (one labelled line each, in the
 * form's order, then the customer's own note), which the seller already sees
 * on the order, its print-out and the export. With the default form the notes
 * pass through exactly as sent.
 */
export function applyCheckoutAnswers(form: StoreCheckoutForm, input: CheckoutAnswersInput): CheckoutAnswersResult {
  if (isDefaultCheckoutForm(form)) {
    return { ok: true, notes: typeof input.notes === "string" ? input.notes : undefined };
  }

  const lines: string[] = [];
  let customerNote = "";
  for (const { key, required } of visibleCheckoutFields(form)) {
    if (key === "email") {
      const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
      if (!email) {
        if (required) return { ok: false, field: key, error: "emailRequired" };
        continue;
      }
      if (email.length > CHECKOUT_EMAIL_MAX || !EMAIL_RE.test(email)) return { ok: false, field: key, error: "emailInvalid" };
      lines.push(`${NOTE_LABELS.email}: ${email}`);
    } else if (key === "secondPhone") {
      const raw = typeof input.secondPhone === "string" ? input.secondPhone.trim() : "";
      if (!raw) {
        if (required) return { ok: false, field: key, error: "secondPhoneRequired" };
        continue;
      }
      const phone = normalizeLeadPhone(raw);
      if (!phone) return { ok: false, field: key, error: "secondPhoneInvalid" };
      lines.push(`${NOTE_LABELS.secondPhone}: ${phone}`);
    } else if (key === "customQuestion") {
      const answer = cleanPlainText(input.customAnswer, CHECKOUT_ANSWER_MAX);
      if (!answer) {
        if (required) return { ok: false, field: key, error: "customAnswerRequired" };
        continue;
      }
      lines.push(`${form.question}: ${answer}`);
    } else {
      const note = cleanPlainText(input.notes, CHECKOUT_NOTES_MAX, { multiline: true });
      if (!note && required) return { ok: false, field: key, error: "notesRequired" };
      customerNote = note;
    }
  }

  const notes = [lines.join("\n"), customerNote].filter(Boolean).join("\n\n");
  return { ok: true, notes: notes || undefined };
}

/** Customer → store WhatsApp message on the thank-you page. */
export const THANK_YOU_WHATSAPP_DEFAULTS = {
  ar: "أهلًا {store}، عملت طلب رقم #{number} وعايز أأكده.",
  en: "Hi {store}, I placed order #{number} and would like to confirm it.",
} as const;

/** wa.me link with the order number, or null when the store has no Egyptian mobile for WhatsApp. */
export function thankYouWhatsAppUrl(input: {
  storePhone: string | null | undefined;
  storeName: string;
  orderNumber: string;
  locale: string;
}): string | null {
  const phone = normalizeLeadPhone(input.storePhone);
  if (!phone) return null;
  const template = THANK_YOU_WHATSAPP_DEFAULTS[input.locale === "en" ? "en" : "ar"];
  // A function replacer: names may contain "$".
  const message = template.replace(/\{(store|number)\}/g, (_match, key: string) =>
    key === "store" ? input.storeName : input.orderNumber,
  );
  return `https://wa.me/20${phone.slice(1)}?text=${encodeURIComponent(message)}`;
}
