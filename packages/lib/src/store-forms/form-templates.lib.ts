/**
 * Ready-made store forms (the builder's Forms tab and Website › Forms): the
 * most common lead forms a shop needs, as fixed field lists. Labels are not
 * stored here: `buildTemplateForm` reads them through a translate function
 * (dashboard messages `storeForms.templates.<id>.*`), so a form is created in
 * the seller's language and edited like any other form afterwards.
 *
 * Pure. The server builds the form from the template id; the client never
 * sends field definitions for a template.
 */
import type { FormFieldType, FormInput } from "./store-forms.lib";

export type FormTemplateField = {
  key: string;
  type: FormFieldType;
  required?: boolean;
  width?: "full" | "half";
  /** Has a placeholder at `<id>.placeholders.<key>`. */
  placeholder?: boolean;
  /** Select options, labelled at `<id>.options.<option>`. */
  options?: readonly string[];
};

export type FormTemplate = { id: string; fields: readonly FormTemplateField[] };

const TIMES = ["morning", "afternoon", "evening"] as const;

const name = { key: "name", type: "text", required: true, width: "half" } as const;
const phone = { key: "phone", type: "phone", required: true, width: "half" } as const;
const email = { key: "email", type: "email" } as const;

/** In the order the pickers show them; the first is the default "new form". */
export const FORM_TEMPLATES: readonly FormTemplate[] = [
  {
    id: "contact",
    fields: [name, { ...phone, required: false }, { ...email, required: true }, { key: "message", type: "textarea", required: true }],
  },
  {
    id: "newsletter",
    fields: [{ ...email, required: true }, { key: "name", type: "text" }, { key: "consent", type: "checkbox", required: true }],
  },
  {
    id: "callback",
    fields: [name, phone, { key: "best_time", type: "select", options: TIMES }, { key: "message", type: "textarea" }],
  },
  {
    id: "quote",
    fields: [
      name,
      phone,
      email,
      { key: "product", type: "text", required: true, placeholder: true },
      { key: "quantity", type: "text", width: "half" },
      { key: "city", type: "text", width: "half" },
      { key: "message", type: "textarea" },
    ],
  },
  {
    id: "booking",
    fields: [
      name,
      phone,
      email,
      { key: "service", type: "select", required: true, options: ["visit", "phone_call", "video_call"] },
      { key: "preferred_date", type: "text", required: true, width: "half", placeholder: true },
      { key: "preferred_time", type: "select", width: "half", options: TIMES },
      { key: "message", type: "textarea" },
    ],
  },
  {
    id: "productQuestion",
    fields: [name, phone, { key: "product", type: "text", required: true, placeholder: true }, { key: "message", type: "textarea", required: true }],
  },
  {
    id: "wholesale",
    fields: [
      { key: "company", type: "text", required: true },
      name,
      phone,
      email,
      { key: "city", type: "text", width: "half" },
      { key: "volume", type: "select", width: "half", options: ["small", "medium", "large"] },
      { key: "message", type: "textarea" },
    ],
  },
  {
    id: "feedback",
    fields: [
      { key: "name", type: "text", width: "half" },
      { key: "order_number", type: "text", width: "half", placeholder: true },
      { key: "rating", type: "select", required: true, options: ["excellent", "good", "okay", "poor"] },
      { key: "message", type: "textarea", required: true },
      { key: "contact_ok", type: "checkbox" },
    ],
  },
  {
    id: "returns",
    fields: [
      name,
      phone,
      { key: "order_number", type: "text", required: true, width: "half", placeholder: true },
      { key: "request_type", type: "select", required: true, width: "half", options: ["return", "exchange"] },
      { key: "reason", type: "select", required: true, options: ["size", "damaged", "different", "changed_mind", "other"] },
      { key: "message", type: "textarea" },
    ],
  },
  {
    id: "customOrder",
    fields: [
      name,
      phone,
      email,
      { key: "message", type: "textarea", required: true, placeholder: true },
      { key: "budget", type: "text", width: "half" },
      { key: "needed_by", type: "text", width: "half", placeholder: true },
    ],
  },
];

export const FORM_TEMPLATE_IDS = FORM_TEMPLATES.map((t) => t.id);

const BY_ID = new Map(FORM_TEMPLATES.map((t) => [t.id, t]));

export function getFormTemplate(id: unknown): FormTemplate | undefined {
  return typeof id === "string" ? BY_ID.get(id) : undefined;
}

/**
 * The form a template creates. `text` gets keys relative to the template
 * (`name`, `description`, `submit`, `success`, `fields.<key>`,
 * `placeholders.<key>`, `options.<option>`).
 */
export function buildTemplateForm(template: FormTemplate, text: (key: string) => string): FormInput {
  return {
    name: text("name"),
    description: text("description"),
    fields: template.fields.map((field) => ({
      id: field.key,
      type: field.type,
      key: field.key,
      label: text(`fields.${field.key}`),
      required: field.required ?? false,
      width: field.width ?? "full",
      ...(field.placeholder && { placeholder: text(`placeholders.${field.key}`) }),
      ...(field.options && { options: field.options.map((option) => text(`options.${option}`)) }),
    })),
    settings: { submitLabel: text("submit"), successMessage: text("success") },
  };
}
