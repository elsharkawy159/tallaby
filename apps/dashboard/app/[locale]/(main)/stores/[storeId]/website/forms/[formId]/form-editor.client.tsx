"use client";

import { useRef, useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlignLeft,
  ArrowLeft,
  ArrowRight,
  CheckSquare,
  ChevronDown,
  ChevronsUpDown,
  ClipboardList,
  Mail,
  MousePointerClick,
  Phone,
  Plus,
  Settings2,
  SlidersHorizontal,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { Field, FieldRow, IconButton, NativeSelect, Note, PageHeader, SaveBar, SectionCard, Segmented, SellerButton, TextArea, TextAction, TextInput, Toggle } from "@/components/seller-ui";
import { SortableList } from "@/components/form/sortable-list.client";
import { cn } from "@/lib/utils";
import { saveForm } from "../forms.server";
import { FormPreview } from "./form-preview.client";

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

/**
 * One store form (Website › Forms › Edit): fields first, as cards the seller
 * reorders by Drag & Drop, renames and marks required right on the card (the
 * rest sits under "More options"); then the button and thank-you text, then
 * the form's own settings. A live preview of the form as customers see it
 * sits beside the list (under it on a phone); clicking a field there opens
 * it. One sticky save bar saves everything.
 */
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
  const [openId, setOpenId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(state) !== saved;
  const disabled = readOnly || isPending;
  const full = state.fields.length >= FORM_LIMITS.maxFields;

  const setField = (id: string, patch: Partial<FormField>) =>
    setState((s) => ({ ...s, fields: s.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));

  const focusField = (id: string) => {
    setOpenId(id);
    // After the card has rendered (and opened), bring it into view with its label ready to type.
    requestAnimationFrame(() => {
      const input = listRef.current?.querySelector<HTMLInputElement>(`#${CSS.escape(`${id}-label`)}`);
      input?.scrollIntoView({ block: "center", behavior: "smooth" });
      input?.focus({ preventScroll: true });
    });
  };

  const addField = (type: FormFieldType) => {
    if (full) return;
    const keys = state.fields.map((f) => f.key);
    const field: FormField = {
      id: newFieldId(),
      type,
      key: fieldKeyFromLabel(DEFAULT_KEYS[type], keys, state.fields.length + 1),
      label: t(`types.${type}`),
      required: false,
      width: "full",
      ...(type === "select" ? { options: [t("editor.optionOne"), t("editor.optionTwo")] } : {}),
    };
    setState((s) => ({ ...s, fields: [...s.fields, field] }));
    focusField(field.id);
  };

  const removeField = (id: string) => setState((s) => ({ ...s, fields: s.fields.filter((f) => f.id !== id) }));

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
      // Open the field the problem is in, so the seller sees it at once.
      const index = issue?.path[0] === "fields" ? issue.path[1] : undefined;
      const bad = typeof index === "number" ? state.fields[index] : undefined;
      if (bad) focusField(bad.id);
      toast.error(
        code === "duplicate_key"
          ? t("editor.errorDuplicateKey")
          : code === "options_required"
            ? t("editor.errorOptions")
            : input.fields.length === 0
              ? t("editor.errorNoFields")
              : !input.name.trim()
                ? t("editor.errorName")
                : t("editor.errorInvalid"),
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

  const addMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SellerButton variant="mini" size="xs" disabled={disabled || full}>
          <Plus aria-hidden />
          {t("editor.addField")}
          <ChevronDown aria-hidden />
        </SellerButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {FORM_FIELD_TYPES.map((type) => {
          const Icon = FIELD_ICONS[type];
          return (
            <DropdownMenuItem key={type} className="items-start gap-2.5" onSelect={() => addField(type)}>
              <Icon className="mt-0.5 size-4 shrink-0 text-(--s-subtle)" aria-hidden />
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">{t(`types.${type}`)}</span>
                <span className="text-xs text-muted-foreground">{t(`editor.typeHints.${type}`)}</span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <TextAction asChild className="sui-rise -mb-3 self-start">
        <Link href={`/stores/${storeId}/website/forms`}>
          <ArrowRight className="hidden rtl:block" aria-hidden />
          <ArrowLeft className="rtl:hidden" aria-hidden />
          {t("editor.back")}
        </Link>
      </TextAction>
      <PageHeader
        className="sui-rise"
        title={state.name || t("editor.title")}
        description={t("editor.pageDescription")}
        actions={
          <Toggle
            label={state.status === "active" ? t("editor.active") : t("editor.inactive")}
            checked={state.status === "active"}
            disabled={disabled}
            onCheckedChange={(checked) => setState((s) => ({ ...s, status: checked ? "active" : "disabled" }))}
          />
        }
      />
      {readOnly && <Note>{t("readOnly")}</Note>}
      {state.status === "disabled" && <Note tone="amber">{t("editor.activeHint")}</Note>}

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-4 max-[960px]:grid-cols-1">
        <div ref={listRef} className="flex min-w-0 flex-col gap-4">
          <SectionCard
            id="form-fields"
            icon={ClipboardList}
            title={t("editor.fieldsTitle")}
            description={t("editor.fieldsDescription", { max: FORM_LIMITS.maxFields })}
            action={addMenu}
          >
            {state.fields.length === 0 && <Note tone="amber">{t("editor.errorNoFields")}</Note>}
            <SortableList
              id={`form-fields-${formId}`}
              items={state.fields}
              getId={(f) => f.id}
              handleLabel={(f) => t("editor.dragField", { field: f.label.trim() || t("editor.untitled") })}
              disabled={disabled}
              onReorder={(fields) => setState((s) => ({ ...s, fields }))}
              renderItem={(field, _index, { isDragging, handle }) => (
                <FieldCard
                  handle={handle}
                  field={field}
                  open={openId === field.id}
                  dragging={isDragging}
                  disabled={disabled}
                  onToggle={() => setOpenId((id) => (id === field.id ? null : field.id))}
                  onChange={(patch) => setField(field.id, patch)}
                  onRemove={() => removeField(field.id)}
                />
              )}
            />
            {state.fields.length > 1 && <p className="text-xs text-(--s-subtle)">{t("editor.dragHint")}</p>}
            {full && <Note>{t("editor.fieldsFull", { max: FORM_LIMITS.maxFields })}</Note>}
          </SectionCard>

          <SectionCard id="form-button" icon={MousePointerClick} title={t("editor.buttonTitle")} description={t("editor.buttonDescription")}>
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
          </SectionCard>

          <SectionCard id="form-settings" icon={Settings2} title={t("editor.settingsTitle")} description={t("editor.settingsDescription")}>
            <FieldRow>
              <Field label={t("editor.name")} htmlFor="form-name">
                <TextInput id="form-name" value={state.name} maxLength={120} disabled={disabled} onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))} />
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
            </FieldRow>
          </SectionCard>
        </div>

        <FormPreview
          className="sticky top-20 max-[960px]:static"
          fields={state.fields}
          settings={state.settings}
          off={state.status === "disabled"}
          onPick={disabled ? undefined : focusField}
        />
      </div>

      <SaveBar
        dirty={dirty}
        saving={isPending}
        saveDisabled={disabled}
        onSave={onSave}
        onDiscard={() => setState(JSON.parse(saved) as EditorState)}
        message={t("editor.unsaved")}
        saveLabel={t("editor.save")}
      />
    </>
  );
}

/** One field: grip, type, label and "Required" on the card; the rest under "More options". */
function FieldCard({
  handle,
  field,
  open,
  dragging,
  disabled,
  onToggle,
  onChange,
  onRemove,
}: {
  handle: React.ReactNode;
  field: FormField;
  open: boolean;
  dragging: boolean;
  disabled: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<FormField>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("storeForms");
  const Icon = FIELD_ICONS[field.type];

  return (
    <div className={cn("flex flex-col gap-3 rounded-[18px] border border-(--s-line) bg-(--s-surface) p-3", open && "border-(--tallaby-teal-300)", dragging && "shadow-lg")}>
      <div className="flex items-center gap-1.5">
        {handle}
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-(--s-fill) text-(--s-subtle)" title={t(`types.${field.type}`)}>
          <Icon className="size-4" aria-hidden />
        </span>
        <TextInput
          id={`${field.id}-label`}
          aria-label={t("editor.label")}
          className="h-9 min-w-0 flex-1"
          value={field.label}
          maxLength={FORM_LIMITS.maxLabel}
          disabled={disabled}
          placeholder={t("editor.untitled")}
          onChange={(e) => onChange({ label: e.target.value })}
        />
        <Toggle
          className="shrink-0 max-[600px]:hidden"
          label={t("editor.required")}
          checked={field.required}
          disabled={disabled}
          onCheckedChange={(required) => onChange({ required })}
        />
        <IconButton aria-expanded={open} onClick={onToggle} aria-label={open ? t("editor.lessOptions") : t("editor.moreOptions")}>
          <SlidersHorizontal aria-hidden />
        </IconButton>
        <IconButton className="text-destructive hover:text-destructive" disabled={disabled} onClick={onRemove} aria-label={t("editor.removeField")}>
          <Trash2 aria-hidden />
        </IconButton>
      </div>
      {/* On a phone the switch sits under the label, so the label keeps its width. */}
      <Toggle
        className="hidden self-start max-[600px]:inline-flex"
        label={t("editor.required")}
        checked={field.required}
        disabled={disabled}
        onCheckedChange={(required) => onChange({ required })}
      />

      {open && (
        <div className="flex flex-col gap-3 border-t border-(--s-line) pt-3">
          <FieldRow>
            <Field label={t("editor.type")} htmlFor={`${field.id}-type`}>
              <NativeSelect
                id={`${field.id}-type`}
                value={field.type}
                disabled={disabled}
                onChange={(e) => {
                  const type = e.target.value as FormFieldType;
                  onChange({ type, options: type === "select" ? (field.options ?? [t("editor.optionOne")]) : undefined });
                }}
              >
                {FORM_FIELD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("editor.width")}>
              <fieldset disabled={disabled} className="contents">
                <Segmented
                  label={t("editor.width")}
                  className="self-start max-[600px]:w-full"
                  value={field.width}
                  onChange={(width) => onChange({ width })}
                  options={[
                    { value: "full", label: t("editor.widthFull") },
                    { value: "half", label: t("editor.widthHalf") },
                  ]}
                />
              </fieldset>
            </Field>
            {field.type !== "checkbox" && (
              <Field label={t("editor.placeholder")} htmlFor={`${field.id}-placeholder`}>
                <TextInput id={`${field.id}-placeholder`} value={field.placeholder ?? ""} maxLength={200} disabled={disabled} onChange={(e) => onChange({ placeholder: e.target.value })} />
              </Field>
            )}
            <Field label={t("editor.helpText")} htmlFor={`${field.id}-help`}>
              <TextInput id={`${field.id}-help`} value={field.helpText ?? ""} maxLength={300} disabled={disabled} onChange={(e) => onChange({ helpText: e.target.value })} />
            </Field>
            {field.type === "select" && (
              <Field className="col-span-full" label={t("editor.options")} htmlFor={`${field.id}-options`} note={t("editor.optionsHint")}>
                <TextArea
                  id={`${field.id}-options`}
                  value={(field.options ?? []).join("\n")}
                  disabled={disabled}
                  onChange={(e) => onChange({ options: e.target.value.split("\n").slice(0, FORM_LIMITS.maxOptions) })}
                />
              </Field>
            )}
            <Field label={t("editor.key")} htmlFor={`${field.id}-key`} note={t("editor.keyHint")}>
              <TextInput
                id={`${field.id}-key`}
                dir="ltr"
                className="font-mono text-xs"
                value={field.key}
                maxLength={60}
                disabled={disabled}
                onChange={(e) => onChange({ key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
              />
            </Field>
          </FieldRow>
        </div>
      )}
    </div>
  );
}

