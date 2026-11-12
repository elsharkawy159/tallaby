/**
 * "Customer requirements" (مطلوب من العميل, ROADMAP.md F-91): what a seller asks
 * the customer for on a product (a name to print, a photo, a choice), stored on
 * `products.customer_fields` (0167). Pure and client-safe: the dashboard editor,
 * the storefront form, add-to-cart and placing the order all use these rules,
 * so what the customer sees is what the server checks and charges.
 *
 * Money: a field may add a fixed amount to the line's UNIT price when it is
 * filled (a choice list: the chosen option's amount). Worked out here in integer
 * piastres from the product's CURRENT definitions, never from a client price.
 * The extras are part of the unit price on the cart line and the order item, so
 * percent offers, discount rules and coupons treat them like the base price.
 */
import { z } from "zod";

export const CUSTOMER_FIELD_TYPES = ["text", "image", "choice"] as const;
export type CustomerFieldType = (typeof CUSTOMER_FIELD_TYPES)[number];

export const CUSTOMER_FIELDS_MAX = 10;
export const CUSTOMER_FIELD_LABEL_MAX = 80;
export const CUSTOMER_FIELD_HELP_MAX = 200;
export const CUSTOMER_FIELD_OPTION_LABEL_MAX = 60;
/** Highest extra per field or option, in the store's currency. */
export const CUSTOMER_FIELD_EXTRA_MAX = 100_000;
export const TEXT_MAX_LENGTH_DEFAULT = 500;
export const TEXT_MAX_LENGTH_LIMIT = 2000;
export const IMAGE_MAX_FILES_DEFAULT = 1;
export const IMAGE_MAX_FILES_LIMIT = 5;
export const CHOICE_OPTIONS_MIN = 2;
export const CHOICE_OPTIONS_MAX = 20;
/** Customer photos (private `order-customer-uploads` bucket, 0167). */
export const CUSTOMER_UPLOAD_BUCKET = "order-customer-uploads";
export const CUSTOMER_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const CUSTOMER_UPLOAD_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
export type CustomerUploadMime = keyof typeof CUSTOMER_UPLOAD_TYPES;
/** Uploads never attached to an order are deleted after this many days (cron). */
export const CUSTOMER_UPLOAD_KEEP_DAYS = 7;

const ID_RE = /^[a-z0-9_-]{1,24}$/i;
const id = z.string().regex(ID_RE);

const requiredLabel = (max: number) =>
  z.object({
    ar: z.string().trim().min(1).max(max),
    en: z.string().trim().min(1).max(max),
  });
const optionalHelp = z
  .object({
    ar: z.string().trim().max(CUSTOMER_FIELD_HELP_MAX).default(""),
    en: z.string().trim().max(CUSTOMER_FIELD_HELP_MAX).default(""),
  })
  .optional();

/** An amount in the store's currency, ≥ 0 with at most 2 decimals; null = free. */
const extraPrice = z
  .number()
  .min(0)
  .max(CUSTOMER_FIELD_EXTRA_MAX)
  .refine((value) => Math.abs(Math.round(value * 100) - value * 100) < 1e-6, { message: "twoDecimals" })
  .nullable()
  .default(null);

const base = {
  id,
  label: requiredLabel(CUSTOMER_FIELD_LABEL_MAX),
  help: optionalHelp,
  required: z.boolean().default(false),
};

const textFieldSchema = z.object({
  ...base,
  type: z.literal("text"),
  extraPrice,
  maxLength: z.number().int().min(1).max(TEXT_MAX_LENGTH_LIMIT).default(TEXT_MAX_LENGTH_DEFAULT),
});
const imageFieldSchema = z.object({
  ...base,
  type: z.literal("image"),
  extraPrice,
  maxFiles: z.number().int().min(1).max(IMAGE_MAX_FILES_LIMIT).default(IMAGE_MAX_FILES_DEFAULT),
});
const choiceOptionSchema = z.object({ id, label: requiredLabel(CUSTOMER_FIELD_OPTION_LABEL_MAX), extraPrice });
const choiceFieldSchema = z.object({
  ...base,
  type: z.literal("choice"),
  options: z
    .array(choiceOptionSchema)
    .min(CHOICE_OPTIONS_MIN)
    .max(CHOICE_OPTIONS_MAX)
    .refine((options) => new Set(options.map((option) => option.id)).size === options.length, { message: "duplicateOption" }),
});

