"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlignLeft,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckSquare,
  ChevronsUpDown,
  ClipboardList,
  ListPlus,
  Mail,
  Phone,
  Settings2,
  Trash2,
  Type,
  type LucideIcon,
} from "lucide-react";

import {
  FORM_FIELD_TYPES,
  FORM_LIMITS,
  fieldKeyFromLabel,
  formInputSchema,
  type FormField,
  type FormFieldType,
  type FormSettings,
  type FormStatus,
} from "@workspace/lib/store-forms";
import { CheckRow, Field, FieldRow, IconButton, NativeSelect, Note, PageHeader, SaveBar, SectionCard, SellerButton, TextArea, TextAction, TextInput, Toggle } from "@/components/seller-ui";
import { saveForm } from "../forms.server";

const FIELD_ICONS: Record<FormFieldType, LucideIcon> = {
  text: Type,
  email: Mail,
  phone: Phone,
  textarea: AlignLeft,
  select: ChevronsUpDown,
  checkbox: CheckSquare,
};

const DEFAULT_KEYS: Record<FormFieldType, string> = {
  text: "name",
  email: "email",
  phone: "phone",
  textarea: "message",
  select: "choice",
  checkbox: "consent",
};

type EditorState = {
  name: string;
  description: string;
  status: FormStatus;
  fields: FormField[];
  settings: FormSettings;
};

