"use client";

import { Controller, useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ClipboardList, ImageIcon, ListChecks, Plus, Trash2, Type } from "lucide-react";
import {
  CHOICE_OPTIONS_MAX,
  CHOICE_OPTIONS_MIN,
  CUSTOMER_FIELD_HELP_MAX,
  CUSTOMER_FIELD_LABEL_MAX,
  CUSTOMER_FIELD_OPTION_LABEL_MAX,
  CUSTOMER_FIELDS_MAX,
  IMAGE_MAX_FILES_DEFAULT,
  IMAGE_MAX_FILES_LIMIT,
  TEXT_MAX_LENGTH_DEFAULT,
  TEXT_MAX_LENGTH_LIMIT,
  newCustomerFieldId,
  type CustomerField,
  type CustomerFieldType,
} from "@workspace/lib/products/customer-fields";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { IconButton } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { FIELD_CLASS, FieldError, FieldHint, FieldLabel, NumberStepper, SMALL_BUTTON_CLASS, ToggleRow } from "../add/form-kit";
import { CollapsibleSection } from "../add/sections/collapsible-section";
import { MoneyField } from "../add/sections/fields";
import { getErrorAtPath } from "../add/add-product.lib";
import type { AddProductFormData } from "../add/add-product.schema";

/**
 * "Customer requirements" (مطلوب من العميل, 0167, ROADMAP.md F-91): what the
 * seller needs from the customer to make this product (a name to print, a
 * photo for a T-shirt, a size of frame). Up to 10 fields of three types, each
 * with both labels, an optional help line and an optional extra price (a choice
 * list: per option). Saved by saveProductCustomerFields after the product.
 */

const TYPE_ICON: Record<CustomerFieldType, typeof Type> = { text: Type, image: ImageIcon, choice: ListChecks };

function blankField(type: CustomerFieldType, keep?: Pick<CustomerField, "id" | "label" | "help" | "required">): CustomerField {
  const base = keep ?? { id: newCustomerFieldId(), label: { ar: "", en: "" }, help: { ar: "", en: "" }, required: true };
  if (type === "text") return { ...base, type, extraPrice: null, maxLength: TEXT_MAX_LENGTH_DEFAULT };
  if (type === "image") return { ...base, type, extraPrice: null, maxFiles: IMAGE_MAX_FILES_DEFAULT };
  return {
    ...base,
    type,
    options: [
      { id: newCustomerFieldId(), label: { ar: "", en: "" }, extraPrice: null },
      { id: newCustomerFieldId(), label: { ar: "", en: "" }, extraPrice: null },
    ],
  };
}

export function CustomerFieldsSection({ id = "sec-customer-fields" }: { id?: string }) {
  const t = useTranslations("productForm.sections.customerFields");
  const form = useFormContext<AddProductFormData>();
  const { fields, append, remove, swap } = useFieldArray({ control: form.control, name: "customerFields", keyName: "key" });
  const { errors } = useFormState({ control: form.control, name: "customerFields" });
  const required = (useWatch({ control: form.control, name: "customerFields" }) ?? []).filter((field) => field?.required).length;

  return (
    <CollapsibleSection
      id={id}
      icon={ClipboardList}
      title={t("title")}
      description={t("description")}
      summary={fields.length ? t("summary", { count: fields.length, required }) : t("summaryNone")}
      summaryTone={fields.length ? "ok" : "muted"}
      filled={fields.length > 0}
      invalid={Boolean(errors.customerFields)}
    >
      <FieldHint>{t("hint")}</FieldHint>

      {fields.map((field, index) => (
        <FieldCard
          key={field.key}
          index={index}
          count={fields.length}
          onRemove={() => remove(index)}
          onMove={(to) => swap(index, to)}
        />
      ))}

      {fields.length < CUSTOMER_FIELDS_MAX ? (
        <div className="flex flex-wrap gap-2">
          {(["text", "image", "choice"] as const).map((type) => {
            const Icon = TYPE_ICON[type];
            return (
              <Button key={type} type="button" variant="neutral" className={cn(SMALL_BUTTON_CLASS, "w-fit")} onClick={() => append(blankField(type))}>
                <Plus aria-hidden />
                <Icon aria-hidden />
                {t(`add.${type}`)}
              </Button>
            );
          })}
        </div>
      ) : (
        <FieldHint>{t("max", { count: CUSTOMER_FIELDS_MAX })}</FieldHint>
      )}
    </CollapsibleSection>
  );
}

/** The error under a path, once the seller saved or touched the form. */
function useError(path: string): boolean {
  const { errors, submitCount } = useFormState<AddProductFormData>({ name: path as never });
  return submitCount > 0 && Boolean(getErrorAtPath(errors, path));
}

