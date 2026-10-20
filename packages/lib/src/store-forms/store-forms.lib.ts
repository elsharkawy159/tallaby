/**
 * Store forms (PLAN.md §8.4, P4-10): the field model, the definition schema,
 * submission validation and CSV export. Pure (no database imports), shared by
 * the dashboard form editor, the storefront form and the server functions.
 *
 * Modelled on the Valorcy reference `lib/forms/types.ts`, cut down to the
 * fixed field set of §8.4 and validated with strict Zod schemas.
 */
import { z } from "zod";

export const FORM_FIELD_TYPES = ["text", "email", "phone", "textarea", "select", "checkbox"] as const;
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export const FORM_STATUSES = ["active", "disabled"] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

/** `spam` exists in the table CHECK; the inbox uses the first three. */
export const SUBMISSION_STATUSES = ["new", "read", "archived", "spam"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const FORM_LIMITS = {
  maxForms: 50,
  maxFields: 30,
  maxOptions: 50,
  maxLabel: 200,
  maxOption: 100,
  maxTextValue: 500,
  maxLongTextValue: 5000,
} as const;

/** D28: submissions hold customer PII and are deleted after 12 months. */
export const FORM_SUBMISSION_RETENTION_MONTHS = 12;

/**
 * Name of the hidden honeypot input on the storefront form. It starts with an
 * underscore, so it can never collide with a field key (`FIELD_KEY`).
 */
export const FORM_HONEYPOT_FIELD = "_hp_website";

const FIELD_KEY = /^[a-z][a-z0-9_]{0,59}$/;
const FIELD_ID = /^[A-Za-z0-9_-]{1,40}$/;

const trimmed = (max: number) => z.string().trim().max(max);

export const formFieldSchema = z
  .object({
    id: z.string().regex(FIELD_ID),
    type: z.enum(FORM_FIELD_TYPES),
    key: z.string().regex(FIELD_KEY),
    label: trimmed(FORM_LIMITS.maxLabel).min(1),
    placeholder: trimmed(200).optional(),
    helpText: trimmed(300).optional(),
    required: z.boolean().default(false),
    options: z.array(trimmed(FORM_LIMITS.maxOption).min(1)).max(FORM_LIMITS.maxOptions).optional(),
    width: z.enum(["full", "half"]).default("full"),
  })
  .strict();
export type FormField = z.output<typeof formFieldSchema>;
export type FormFieldInput = z.input<typeof formFieldSchema>;

export const formSettingsSchema = z
  .object({
    /** Empty = the storefront's default label ("Send"). */
    submitLabel: trimmed(60).default(""),
    /** Empty = the storefront's default thank-you text. */
    successMessage: trimmed(300).default(""),
  })
  .strict();
export type FormSettings = z.output<typeof formSettingsSchema>;

export const formFieldsSchema = z
  .array(formFieldSchema)
  .min(1)
  .max(FORM_LIMITS.maxFields)
  .superRefine((fields, ctx) => {
    const keys = new Set<string>();
    const ids = new Set<string>();
    fields.forEach((field, index) => {
      if (keys.has(field.key)) ctx.addIssue({ code: "custom", message: "duplicate_key", path: [index, "key"] });
      if (ids.has(field.id)) ctx.addIssue({ code: "custom", message: "duplicate_id", path: [index, "id"] });
      keys.add(field.key);
      ids.add(field.id);
      if (field.type === "select" && !field.options?.length) {
        ctx.addIssue({ code: "custom", message: "options_required", path: [index, "options"] });
      }
      if (field.type !== "select" && field.options !== undefined) {
        ctx.addIssue({ code: "custom", message: "options_not_allowed", path: [index, "options"] });
      }
    });
  });

export const formInputSchema = z
  .object({
    name: trimmed(120).min(1),
    description: trimmed(500).nullable().optional(),
    status: z.enum(FORM_STATUSES).default("active"),
    fields: formFieldsSchema,
    settings: formSettingsSchema.default({ submitLabel: "", successMessage: "" }),
  })
  .strict();
export type FormInput = z.input<typeof formInputSchema>;
export type FormDefinitionData = z.output<typeof formInputSchema>;

/** Reads stored `fields` jsonb; anything that no longer validates is dropped (never throws). */
export function parseStoredFields(raw: unknown): FormField[] {
  if (!Array.isArray(raw)) return [];
  const out: FormField[] = [];
  const keys = new Set<string>();
  for (const item of raw) {
    const parsed = formFieldSchema.safeParse(item);
    if (!parsed.success || keys.has(parsed.data.key)) continue;
    if (parsed.data.type === "select" && !parsed.data.options?.length) continue;
    keys.add(parsed.data.key);
    out.push(parsed.data);
  }
  return out;
}

export function parseStoredSettings(raw: unknown): FormSettings {
  const parsed = formSettingsSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : { submitLabel: "", successMessage: "" };
}

/** A label → field key ("Full name" → "full_name"); non-Latin labels fall back to `field_N`. */
export function fieldKeyFromLabel(label: string, taken: readonly string[], fallbackIndex: number): string {
  const base = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
  const start = base && /^[a-z]/.test(base) ? base : `field_${fallbackIndex}`;
  if (!taken.includes(start)) return start;
  let i = 2;
  while (taken.includes(`${start}_${i}`)) i++;
  return `${start}_${i}`;
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export type FieldError = "required" | "invalid" | "too_long";

export type SubmissionValidation =
  | { ok: true; values: Record<string, string> }
  | { ok: false; errors: Record<string, FieldError> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[+\d][\d\s().-]{4,24}$/;

/**
 * Validates raw values against a form's fields. Unknown keys are dropped; a
 * checkbox is stored as "yes" when ticked. Only strings (and booleans for
 * checkboxes) are accepted, so nested objects never reach the database.
 */
export function validateFormSubmission(fields: readonly FormField[], raw: unknown): SubmissionValidation {
  const input = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const errors: Record<string, FieldError> = {};
  const values: Record<string, string> = {};

  for (const field of fields) {
    const value = input[field.key];

    if (field.type === "checkbox") {
      const checked = value === true || value === "on" || value === "yes" || value === "true";
      if (field.required && !checked) errors[field.key] = "required";
      else if (checked) values[field.key] = "yes";
      continue;
    }

    if (value !== undefined && value !== null && typeof value !== "string") {
      errors[field.key] = "invalid";
      continue;
    }
    const text = (value ?? "").trim();
    if (!text) {
      if (field.required) errors[field.key] = "required";
      continue;
    }
    const max = field.type === "textarea" ? FORM_LIMITS.maxLongTextValue : FORM_LIMITS.maxTextValue;
    if (text.length > max) {
      errors[field.key] = "too_long";
      continue;
    }
    if (field.type === "email" && !EMAIL.test(text)) errors[field.key] = "invalid";
    else if (field.type === "phone" && !PHONE.test(text)) errors[field.key] = "invalid";
    else if (field.type === "select" && !(field.options ?? []).includes(text)) errors[field.key] = "invalid";
    else values[field.key] = text;
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, values };
}

export type SubmissionColumns = { name: string | null; email: string | null; phone: string | null; message: string | null };

/** Picks the inbox's first-class columns (name, email, phone, message) out of validated values. */
export function submissionColumns(fields: readonly FormField[], values: Record<string, string>): SubmissionColumns {
  const filled = fields.filter((f) => values[f.key] !== undefined && f.type !== "checkbox");
  const pick = (field: FormField | undefined) => (field ? values[field.key]!.slice(0, FORM_LIMITS.maxTextValue) : null);
  const nameField =
    filled.find((f) => f.key === "name" || f.key === "full_name") ??
    filled.find((f) => f.type === "text" && /name|الاسم|اسم/i.test(`${f.key} ${f.label}`));
  const messageField = filled.find((f) => f.key === "message") ?? filled.find((f) => f.type === "textarea");
  return {
    name: pick(nameField),
    email: pick(filled.find((f) => f.type === "email")),
    phone: pick(filled.find((f) => f.type === "phone")),
    message: messageField ? values[messageField.key]!.slice(0, FORM_LIMITS.maxLongTextValue) : null,
  };
}

/** Stable comparison key for replay detection (same form, same visitor, same values). */
export function submissionFingerprint(values: Record<string, string>): string {
  return JSON.stringify(Object.keys(values).sort().map((k) => [k, values[k]]));
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

/**
 * One CSV cell. Cells starting with `=`, `+`, `-`, `@` (or tab / CR) are
 * prefixed with `'` so spreadsheet apps never evaluate visitor input as a
 * formula (CSV injection). Quotes, commas and newlines are quoted.
 */
export function escapeCsvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Rows → CSV with a UTF-8 BOM (so Excel shows Arabic correctly) and CRLF line ends. */
export function toCsv(header: readonly string[], rows: readonly (readonly unknown[])[]): string {
  const lines = [header, ...rows].map((row) => row.map(escapeCsvCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

export { FORM_TEMPLATES, FORM_TEMPLATE_IDS, buildTemplateForm, getFormTemplate, type FormTemplate, type FormTemplateField } from "./form-templates.lib";