export const customerFieldSchema = z.discriminatedUnion("type", [textFieldSchema, imageFieldSchema, choiceFieldSchema]);
export const customerFieldsSchema = z
  .array(customerFieldSchema)
  .max(CUSTOMER_FIELDS_MAX)
  .refine((fields) => new Set(fields.map((field) => field.id)).size === fields.length, { message: "duplicateField" });

export type CustomerField = z.infer<typeof customerFieldSchema>;
export type CustomerChoiceOption = z.infer<typeof choiceOptionSchema>;
export type LocalizedText = { ar: string; en: string };

/** Stored fields as written by the dashboard; anything that doesn't parse reads as none. */
export function parseCustomerFields(raw: unknown): CustomerField[] {
  if (raw == null) return [];
  const parsed = customerFieldsSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

export function hasRequiredCustomerFields(fields: readonly CustomerField[]): boolean {
  return fields.some((field) => field.required);
}

/** The text of a label in the shopper's language, else the other one. */
export function localizedText(text: Partial<LocalizedText> | null | undefined, locale: string): string {
  if (!text) return "";
  const own = locale === "en" ? text.en : text.ar;
  return (own?.trim() || (locale === "en" ? text.ar : text.en)?.trim() || "").trim();
}

export const toPiastres = (amount: number | null | undefined): number =>
  amount != null && Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;

/** Unit price (major units) plus the extras (piastres), added in piastres. */
export function unitPriceWithExtras(unitPrice: number, extrasPiastres: number): number {
  return (Math.round(unitPrice * 100) + Math.max(0, Math.round(extrasPiastres))) / 100;
}

// ---- Uploads -------------------------------------------------------------

/** Folder of one visitor's uploads for one store: `<storeId|market>/<userId>/`. */
export function customerUploadPrefix(storeId: string | null | undefined, userId: string): string {
  return `${(storeId ?? "market").toLowerCase()}/${userId.toLowerCase()}/`;
}

const UPLOAD_NAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

/** A path this visitor may attach: their own folder, a uuid name and an allowed extension. */
export function isCustomerUploadPath(path: unknown, prefix: string): path is string {
  if (typeof path !== "string" || !path.startsWith(prefix)) return false;
  return UPLOAD_NAME_RE.test(path.slice(prefix.length));
}

/** Any well-formed upload path (`<scope>/<user>/<uuid>.<ext>`), for a recheck that doesn't know the visitor. */
const ANY_UPLOAD_RE = /^(?:market|[0-9a-f-]{36})\/[0-9a-f-]{36}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

// ---- Customer values -----------------------------------------------------

/** What the storefront sends per field. */
export const customerInputValueSchema = z.object({
  fieldId: z.string().max(40),
  text: z.string().max(TEXT_MAX_LENGTH_LIMIT * 2).optional(),
  optionId: z.string().max(40).optional(),
  files: z.array(z.string().max(200)).max(IMAGE_MAX_FILES_LIMIT * 2).optional(),
});
export const customerInputValuesSchema = z.array(customerInputValueSchema).max(CUSTOMER_FIELDS_MAX * 2);
export type CustomerInputValue = z.infer<typeof customerInputValueSchema>;

/** One filled field on a cart line / order item, with both labels kept for the order. */
export type CustomerInputLine = {
  fieldId: string;
  type: CustomerFieldType;
  label: LocalizedText;
  text?: string;
  option?: { id: string; label: LocalizedText };
  /** Storage paths in the private bucket, never public links. */
  files?: string[];
  extraPiastres: number;
};

/** `cart_items.customer_inputs` and `order_items.customer_inputs` (0167). */
export type CustomerInputsSnapshot = {
  /** Canonical identity: the same product with the same key is one cart line. */
  key: string;
  extrasPiastres: number;
  lines: CustomerInputLine[];
};

export type CustomerInputError = {
  fieldId: string;
  code: "required" | "tooLong" | "invalidOption" | "tooManyFiles" | "invalidFile" | "unknownField";
};

export type CustomerInputsResult =
  | { ok: true; snapshot: CustomerInputsSnapshot | null; extrasPiastres: number }
  | { ok: false; errors: CustomerInputError[] };

// C0 controls except tab and newline, plus DEL and the bidi overrides.
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B-\u001F\u007F‪-‮⁦-⁩]/g;
const cleanText = (text: string) => text.replace(/\r\n?/g, "\n").replace(CONTROL_RE, "").trim();

