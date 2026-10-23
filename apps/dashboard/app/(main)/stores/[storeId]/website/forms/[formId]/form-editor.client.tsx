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
  LoaderCircle,
  Mail,
  Phone,
  Save,
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
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { BUTTON_CLASS, FIELD_CLASS, SectionCard, SMALL_BUTTON_CLASS, TEXTAREA_CLASS, ToggleRow } from "@/components/form/form-ui";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { cn } from "@/lib/utils";
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

const SELECT_CLASS = cn(FIELD_CLASS, "w-full rounded-md border bg-background px-2 text-sm");

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
    <div className="space-y-5">
      <PageActionBar
        title={
          <Button asChild variant="ghost" size="sm" className={SMALL_BUTTON_CLASS}>
            <Link href={`/stores/${storeId}/website/forms`}>
              <ArrowRight className="hidden rtl:block" />
              <ArrowLeft className="rtl:hidden" />
              {t("editor.back")}
            </Link>
          </Button>
        }
      >
        {dirty && <span className="text-xs text-muted-foreground">{t("editor.unsaved")}</span>}
        <Button type="button" className={BUTTON_CLASS} disabled={disabled || !dirty} onClick={onSave}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {t("editor.save")}
        </Button>
      </PageActionBar>
      {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}

      <SectionCard id="form-settings" icon={Settings2} title={t("editor.settingsTitle")} description={t("editor.settingsDescription")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="form-name">{t("editor.name")}</Label>
            <Input id="form-name" className={FIELD_CLASS} value={state.name} maxLength={120} disabled={disabled} onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="form-submit">{t("editor.submitLabel")}</Label>
            <Input
              id="form-submit"
              className={FIELD_CLASS}
              value={state.settings.submitLabel}
              placeholder={t("editor.submitLabelPlaceholder")}
              maxLength={60}
              disabled={disabled}
              onChange={(e) => setState((s) => ({ ...s, settings: { ...s.settings, submitLabel: e.target.value } }))}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="form-success">{t("editor.successMessage")}</Label>
            <Textarea
              id="form-success"
              className={TEXTAREA_CLASS}
              value={state.settings.successMessage}
              placeholder={t("editor.successMessagePlaceholder")}
              maxLength={300}
              disabled={disabled}
              onChange={(e) => setState((s) => ({ ...s, settings: { ...s.settings, successMessage: e.target.value } }))}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="form-description">{t("editor.description")}</Label>
            <Input
              id="form-description"
              className={FIELD_CLASS}
              value={state.description}
              placeholder={t("editor.descriptionPlaceholder")}
              maxLength={500}
              disabled={disabled}
              onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
            />
          </div>
        </div>
        <ToggleRow
          id="form-active"
          boxed
          checked={state.status === "active"}
          disabled={disabled}
          onCheckedChange={(checked) => setState((s) => ({ ...s, status: checked ? "active" : "disabled" }))}
          title={t("editor.active")}
          description={t("editor.activeHint")}
        />
      </SectionCard>

      <SectionCard id="form-fields" icon={ClipboardList} title={t("editor.fieldsTitle")} description={t("editor.fieldsDescription", { max: FORM_LIMITS.maxFields })}>
        {state.fields.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">{t("editor.errorNoFields")}</p>}
        <ol className="space-y-3">
          {state.fields.map((field, index) => {
            const Icon = FIELD_ICONS[field.type];
            return (
              <li key={field.id} className="space-y-3 rounded-xl border p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="text-xs font-medium text-muted-foreground">{t(`types.${field.type}`)}</span>
                  <div className="ms-auto flex gap-1">
                    <Button type="button" variant="ghost" size="icon" className="size-8" disabled={disabled || index === 0} onClick={() => moveField(index, -1)} aria-label={t("editor.moveUp")}>
                      <ArrowUp />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-8" disabled={disabled || index === state.fields.length - 1} onClick={() => moveField(index, 1)} aria-label={t("editor.moveDown")}>
                      <ArrowDown />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-8" disabled={disabled} onClick={() => removeField(index)} aria-label={t("editor.removeField")}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`${field.id}-label`}>{t("editor.label")}</Label>
                    <Input id={`${field.id}-label`} className={FIELD_CLASS} value={field.label} maxLength={FORM_LIMITS.maxLabel} disabled={disabled} onChange={(e) => setField(index, { label: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${field.id}-type`}>{t("editor.type")}</Label>
                    <select
                      id={`${field.id}-type`}
                      className={SELECT_CLASS}
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
                    </select>
                  </div>
                  {field.type !== "checkbox" && (
                    <div className="space-y-1.5">
                      <Label htmlFor={`${field.id}-placeholder`}>{t("editor.placeholder")}</Label>
                      <Input id={`${field.id}-placeholder`} className={FIELD_CLASS} value={field.placeholder ?? ""} maxLength={200} disabled={disabled} onChange={(e) => setField(index, { placeholder: e.target.value })} />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor={`${field.id}-help`}>{t("editor.helpText")}</Label>
                    <Input id={`${field.id}-help`} className={FIELD_CLASS} value={field.helpText ?? ""} maxLength={300} disabled={disabled} onChange={(e) => setField(index, { helpText: e.target.value })} />
                  </div>
                  {field.type === "select" && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`${field.id}-options`}>{t("editor.options")}</Label>
                      <Textarea
                        id={`${field.id}-options`}
                        className={TEXTAREA_CLASS}
                        value={(field.options ?? []).join("\n")}
                        disabled={disabled}
                        onChange={(e) => setField(index, { options: e.target.value.split("\n").slice(0, FORM_LIMITS.maxOptions) })}
                      />
                      <p className="text-xs text-muted-foreground">{t("editor.optionsHint")}</p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor={`${field.id}-width`}>{t("editor.width")}</Label>
                    <select id={`${field.id}-width`} className={SELECT_CLASS} value={field.width} disabled={disabled} onChange={(e) => setField(index, { width: e.target.value === "half" ? "half" : "full" })}>
                      <option value="full">{t("editor.widthFull")}</option>
                      <option value="half">{t("editor.widthHalf")}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${field.id}-key`}>{t("editor.key")}</Label>
                    <Input
                      id={`${field.id}-key`}
                      dir="ltr"
                      className={cn(FIELD_CLASS, "font-mono text-xs")}
                      value={field.key}
                      maxLength={60}
                      disabled={disabled}
                      onChange={(e) => setField(index, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                    />
                    <p className="text-xs text-muted-foreground">{t("editor.keyHint")}</p>
                  </div>
                </div>
                <ToggleRow id={`${field.id}-required`} checked={field.required} disabled={disabled} onCheckedChange={(required) => setField(index, { required })} title={t("editor.required")} />
              </li>
            );
          })}
        </ol>

        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <ListPlus className="size-4" aria-hidden />
            {t("editor.addField")}
          </p>
          <div className="flex flex-wrap gap-2">
            {FORM_FIELD_TYPES.map((type) => {
              const Icon = FIELD_ICONS[type];
              return (
                <Button key={type} type="button" variant="outline" size="sm" className={SMALL_BUTTON_CLASS} disabled={disabled || state.fields.length >= FORM_LIMITS.maxFields} onClick={() => addField(type)}>
                  <Icon />
                  {t(`types.${type}`)}
                </Button>
              );
            })}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