function FieldCard({ index, count, onRemove, onMove }: { index: number; count: number; onRemove: () => void; onMove: (to: number) => void }) {
  const t = useTranslations("productForm.sections.customerFields");
  const form = useFormContext<AddProductFormData>();
  const path = `customerFields.${index}` as const;
  const field = useWatch({ control: form.control, name: path });
  const type = field?.type ?? "text";
  const Icon = TYPE_ICON[type];
  const arInvalid = useError(`${path}.label.ar`);
  const enInvalid = useError(`${path}.label.en`);
  const extraInvalid = useError(`${path}.extraPrice`);

  const changeType = (next: CustomerFieldType) => {
    if (!field || next === type) return;
    const { id, label, help, required } = field;
    form.setValue(path, blankField(next, { id, label, help, required }), { shouldDirty: true, shouldValidate: form.formState.submitCount > 0 });
  };

  return (
    <div className="grid gap-3.5 rounded-2xl border border-(--s-line) bg-(--s-surface-2) p-3.5 max-[600px]:p-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-(--s-surface) text-(--s-subtle)">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-(--s-ink)">
          {field?.label?.ar?.trim() || field?.label?.en?.trim() || t(`types.${type}`)}
        </span>
        <IconButton type="button" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={t("moveUp")} title={t("moveUp")}>
          <ArrowUp aria-hidden />
        </IconButton>
        <IconButton type="button" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label={t("moveDown")} title={t("moveDown")}>
          <ArrowDown aria-hidden />
        </IconButton>
        <IconButton type="button" onClick={onRemove} aria-label={t("remove")} title={t("remove")} className="hover:text-destructive">
          <Trash2 aria-hidden />
        </IconButton>
      </div>

      <div role="radiogroup" aria-label={t("type")} className="flex w-fit flex-wrap gap-1 rounded-full border border-(--s-field) bg-(--s-surface) p-[3px]">
        {(["text", "image", "choice"] as const).map((option) => {
          const OptionIcon = TYPE_ICON[option];
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={type === option}
              onClick={() => changeType(option)}
              className={cn(
                "flex h-[34px] cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors max-[600px]:h-10",
                type === option ? "bg-(--s-solid) text-(--s-solid-fg)" : "text-(--s-muted) hover:text-(--s-ink)",
              )}
            >
              <OptionIcon className="size-3.5" aria-hidden />
              {t(`types.${option}`)}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <FieldLabel htmlFor={`cf-${index}-label-ar`} required locale="ar">
            {t("label")}
          </FieldLabel>
          <Input
            id={`cf-${index}-label-ar`}
            dir="rtl"
            {...form.register(`${path}.label.ar`)}
            maxLength={CUSTOMER_FIELD_LABEL_MAX}
            placeholder={t(`labelPlaceholder.${type}.ar`)}
            aria-invalid={arInvalid}
            className={cn(FIELD_CLASS, "max-md:text-base")}
          />
        </div>
        <div className="grid gap-1.5">
          <FieldLabel htmlFor={`cf-${index}-label-en`} required locale="en">
            {t("label")}
          </FieldLabel>
          <Input
            id={`cf-${index}-label-en`}
            dir="ltr"
            {...form.register(`${path}.label.en`)}
            maxLength={CUSTOMER_FIELD_LABEL_MAX}
            placeholder={t(`labelPlaceholder.${type}.en`)}
            aria-invalid={enInvalid}
            className={cn(FIELD_CLASS, "max-md:text-base")}
          />
        </div>
        {(arInvalid || enInvalid) && (
          <div className="sm:col-span-2">
            <FieldError>{t("labelRequired")}</FieldError>
          </div>
        )}
        <div className="grid gap-1.5">
          <FieldLabel htmlFor={`cf-${index}-help-ar`} locale="ar" note={t("optional")}>
            {t("help")}
          </FieldLabel>
          <Input id={`cf-${index}-help-ar`} dir="rtl" {...form.register(`${path}.help.ar`)} maxLength={CUSTOMER_FIELD_HELP_MAX} className={cn(FIELD_CLASS, "max-md:text-base")} />
        </div>
        <div className="grid gap-1.5">
          <FieldLabel htmlFor={`cf-${index}-help-en`} locale="en" note={t("optional")}>
            {t("help")}
          </FieldLabel>
          <Input id={`cf-${index}-help-en`} dir="ltr" {...form.register(`${path}.help.en`)} maxLength={CUSTOMER_FIELD_HELP_MAX} className={cn(FIELD_CLASS, "max-md:text-base")} />
        </div>
      </div>

      <Controller
        control={form.control}
        name={`${path}.required`}
        render={({ field: required }) => (
          <ToggleRow
            id={`cf-${index}-required`}
            checked={!!required.value}
            onCheckedChange={(checked) => required.onChange(checked)}
            title={t("required")}
            description={t("requiredDescription")}
          />
        )}
      />

      {type !== "choice" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <FieldLabel htmlFor={`cf-${index}-extra`} note={t("optional")}>
              {t("extraPrice")}
            </FieldLabel>
            <MoneyField id={`cf-${index}-extra`} name={`${path}.extraPrice`} invalid={extraInvalid} />
            <FieldHint>{t("extraPriceHint")}</FieldHint>
          </div>
          {type === "text" && (
            <div className="grid gap-1.5">
              <FieldLabel>{t("maxLength")}</FieldLabel>
              <Controller
                control={form.control}
                name={`${path}.maxLength` as `customerFields.${number}.label.ar`}
                render={({ field: maxLength }) => (
                  <NumberStepper
                    value={maxLength.value as unknown as number | undefined}
                    onChange={(value) => maxLength.onChange(value ?? TEXT_MAX_LENGTH_DEFAULT)}
                    min={1}
                    max={TEXT_MAX_LENGTH_LIMIT}
                    suffix={t("characters")}
                    decrementLabel={t("less")}
                    incrementLabel={t("more")}
                    inputLabel={t("maxLength")}
                  />
                )}
              />
            </div>
          )}
          {type === "image" && (
            <div className="grid gap-1.5">
              <FieldLabel>{t("maxFiles")}</FieldLabel>
              <Controller
                control={form.control}
                name={`${path}.maxFiles` as `customerFields.${number}.label.ar`}
                render={({ field: maxFiles }) => (
                  <NumberStepper
                    value={maxFiles.value as unknown as number | undefined}
                    onChange={(value) => maxFiles.onChange(value ?? IMAGE_MAX_FILES_DEFAULT)}
                    min={1}
                    max={IMAGE_MAX_FILES_LIMIT}
                    suffix={t("photos")}
                    decrementLabel={t("less")}
                    incrementLabel={t("more")}
                    inputLabel={t("maxFiles")}
                  />
                )}
              />
              <FieldHint>{t("photoRules")}</FieldHint>
            </div>
          )}
        </div>
      )}

      {type === "choice" && <ChoiceOptions index={index} />}
    </div>
  );
}

function ChoiceOptions({ index }: { index: number }) {
  const t = useTranslations("productForm.sections.customerFields");
  const form = useFormContext<AddProductFormData>();
  const name = `customerFields.${index}.options` as `customerFields.${number}.options`;
  const { fields, append, remove } = useFieldArray({ control: form.control, name: name as never, keyName: "key" });
  const { errors, submitCount } = useFormState<AddProductFormData>({ name: name as never });
  const invalid = submitCount > 0 && Boolean(getErrorAtPath(errors, name));

  return (
    <div className="grid gap-2">
      <FieldLabel required>{t("options")}</FieldLabel>
      {fields.map((option, optionIndex) => (
        <div key={option.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-xl border border-(--s-line) bg-(--s-surface) p-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_auto]">
          <Input
            dir="rtl"
            {...form.register(`${name}.${optionIndex}.label.ar` as never)}
            maxLength={CUSTOMER_FIELD_OPTION_LABEL_MAX}
            placeholder={t("optionAr")}
            aria-label={t("optionAr")}
            className={cn(FIELD_CLASS, "h-10 max-md:text-base")}
          />
          <IconButton
            type="button"
            disabled={fields.length <= CHOICE_OPTIONS_MIN}
            onClick={() => remove(optionIndex)}
            aria-label={t("removeOption")}
            title={t("removeOption")}
            className="hover:text-destructive sm:order-last"
          >
            <Trash2 aria-hidden />
          </IconButton>
          <Input
            dir="ltr"
            {...form.register(`${name}.${optionIndex}.label.en` as never)}
            maxLength={CUSTOMER_FIELD_OPTION_LABEL_MAX}
            placeholder={t("optionEn")}
            aria-label={t("optionEn")}
            className={cn(FIELD_CLASS, "col-span-2 h-10 max-md:text-base sm:col-span-1")}
          />
          <div className="col-span-2 sm:col-span-1" title={t("optionExtra")}>
            <MoneyField name={`${name}.${optionIndex}.extraPrice`} className="h-10" />
          </div>
        </div>
      ))}
      {invalid && <FieldError>{t("optionsInvalid", { min: CHOICE_OPTIONS_MIN })}</FieldError>}
      <FieldHint>{t("optionsHint")}</FieldHint>
      {fields.length < CHOICE_OPTIONS_MAX && (
        <Button
          type="button"
          variant="neutral"
          className={cn(SMALL_BUTTON_CLASS, "w-fit")}
          onClick={() => append({ id: newCustomerFieldId(), label: { ar: "", en: "" }, extraPrice: null } as never)}
        >
          <Plus aria-hidden />
          {t("addOption")}
        </Button>
      )}
    </div>
  );
}