function keyOf(lines: readonly CustomerInputLine[]): string {
  return JSON.stringify(
    [...lines]
      .sort((a, b) => (a.fieldId < b.fieldId ? -1 : a.fieldId > b.fieldId ? 1 : 0))
      .map((line) => [line.fieldId, line.text ?? line.option?.id ?? [...(line.files ?? [])].sort().join("|")]),
  );
}

/**
 * Checks the customer's values against the product's fields and prices them.
 * `uploadPrefix`: the visitor's own upload folder (add-to-cart); null accepts
 * any well-formed upload path (the checkout recheck of a stored line, whose
 * paths were checked when it was added). Empty optional fields are left out.
 */
export function validateCustomerInputs(
  fields: readonly CustomerField[],
  values: readonly CustomerInputValue[],
  options: { uploadPrefix: string | null },
): CustomerInputsResult {
  const errors: CustomerInputError[] = [];
  const byField = new Map<string, CustomerInputValue>();
  const known = new Set(fields.map((field) => field.id));
  for (const value of values) {
    if (!known.has(value.fieldId) || byField.has(value.fieldId)) {
      errors.push({ fieldId: value.fieldId, code: "unknownField" });
      continue;
    }
    byField.set(value.fieldId, value);
  }

  const lines: CustomerInputLine[] = [];
  for (const field of fields) {
    const value = byField.get(field.id);
    const label = { ar: field.label.ar, en: field.label.en };
    if (field.type === "text") {
      const text = cleanText(value?.text ?? "");
      if (!text) {
        if (field.required) errors.push({ fieldId: field.id, code: "required" });
        continue;
      }
      if (text.length > field.maxLength) {
        errors.push({ fieldId: field.id, code: "tooLong" });
        continue;
      }
      lines.push({ fieldId: field.id, type: "text", label, text, extraPiastres: toPiastres(field.extraPrice) });
    } else if (field.type === "choice") {
      const optionId = value?.optionId?.trim();
      if (!optionId) {
        if (field.required) errors.push({ fieldId: field.id, code: "required" });
        continue;
      }
      const option = field.options.find((candidate) => candidate.id === optionId);
      if (!option) {
        errors.push({ fieldId: field.id, code: "invalidOption" });
        continue;
      }
      lines.push({
        fieldId: field.id,
        type: "choice",
        label,
        option: { id: option.id, label: { ar: option.label.ar, en: option.label.en } },
        extraPiastres: toPiastres(option.extraPrice),
      });
    } else {
      const files = value?.files ?? [];
      if (!files.length) {
        if (field.required) errors.push({ fieldId: field.id, code: "required" });
        continue;
      }
      if (files.length > field.maxFiles) {
        errors.push({ fieldId: field.id, code: "tooManyFiles" });
        continue;
      }
      const wellFormed = files.every((path) =>
        options.uploadPrefix == null ? typeof path === "string" && ANY_UPLOAD_RE.test(path) : isCustomerUploadPath(path, options.uploadPrefix),
      );
      if (!wellFormed || new Set(files).size !== files.length) {
        errors.push({ fieldId: field.id, code: "invalidFile" });
        continue;
      }
      lines.push({ fieldId: field.id, type: "image", label, files: [...files], extraPiastres: toPiastres(field.extraPrice) });
    }
  }

  if (errors.length) return { ok: false, errors };
  if (!lines.length) return { ok: true, snapshot: null, extrasPiastres: 0 };
  const extrasPiastres = lines.reduce((sum, line) => sum + line.extraPiastres, 0);
  return { ok: true, snapshot: { key: keyOf(lines), extrasPiastres, lines }, extrasPiastres };
}

/**
 * The extras of what is filled so far, for the live price on the product page
 * (the server works the real amount out again on add).
 */
