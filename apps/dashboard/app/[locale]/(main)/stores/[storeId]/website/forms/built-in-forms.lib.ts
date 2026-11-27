import { STARTER_FORM_COPY } from "@workspace/lib/store-forms/starter";
import { isSignUpForm } from "@workspace/lib/store-forms/subscribers";
import type { FormField } from "@workspace/lib/store-forms";

/**
 * Website › Forms hub: the storefront's built-in forms that live in
 * `store_forms` (the newsletter and contact forms a store's starting site
 * creates). Forms carry no "kind" column, so the hub remembers which row is
 * which in `stores.settings.builtInForms` ({ newsletter?: id, contact?: id };
 * dashboard-only, no migration). A store from before that pointer existed is
 * matched by the starter name (Arabic or English) or by the starter's field
 * IDs. Pure, safe on the client.
 */

export const BUILT_IN_FORM_KINDS = ["newsletter", "contact"] as const;
export type BuiltInFormKind = (typeof BUILT_IN_FORM_KINDS)[number];

export const isBuiltInFormKind = (value: unknown): value is BuiltInFormKind =>
  BUILT_IN_FORM_KINDS.includes(value as BuiltInFormKind);

export type BuiltInFormPointers = Partial<Record<BuiltInFormKind, string>>;

type MatchableForm = { id: string; name: string; fields: readonly Pick<FormField, "key" | "type">[] };

/** `stores.settings.builtInForms`, keeping only string ids of known kinds. */
export function parseBuiltInFormPointers(settings: unknown): BuiltInFormPointers {
  const raw = (settings as { builtInForms?: unknown } | null | undefined)?.builtInForms;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: BuiltInFormPointers = {};
  for (const kind of BUILT_IN_FORM_KINDS) {
    const id = (raw as Record<string, unknown>)[kind];
    if (typeof id === "string" && id.length <= 64) out[kind] = id;
  }
  return out;
}

const STARTER_KEYS: Record<BuiltInFormKind, readonly string[]> = {
  newsletter: ["email", "name", "consent"],
  contact: ["name", "phone", "email", "message"],
};

const starterNames = (kind: BuiltInFormKind) =>
  new Set([STARTER_FORM_COPY[kind].ar.name, STARTER_FORM_COPY[kind].en.name].map((n) => String(n).trim()));

/** The form still looks like the starter: only starter field IDs, with the ones that make it that kind. */
function hasStarterShape(kind: BuiltInFormKind, form: MatchableForm): boolean {
  const allowed = STARTER_KEYS[kind];
  if (!form.fields.length || !form.fields.every((f) => allowed.includes(f.key))) return false;
  if (kind === "newsletter") return isSignUpForm(form.fields);
  return form.fields.some((f) => f.type === "textarea") && form.fields.some((f) => f.type === "email");
}

/**
 * Which store form is the newsletter and which is the contact form: the saved
 * pointer when it still exists, else the starter name, else the starter shape.
 * One form never fills both kinds. `forms` are the store's own forms only.
 */
export function resolveBuiltInForms<F extends MatchableForm>(pointers: BuiltInFormPointers, forms: readonly F[]): Partial<Record<BuiltInFormKind, F>> {
  const out: Partial<Record<BuiltInFormKind, F>> = {};
  const used = new Set<string>();
  const take = (kind: BuiltInFormKind, form: F | undefined) => {
    if (!form || out[kind] || used.has(form.id)) return;
    out[kind] = form;
    used.add(form.id);
  };
  for (const kind of BUILT_IN_FORM_KINDS) take(kind, forms.find((f) => f.id === pointers[kind]));
  for (const kind of BUILT_IN_FORM_KINDS) {
    const names = starterNames(kind);
    take(kind, forms.find((f) => !used.has(f.id) && names.has(f.name.trim())));
  }
  for (const kind of BUILT_IN_FORM_KINDS) take(kind, forms.find((f) => !used.has(f.id) && hasStarterShape(kind, f)));
  return out;
}
