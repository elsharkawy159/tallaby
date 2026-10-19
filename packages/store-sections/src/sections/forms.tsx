import type { SiteLocale } from "../config/schema";
import { sectionText } from "../core/copy";
import type { PublicFormField, PublicStoreForm } from "../core/types";
import { cn } from "./_primitives";

// ---------------------------------------------------------------------------
// Form fields (presentational, no hooks): the storefront's interactive form
// (a client component in ecommerce) and the editor's static preview both draw
// fields through this, so they always match.
// ---------------------------------------------------------------------------

const CONTROL =
  "w-full rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-paper) px-3 py-2.5 text-sm text-(--sf-ink) placeholder:text-(--sf-muted) focus:border-(--sf-brand) focus:outline-none focus:ring-2 focus:ring-(--sf-brand)/30 disabled:cursor-not-allowed disabled:opacity-70";

const INPUT_TYPES: Record<PublicFormField["type"], string> = {
  text: "text",
  email: "email",
  phone: "tel",
  textarea: "text",
  select: "text",
  checkbox: "checkbox",
};

function FieldView({
  field,
  id,
  locale,
  disabled,
  error,
}: {
  field: PublicFormField;
  id: string;
  locale: SiteLocale;
  disabled: boolean;
  error?: string;
}) {
  const describedBy = error ? `${id}-error` : field.helpText ? `${id}-help` : undefined;
  const required = field.required ? <span className="ms-0.5 text-red-600" aria-hidden>*</span> : null;
  const help = error ? (
    <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
      {error}
    </p>
  ) : field.helpText ? (
    <p id={`${id}-help`} className="mt-1 text-xs text-(--sf-muted)">
      {field.helpText}
    </p>
  ) : null;
  const common = {
    id,
    name: field.key,
    disabled,
    required: field.required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  };

  if (field.type === "checkbox") {
    return (
      <div>
        <label htmlFor={id} className="flex items-start gap-2.5 text-sm">
          <input {...common} type="checkbox" value="yes" className="mt-0.5 size-4 accent-(--sf-brand)" />
          <span>
            {field.label}
            {required}
          </span>
        </label>
        {help}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium">
        {field.label}
        {required}
      </label>
      {field.type === "textarea" ? (
        <textarea {...common} rows={5} maxLength={5000} placeholder={field.placeholder} className={cn(CONTROL, "resize-y")} />
      ) : field.type === "select" ? (
        <select {...common} defaultValue="" className={CONTROL}>
          <option value="">{field.placeholder || sectionText("formSelect", locale)}</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...common}
          type={INPUT_TYPES[field.type]}
          maxLength={500}
          placeholder={field.placeholder}
          dir={field.type === "email" || field.type === "phone" ? "ltr" : undefined}
          autoComplete={field.type === "email" ? "email" : field.type === "phone" ? "tel" : undefined}
          className={CONTROL}
        />
      )}
      {help}
    </div>
  );
}

/** The fields of a form in a two-column grid (half-width fields pair up on wide screens). */
export function FormFieldsView({
  form,
  idPrefix,
  locale,
  disabled = false,
  errors,
}: {
  form: PublicStoreForm;
  idPrefix: string;
  locale: SiteLocale;
  disabled?: boolean;
  errors?: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {form.fields.map((field) => (
        <div key={field.key} className={field.width === "half" ? "sm:col-span-1" : "sm:col-span-2"}>
          <FieldView field={field} id={`${idPrefix}-${field.key}`} locale={locale} disabled={disabled} error={errors?.[field.key]} />
        </div>
      ))}
    </div>
  );
}

export const FORM_SUBMIT_CLASS =
  "inline-flex h-11 items-center justify-center rounded-(--sf-radius,12px) bg-(--sf-brand) px-6 text-sm font-semibold text-(--sf-brand-ink,#fff) transition-opacity hover:opacity-90 disabled:opacity-60";

/** The submit label and thank-you text of a form, with the section copy as fallback. */
export function formCopy(form: PublicStoreForm, locale: SiteLocale) {
  return {
    submitLabel: form.submitLabel || sectionText("formSubmit", locale),
    successMessage: form.successMessage || sectionText("formSuccess", locale),
  };
}