export function previewExtrasPiastres(fields: readonly CustomerField[], values: readonly CustomerInputValue[]): number {
  let total = 0;
  for (const field of fields) {
    const value = values.find((candidate) => candidate.fieldId === field.id);
    if (!value) continue;
    if (field.type === "choice") total += toPiastres(field.options.find((option) => option.id === value.optionId)?.extraPrice);
    else if (field.type === "text" ? cleanText(value.text ?? "") : value.files?.length) total += toPiastres(field.extraPrice);
  }
  return total;
}

/** The values a stored line was made from, to check them again. */
function valuesOf(snapshot: CustomerInputsSnapshot): CustomerInputValue[] {
  return snapshot.lines.map((line) => ({
    fieldId: line.fieldId,
    ...(line.text != null && { text: line.text }),
    ...(line.option && { optionId: line.option.id }),
    ...(line.files && { files: line.files }),
  }));
}

/**
 * Checkout: the line's stored inputs against the product's fields NOW. Passes
 * only when they are still valid and price the same (a renamed label is not a
 * change; the fresh labels are returned for the order). Otherwise the customer
 * reviews the line: the order never charges a different amount silently.
 */
export function recheckCustomerInputs(fields: readonly CustomerField[], stored: CustomerInputsSnapshot | null): CustomerInputsResult {
  if (!stored) return validateCustomerInputs(fields, [], { uploadPrefix: null });
  const result = validateCustomerInputs(fields, valuesOf(stored), { uploadPrefix: null });
  if (!result.ok) return result;
  if (result.extrasPiastres !== stored.extrasPiastres || (result.snapshot?.key ?? "") !== stored.key) {
    return { ok: false, errors: [{ fieldId: stored.lines[0]?.fieldId ?? "", code: "invalidOption" }] };
  }
  return result;
}

const snapshotSchema = z.object({
  key: z.string(),
  extrasPiastres: z.number().int().min(0),
  lines: z.array(
    z.object({
      fieldId: z.string(),
      type: z.enum(CUSTOMER_FIELD_TYPES),
      label: z.object({ ar: z.string(), en: z.string() }),
      text: z.string().optional(),
      option: z.object({ id: z.string(), label: z.object({ ar: z.string(), en: z.string() }) }).optional(),
      files: z.array(z.string()).optional(),
      extraPiastres: z.number().int().min(0),
    }),
  ),
});

/** A stored snapshot (cart line or order item); anything malformed reads as none. */
export function parseCustomerInputsSnapshot(raw: unknown): CustomerInputsSnapshot | null {
  if (raw == null) return null;
  const parsed = snapshotSchema.safeParse(raw);
  return parsed.success && parsed.data.lines.length ? parsed.data : null;
}

/** Two cart lines of the same product (and variant) merge only with identical inputs. */
export function sameCustomerInputs(a: CustomerInputsSnapshot | null | undefined, b: CustomerInputsSnapshot | null | undefined): boolean {
  return (a?.key ?? "") === (b?.key ?? "");
}

/** Every storage path a snapshot holds (seller downloads, cleanup). */
export function snapshotFiles(snapshot: CustomerInputsSnapshot | null | undefined): string[] {
  return snapshot?.lines.flatMap((line) => line.files ?? []) ?? [];
}

/**
 * A short, plain text of the inputs (picking list, print, email): text and
 * choices as written, photos as a count. Never a link.
 */
export function describeCustomerInputs(
  snapshot: CustomerInputsSnapshot | null | undefined,
  locale: string,
  imagesText: (count: number) => string,
): { label: string; value: string }[] {
  return (
    snapshot?.lines.map((line) => ({
      label: localizedText(line.label, locale),
      value:
        line.type === "text"
          ? (line.text ?? "")
          : line.type === "choice"
            ? localizedText(line.option?.label, locale)
            : imagesText(line.files?.length ?? 0),
    })) ?? []
  );
}

/** A new random id for a field or option (editor). */
export function newCustomerFieldId(): string {
  const bytes = globalThis.crypto?.getRandomValues?.(new Uint8Array(6));
  return bytes ? Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 10) : Math.random().toString(36).slice(2, 12);
}
