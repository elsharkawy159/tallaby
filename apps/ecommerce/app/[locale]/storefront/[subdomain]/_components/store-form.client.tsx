"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { FORM_HONEYPOT_FIELD } from "@workspace/lib/store-forms";
import { FORM_SUBMIT_CLASS, FormFieldsView, formCopy } from "@workspace/store-sections/forms";
import type { PublicStoreForm } from "@workspace/store-sections/render";
import { submitStorefrontForm } from "@/lib/store-forms/submit.server";

/**
 * The interactive contact form on a store host (PLAN.md §8.4, P4-10). Fields
 * are drawn by the shared FormFieldsView (same markup as the editor preview);
 * the server action validates everything again and decides the store from
 * the host.
 */
export function StoreForm({ form, instanceId }: { form: PublicStoreForm; instanceId: string }) {
  const t = useTranslations("storeForms");
  const locale = useLocale() === "en" ? "en" : "ar";
  const copy = formCopy(form, locale);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;
    const data = new FormData(event.currentTarget);
    const values: Record<string, string | boolean> = {};
    for (const field of form.fields) {
      if (field.type === "checkbox") values[field.key] = data.get(field.key) === "yes";
      else values[field.key] = String(data.get(field.key) ?? "");
    }
    const honeypot = String(data.get(FORM_HONEYPOT_FIELD) ?? "");

    setFormError(null);
    startTransition(async () => {
      const result = await submitStorefrontForm({ formId: form.id, values, honeypot: honeypot || undefined });
      if (result.ok) {
        setErrors({});
        setDone(result.message || copy.successMessage);
        return;
      }
      if (result.fieldErrors) {
        setErrors(Object.fromEntries(Object.entries(result.fieldErrors).map(([key, code]) => [key, t(`fieldErrors.${code}`)])));
      }
      setFormError(t(`errors.${result.error}`));
    });
  };

  if (done) {
    return (
      <div role="status" className="flex flex-col items-center gap-2 rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-paper) p-6 text-center">
        <CircleCheck className="size-8 text-(--sf-brand)" aria-hidden />
        <p className="whitespace-pre-line text-pretty font-medium">{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" aria-busy={isPending}>
      {/* Honeypot: hidden from people and screen readers; bots fill it. */}
      <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${instanceId}-hp`}>Website</label>
        <input id={`${instanceId}-hp`} type="text" name={FORM_HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
      </div>
      <FormFieldsView form={form} idPrefix={`f-${instanceId}`} locale={locale} disabled={isPending} errors={errors} />
      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}
      <button type="submit" disabled={isPending} className={FORM_SUBMIT_CLASS}>
        {isPending && <LoaderCircle className="me-2 size-4 animate-spin" aria-hidden />}
        {isPending ? t("sending") : copy.submitLabel}
      </button>
    </form>
  );
}