const newFieldId = () => `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function FormEditor({
  storeId,
  formId,
  initial,
  readOnly,
}: {
  storeId: string;
  formId: string;
  initial: EditorState;
  readOnly: boolean;
}) {
  const t = useTranslations("storeForms");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<EditorState>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const dirty = JSON.stringify(state) !== saved;
  const disabled = readOnly || isPending;

  const setField = (index: number, patch: Partial<FormField>) =>
    setState((s) => ({ ...s, fields: s.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)) }));

  const addField = (type: FormFieldType) =>
    setState((s) => {
      if (s.fields.length >= FORM_LIMITS.maxFields) return s;
      const keys = s.fields.map((f) => f.key);
      const field: FormField = {
        id: newFieldId(),
        type,
        key: fieldKeyFromLabel(DEFAULT_KEYS[type], keys, s.fields.length + 1),
        label: t(`types.${type}`),
        required: false,
        width: "full",
        ...(type === "select" ? { options: [t("editor.optionOne"), t("editor.optionTwo")] } : {}),
      };
      return { ...s, fields: [...s.fields, field] };
    });

  const moveField = (index: number, by: -1 | 1) =>
    setState((s) => {
      const next = [...s.fields];
      const target = index + by;
      if (target < 0 || target >= next.length) return s;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return { ...s, fields: next };
    });

  const removeField = (index: number) => setState((s) => ({ ...s, fields: s.fields.filter((_, i) => i !== index) }));

  const onSave = () => {
    const input = {
      name: state.name,
      description: state.description.trim() || null,
      status: state.status,
      fields: state.fields.map((f) => ({
        ...f,
        placeholder: f.placeholder?.trim() || undefined,
        helpText: f.helpText?.trim() || undefined,
        options: f.type === "select" ? (f.options ?? []).map((o) => o.trim()).filter(Boolean) : undefined,
      })),
      settings: state.settings,
    };
    const check = formInputSchema.safeParse(input);
    if (!check.success) {
      const issue = check.error.issues[0];
      const code = issue?.message;
      toast.error(
        code === "duplicate_key" ? t("editor.errorDuplicateKey") : code === "options_required" ? t("editor.errorOptions") : input.fields.length === 0 ? t("editor.errorNoFields") : t("editor.errorInvalid"),
      );
      return;
    }
    startTransition(async () => {
      const result = await saveForm(storeId, formId, input);
      if (result.success) {
        toast.success(t("editor.saved"));
        setSaved(JSON.stringify(state));
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });
  };

  return (
    <>
      <TextAction asChild className="sui-rise -mb-3 self-start">
        <Link href={`/stores/${storeId}/website/forms`}>
          <ArrowRight className="hidden rtl:block" aria-hidden />
          <ArrowLeft className="rtl:hidden" aria-hidden />
          {t("editor.back")}
        </Link>
      </TextAction>
      <PageHeader className="sui-rise" title={state.name || t("editor.title")} description={t("editor.settingsDescription")} />
      {readOnly && <Note>{t("readOnly")}</Note>}

      <SectionCard id="form-settings" icon={Settings2} title={t("editor.settingsTitle")}>
        <FieldRow>
          <Field label={t("editor.name")} htmlFor="form-name">
            <TextInput id="form-name" value={state.name} maxLength={120} disabled={disabled} onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))} />
          </Field>
          <Field label={t("editor.submitLabel")} htmlFor="form-submit">
            <TextInput
              id="form-submit"
              value={state.settings.submitLabel}
              placeholder={t("editor.submitLabelPlaceholder")}
              maxLength={60}
              disabled={disabled}
              onChange={(e) => setState((s) => ({ ...s, settings: { ...s.settings, submitLabel: e.target.value } }))}
            />
          </Field>
        </FieldRow>
        <Field label={t("editor.successMessage")} htmlFor="form-success">
          <TextArea
            id="form-success"
            value={state.settings.successMessage}
            placeholder={t("editor.successMessagePlaceholder")}
            maxLength={300}
            disabled={disabled}
            onChange={(e) => setState((s) => ({ ...s, settings: { ...s.settings, successMessage: e.target.value } }))}
          />
        </Field>
        <Field label={t("editor.description")} htmlFor="form-description">
          <TextInput
            id="form-description"
            value={state.description}
            placeholder={t("editor.descriptionPlaceholder")}
            maxLength={500}
            disabled={disabled}
            onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
          />
        </Field>
        <div className="flex items-center gap-3.5 rounded-[18px] border border-(--s-line) bg-(--s-tint) px-4 py-3.5">
          <Toggle
            aria-labelledby="form-active-title"
            checked={state.status === "active"}
            disabled={disabled}
            onCheckedChange={(checked) => setState((s) => ({ ...s, status: checked ? "active" : "disabled" }))}
          />
          <div className="min-w-0 flex-1">
            <b id="form-active-title" className="block text-sm font-bold text-(--s-text)">
              {t("editor.active")}
            </b>
            <small className="block text-pretty text-[12.5px] text-(--s-subtle)">{t("editor.activeHint")}</small>
          </div>
        </div>
      </SectionCard>

      <SectionCard id="form-fields" icon={ClipboardList} title={t("editor.fieldsTitle")} description={t("editor.fieldsDescription", { max: FORM_LIMITS.maxFields })}>
        {state.fields.length === 0 && <Note tone="amber">{t("editor.errorNoFields")}</Note>}
        <ol className="flex flex-col gap-3">
          {state.fields.map((field, index) => {
            const Icon = FIELD_ICONS[field.type];
            return (
              <li key={field.id} className="flex flex-col gap-3 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-4 max-[600px]:p-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-(--s-subtle)" aria-hidden />
                  <span className="text-xs font-semibold text-(--s-subtle)">{t(`types.${field.type}`)}</span>
                  <div className="ms-auto flex gap-0.5">
                    <IconButton disabled={disabled || index === 0} onClick={() => moveField(index, -1)} aria-label={t("editor.moveUp")}>
                      <ArrowUp aria-hidden />
                    </IconButton>
                    <IconButton disabled={disabled || index === state.fields.length - 1} onClick={() => moveField(index, 1)} aria-label={t("editor.moveDown")}>
                      <ArrowDown aria-hidden />
                    </IconButton>
                    <IconButton className="text-destructive hover:text-destructive" disabled={disabled} onClick={() => removeField(index)} aria-label={t("editor.removeField")}>
                      <Trash2 aria-hidden />
                    </IconButton>
                  </div>
                </div>
                <FieldRow>
                  <Field label={t("editor.label")} htmlFor={`${field.id}-label`}>
                    <TextInput id={`${field.id}-label`} value={field.label} maxLength={FORM_LIMITS.maxLabel} disabled={disabled} onChange={(e) => setField(index, { label: e.target.value })} />
                  </Field>
                  <Field label={t("editor.type")} htmlFor={`${field.id}-type`}>
                    <NativeSelect
                      id={`${field.id}-type`}
                      value={field.type}
                      disabled={disabled}
                      onChange={(e) => {
                        const type = e.target.value as FormFieldType;
                        setField(index, { type, options: type === "select" ? field.options ?? [t("editor.optionOne")] : undefined });
                      }}
                    >
                      {FORM_FIELD_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {t(`types.${type}`)}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  {field.type !== "checkbox" && (
                    <Field label={t("editor.placeholder")} htmlFor={`${field.id}-placeholder`}>
                      <TextInput id={`${field.id}-placeholder`} value={field.placeholder ?? ""} maxLength={200} disabled={disabled} onChange={(e) => setField(index, { placeholder: e.target.value })} />
                    </Field>
                  )}
                  <Field label={t("editor.helpText")} htmlFor={`${field.id}-help`}>
                    <TextInput id={`${field.id}-help`} value={field.helpText ?? ""} maxLength={300} disabled={disabled} onChange={(e) => setField(index, { helpText: e.target.value })} />
                  </Field>
                  {field.type === "select" && (
                    <Field className="col-span-full" label={t("editor.options")} htmlFor={`${field.id}-options`} note={t("editor.optionsHint")}>
                      <TextArea
                        id={`${field.id}-options`}
                        value={(field.options ?? []).join("\n")}
                        disabled={disabled}
                        onChange={(e) => setField(index, { options: e.target.value.split("\n").slice(0, FORM_LIMITS.maxOptions) })}
                      />
                    </Field>
                  )}
                  <Field label={t("editor.width")} htmlFor={`${field.id}-width`}>
                    <NativeSelect id={`${field.id}-width`} value={field.width} disabled={disabled} onChange={(e) => setField(index, { width: e.target.value === "half" ? "half" : "full" })}>
                      <option value="full">{t("editor.widthFull")}</option>
                      <option value="half">{t("editor.widthHalf")}</option>
                    </NativeSelect>
                  </Field>
                  <Field label={t("editor.key")} htmlFor={`${field.id}-key`} note={t("editor.keyHint")}>
                    <TextInput
                      id={`${field.id}-key`}
                      dir="ltr"
                      className="font-mono text-xs"
                      value={field.key}
                      maxLength={60}
                      disabled={disabled}
                      onChange={(e) => setField(index, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                    />
                  </Field>
                </FieldRow>
                <CheckRow label={t("editor.required")} checked={field.required} disabled={disabled} onChange={(e) => setField(index, { required: e.target.checked })} />
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-(--s-text)">
            <ListPlus className="size-4" aria-hidden />
            {t("editor.addField")}
          </p>
          <div className="flex flex-wrap gap-2">
            {FORM_FIELD_TYPES.map((type) => {
              const Icon = FIELD_ICONS[type];
              return (
                <SellerButton key={type} variant="mini" size="xs" disabled={disabled || state.fields.length >= FORM_LIMITS.maxFields} onClick={() => addField(type)}>
                  <Icon aria-hidden />
                  {t(`types.${type}`)}
                </SellerButton>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <SaveBar dirty={dirty} saving={isPending} saveDisabled={disabled} onSave={onSave} onDiscard={() => setState(JSON.parse(saved) as EditorState)} message={t("editor.unsaved")} saveLabel={t("editor.save")} />
    </>
  );
}
