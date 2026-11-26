"use client";

import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, CircleAlert, CircleCheck, Code, GripVertical, Loader2, PenLine, Plus, Trash2 } from "lucide-react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useStore } from "zustand";
import type { ComponentNode, SiteLocale } from "@workspace/store-sections";
import type { PropDefinition } from "@workspace/store-sections/render";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
import { Field, InspectorStoreProvider } from "../inspector/editor-inspector.client";
import type { EditorCategory, EditorForm, EditorProduct } from "../editor.dto";
import {
  LOCALIZED_SETTING_TYPES,
  addBlock,
  asLocalized,
  codeFileOf,
  labelText,
  listLimit,
  moveBlock,
  readBlocks,
  readCodeSchema,
  readSettings,
  removeBlock,
  setBlockSetting,
  setSetting,
  settingValue,
  withLocaleText,
  withPreviewProps,
  type CodeBlock,
  type CodeBlockDef,
  type CodeSettingDef,
} from "./code-file.lib";
import type { CodeIssueView } from "../adapter.types";
import { codeIssueLine, codeIssueText, type CodeIssueText, type CodeIssueTranslator } from "./code-issues.lib";
import { codePreviewInput } from "./code-preview.lib";
import { IDLE_PREVIEW_STORE, useCodePreview } from "./code-preview.client";

// CodeMirror loads only when the Code tab opens (never in the editor's first bundle).
const CodeEditor = lazy(() => import("./code-editor.client"));

type Catalog = { products: EditorProduct[]; categories: EditorCategory[]; forms: EditorForm[] };

/** Applies an update to the latest stored node; `key` groups quick edits of one field into one undo step. */
export type CodeNodeEdit = (update: (node: ComponentNode) => ComponentNode, key: string) => void;

const MAX_NAME_LENGTH = 80;

/**
 * The sidebar of a selected `code` node (F-101e): its Layers name, then
 * Content (fields built from the schema's settings, and its blocks) and Code
 * (the section file, checked and normalised by the host before it is kept).
 */
export function CodeNodeInspector({
  node,
  onEdit,
  locale,
  defaultLocale,
  uiLocale,
  catalog,
  storeId,
  readOnly,
  initialTab = "content",
}: {
  node: ComponentNode;
  onEdit: CodeNodeEdit;
  locale: SiteLocale;
  defaultLocale: SiteLocale;
  uiLocale: string;
  catalog: Catalog;
  storeId: string;
  readOnly: boolean;
  initialTab?: "content" | "code";
}) {
  const t = useTranslations("storeEditor.code");
  const [tab, setTab] = useState<"content" | "code">(initialTab);
  const mediaStore = useMemo(() => ({ storeId, readOnly }), [storeId, readOnly]);
  const name = typeof node.props.name === "string" ? node.props.name : "";

  return (
    <InspectorStoreProvider value={mediaStore}>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${node.id}-name`}>{t("name")}</Label>
          <Input
            id={`${node.id}-name`}
            value={name}
            maxLength={MAX_NAME_LENGTH}
            placeholder={t("namePlaceholder")}
            disabled={readOnly}
            onChange={(e) => {
              const value = e.target.value.slice(0, MAX_NAME_LENGTH);
              onEdit((n) => ({ ...n, props: setSetting(n.props, "name", value.trim() ? value : undefined) }), "name");
            }}
          />
        </div>
        <div role="tablist" aria-label={t("tabsLabel")} className="grid grid-cols-2 gap-0.5 rounded-xl bg-(--s-fill) p-[3px]">
          {(["content", "code"] as const).map((key) => {
            const TabIcon = key === "content" ? PenLine : Code;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "inline-flex h-8 items-center justify-center gap-1.5 rounded-[9px] text-[12.5px] font-semibold transition-colors",
                  tab === key ? "bg-(--s-surface) text-(--s-ink) shadow-[0_1px_3px_rgb(13_55_67/0.1)]" : "text-(--s-subtle) hover:text-(--s-ink)",
                )}
              >
                <TabIcon className="size-3.5" aria-hidden />
                {t(`tabs.${key}`)}
              </button>
            );
          })}
        </div>
        {tab === "content" ? (
          <CodeContent node={node} onEdit={onEdit} locale={locale} defaultLocale={defaultLocale} uiLocale={uiLocale} catalog={catalog} readOnly={readOnly} />
        ) : (
          <CodeTab node={node} onEdit={onEdit} readOnly={readOnly} />
        )}
      </div>
    </InspectorStoreProvider>
  );
}

// ---------------------------------------------------------------------------
// Content tab
// ---------------------------------------------------------------------------

type FieldTarget = { locale: SiteLocale; defaultLocale: SiteLocale; uiLocale: string; catalog: Catalog; readOnly: boolean };

/** The inspector field of a schema setting; null for a type the editor doesn't edit. */
export function propForSetting(def: CodeSettingDef, alignLabels: Record<"left" | "center" | "right", string>): PropDefinition | null {
  const key = def.id ?? "";
  const base = { key, label: { ar: labelText(def.label, "ar"), en: labelText(def.label, "en") } };
  const hint = def.info ? { hint: { ar: labelText(def.info, "ar"), en: labelText(def.info, "en") } } : {};
  const placeholder = def.placeholder ? { placeholder: { ar: labelText(def.placeholder, "ar"), en: labelText(def.placeholder, "en") } } : {};
  const options = (def.options ?? []).map((o) => ({ value: o.value, label: { ar: labelText(o.label, "ar"), en: labelText(o.label, "en") } }));
  switch (def.type) {
    case "text":
      return { ...base, ...hint, ...placeholder, type: "text", translatable: true };
    case "textarea":
    case "inline_richtext":
    case "richtext":
      return { ...base, ...hint, ...placeholder, type: "textarea", translatable: true };
    case "number":
      return { ...base, ...hint, type: "number", ...(def.min != null && { min: def.min }), ...(def.max != null && { max: def.max }) };
    case "checkbox":
      return { ...base, ...hint, type: "switch" };
    case "select":
    case "radio":
      return { ...base, ...hint, type: "select", options };
    case "text_alignment":
      return {
        ...base,
        ...hint,
        type: "select",
        options: (["left", "center", "right"] as const).map((value) => ({ value, label: { ar: alignLabels[value], en: alignLabels[value] } })),
      };
    case "color":
    case "color_background":
      return { ...base, ...hint, type: "color" };
    case "image_picker":
      return { ...base, ...hint, type: "image" };
    case "url":
    case "video_url":
      return { ...base, ...hint, ...placeholder, type: "url" };
    case "product":
      return { ...base, ...hint, type: "product" };
    case "product_list":
      return { ...base, ...hint, type: "products" };
    case "collection":
      return { ...base, ...hint, type: "category" };
    case "collection_list":
      return { ...base, ...hint, type: "categories" };
    default:
      return null;
  }
}

function SettingField({
  def,
  values,
  onChange,
  idPrefix,
  target,
}: {
  def: CodeSettingDef;
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
  idPrefix: string;
  target: FieldTarget;
}) {
  const t = useTranslations("storeEditor.code.content");
  const { locale, defaultLocale, uiLocale, catalog, readOnly } = target;
  if (def.type === "header") {
    return <h4 className="pt-1 text-xs font-semibold text-muted-foreground">{labelText(def.content, uiLocale)}</h4>;
  }
  if (def.type === "paragraph") return <p className="text-xs text-muted-foreground">{labelText(def.content, uiLocale)}</p>;
  if (!def.id) return null;
  const id = `${idPrefix}-${def.id}`;
  const localized = LOCALIZED_SETTING_TYPES.has(def.type);
  // As in the other inspectors: while translating, only text can change.
  const locked = readOnly || (locale !== defaultLocale && !localized);
  const value = settingValue(def, values);
  const settingId = def.id;
  const hint = labelText(def.info, uiLocale);

  if (def.type === "range") {
    const min = def.min ?? 0;
    const max = def.max ?? 100;
    const current = typeof value === "number" ? value : min;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={id}>{labelText(def.label, uiLocale)}</Label>
          <span dir="ltr" className="font-montserrat text-xs tabular-nums text-muted-foreground">
            {current}
            {def.unit ?? ""}
          </span>
        </div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={def.step ?? 1}
          value={current}
          disabled={locked}
          onChange={(e) => onChange(settingId, Number(e.target.value))}
          className="w-full accent-(--s-primary)"
        />
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }

  const prop = propForSetting(def, { left: t("align.left"), center: t("align.center"), right: t("align.right") });
  if (!prop) return null;
  const shown = localized ? asLocalized(value)[locale] : value;
  const write = (next: unknown) => {
    if (localized) return onChange(settingId, withLocaleText(value, locale, typeof next === "string" ? next : ""));
    if ((def.type === "product_list" || def.type === "collection_list") && Array.isArray(next)) return onChange(settingId, next.slice(0, listLimit(def)));
    // A cleared text field (a link, a colour) falls back to the default.
    onChange(settingId, next === "" ? undefined : next);
  };
  const field = <Field id={id} prop={prop} value={shown} onChange={write} uiLocale={uiLocale} catalog={catalog} />;
  if (prop.type === "switch") {
    return (
      <fieldset disabled={locked} className={cn("flex items-start justify-between gap-3", locked && "opacity-60")}>
        <div className="min-w-0 space-y-0.5">
          <Label htmlFor={id} className="text-sm font-normal">
            {labelText(def.label, uiLocale)}
          </Label>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {field}
      </fieldset>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{labelText(def.label, uiLocale)}</Label>
      <fieldset disabled={locked} className={locked ? "opacity-60" : undefined}>
        {field}
      </fieldset>
      {(def.type === "richtext" || def.type === "inline_richtext") && <p className="text-xs text-muted-foreground">{t("richTextHint")}</p>}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function CodeContent({
  node,
  onEdit,
  locale,
  defaultLocale,
  uiLocale,
  catalog,
  readOnly,
}: {
  node: ComponentNode;
  onEdit: CodeNodeEdit;
  locale: SiteLocale;
  defaultLocale: SiteLocale;
  uiLocale: string;
  catalog: Catalog;
  readOnly: boolean;
}) {
  const t = useTranslations("storeEditor.code.content");
  const tInspector = useTranslations("storeEditor.inspector");
  const schema = useMemo(() => readCodeSchema(node.props.schema), [node.props.schema]);
  const settings = readSettings(node.props.settings);
  const target: FieldTarget = { locale, defaultLocale, uiLocale, catalog, readOnly };
  const setSectionSetting = (id: string, value: unknown) =>
    onEdit((n) => ({ ...n, props: { ...n.props, settings: setSetting(readSettings(n.props.settings), id, value) } }), `setting:${id}`);

  return (
    <div className="space-y-4">
      {locale !== defaultLocale && <p className="rounded-md bg-muted p-2 text-xs">{tInspector("translating", { locale: locale.toUpperCase() })}</p>}
      {schema.settings.length === 0 && schema.blocks.length === 0 && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">{t("noSettings")}</p>
      )}
      {schema.settings.length > 0 && (
        <div className="space-y-4">
          {schema.settings.map((def, index) => (
            <SettingField key={def.id ?? `label-${index}`} def={def} values={settings} onChange={setSectionSetting} idPrefix={`${node.id}-s`} target={target} />
          ))}
        </div>
      )}
      {schema.blocks.length > 0 && <BlocksEditor node={node} blockDefs={schema.blocks} maxBlocks={schema.maxBlocks} onEdit={onEdit} target={target} />}
    </div>
  );
}

function BlocksEditor({
  node,
  blockDefs,
  maxBlocks,
  onEdit,
  target,
}: {
  node: ComponentNode;
  blockDefs: CodeBlockDef[];
  maxBlocks: number;
  onEdit: CodeNodeEdit;
  target: FieldTarget;
}) {
  const t = useTranslations("storeEditor.code.blocks");
  const blocks = readBlocks(node.props.blocks);
  const known = blocks.filter((b) => blockDefs.some((d) => d.type === b.type));
  const [open, setOpen] = useState<string | null>(null);
  const locked = target.readOnly || target.locale !== target.defaultLocale;
  const full = blocks.length >= maxBlocks;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const editBlocks = (update: (list: CodeBlock[]) => CodeBlock[], key: string) =>
    onEdit((n) => ({ ...n, props: { ...n.props, blocks: update(readBlocks(n.props.blocks)) } }), `blocks:${key}`);
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    editBlocks((list) => moveBlock(list, list.findIndex((b) => b.id === active.id), list.findIndex((b) => b.id === over.id)), "move");
  };

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 flex w-full items-center justify-between text-sm font-semibold">
        {t("title")}
        <span className="text-xs font-normal text-muted-foreground">
          {blocks.length}/{maxBlocks}
        </span>
      </legend>
      {known.length === 0 && <p className="text-xs text-muted-foreground">{t("empty")}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={known.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1.5">
            {known.map((block, index) => {
              const def = blockDefs.find((d) => d.type === block.type)!;
              const name = labelText(def.name, target.uiLocale) || block.type;
              return (
                <SortableBlock key={block.id} id={block.id} label={t("dragHandle", { name: `${name} ${index + 1}` })} disabled={locked}>
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    <button
                      type="button"
                      aria-expanded={open === block.id}
                      onClick={() => setOpen(open === block.id ? null : block.id)}
                      className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-start text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {name} <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      </span>
                      <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open === block.id && "rotate-180")} aria-hidden />
                    </button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      disabled={locked}
                      onClick={() => editBlocks((list) => removeBlock(list, block.id), `remove:${block.id}`)}
                      aria-label={t("remove", { name })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  {open === block.id && (
                    <div className="mt-2 w-full space-y-3 border-t pt-2">
                      {def.settings.length === 0 && <p className="text-xs text-muted-foreground">{t("noSettings")}</p>}
                      {def.settings.map((settingDef, i) => (
                        <SettingField
                          key={settingDef.id ?? `label-${i}`}
                          def={settingDef}
                          values={block.settings}
                          onChange={(id, value) => editBlocks((list) => setBlockSetting(list, block.id, id, value), `${block.id}:${id}`)}
                          idPrefix={`${node.id}-${block.id}`}
                          target={target}
                        />
                      ))}
                    </div>
                  )}
                </SortableBlock>
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
      <div className="flex flex-wrap gap-1.5">
        {blockDefs.map((def) => (
          <Button
            key={def.type}
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={locked || full}
            onClick={() => editBlocks((list) => addBlock(list, def, maxBlocks), "add")}
          >
            <Plus aria-hidden />
            {t("add", { name: labelText(def.name, target.uiLocale) || def.type })}
          </Button>
        ))}
      </div>
      {full && <p className="text-xs text-muted-foreground">{t("full")}</p>}
    </fieldset>
  );
}

function SortableBlock({ id, label, disabled, children }: { id: string; label: string; disabled: boolean; children: React.ReactNode }) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex flex-wrap items-center gap-1 rounded-lg border bg-(--s-surface) px-1.5 py-1", isDragging && "relative z-10 shadow-md")}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label={label}
        title={label}
        className="grid size-6 shrink-0 cursor-grab touch-none place-items-center rounded text-muted-foreground hover:text-foreground active:cursor-grabbing disabled:cursor-default disabled:opacity-40"
      >
        <GripVertical className="size-3.5" aria-hidden />
      </button>
      {children}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Code tab
// ---------------------------------------------------------------------------

function CodeTab({ node, onEdit, readOnly }: { node: ComponentNode; onEdit: CodeNodeEdit; readOnly: boolean }) {
  const t = useTranslations("storeEditor.code.editor");
  const tErrors = useTranslations("storeEditor.errors");
  const tCode = useTranslations("storeEditor.code") as unknown as CodeIssueTranslator;
  const preview = useCodePreview();
  const stored = useMemo(() => codeFileOf(node.props), [node.props]);
  const [draft, setDraft] = useState(stored);
  // The last stored file this tab knows (seen, or applied from a preview), so its own apply never resets the draft.
  const known = useRef(stored);
  const nodeRef = useRef(node);
  nodeRef.current = node;
  const runner = preview?.runner;

  // The stored file changed elsewhere (undo, redo): show it.
  useEffect(() => {
    if (stored === known.current) return;
    known.current = stored;
    setDraft(stored);
    runner?.resetFile(node.id);
  }, [stored, runner, node.id]);

  const check = useStore(preview?.store ?? IDLE_PREVIEW_STORE, (s) => s.files[node.id]);

  const onChange = (file: string) => {
    setDraft(file);
    if (!preview) return;
    if (file === known.current) {
      preview.runner.resetFile(node.id);
      return;
    }
    const current = nodeRef.current;
    preview.runner.editFile(
      { ...codePreviewInput(current, preview.target), file },
      (props) => {
        known.current = codeFileOf(props);
        onEdit((n) => withPreviewProps(n, props), "code");
      },
      (props) => codePreviewInput(withPreviewProps(current, props), preview.target),
    );
  };

  const issues = useMemo(() => check?.issues ?? [], [check?.issues]);
  // The editor's lint marks read in the seller's language too.
  const localized = useMemo(() => issues.map((issue) => ({ ...issue, message: codeIssueLine(tCode, issue) })), [issues, tCode]);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("help")}</p>
      <div dir="ltr" className="h-[420px] min-h-48 resize-y overflow-hidden rounded-lg border bg-background">
        <Suspense
          fallback={
            <p className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground" dir="auto">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("loading")}
            </p>
          }
        >
          <CodeEditor value={draft} onChange={onChange} issues={localized} readOnly={readOnly || !preview} label={t("label")} />
        </Suspense>
      </div>
      <CodeStatus status={check?.status} issues={issues} error={check?.error ? tErrors(check.error) : undefined} />
    </div>
  );
}

function CodeStatus({ status, issues, error }: { status?: "checking" | "ok" | "issues" | "error"; issues: readonly CodeIssueView[]; error?: string }) {
  const t = useTranslations("storeEditor.code.editor");
  const tCode = useTranslations("storeEditor.code") as unknown as CodeIssueTranslator;
  if (status === "checking") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        {t("checking")}
      </p>
    );
  }
  if (status === "ok") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400" aria-live="polite">
        <CircleCheck className="size-3.5" aria-hidden />
        {t("ok")}
      </p>
    );
  }
  if (status === "error") {
    return (
      <p className="flex items-start gap-1.5 text-xs text-destructive" role="alert">
        <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
        {error}
      </p>
    );
  }
  if (status !== "issues" || !issues.length) return null;
  return (
    <div className="space-y-1.5 rounded-lg border border-destructive/40 bg-destructive/5 p-2.5" role="alert">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
        <CircleAlert className="size-3.5" aria-hidden />
        {t("issuesTitle", { count: issues.length })}
      </p>
      <ul className="space-y-1">
        {issues.map((issue, index) => (
          <li key={index} className="text-xs">
            {issue.line != null && (
              <span className="me-1.5 font-semibold text-destructive">
                {issue.column != null ? t("lineColumn", { line: issue.line, column: issue.column }) : t("line", { line: issue.line })}
              </span>
            )}
            <IssueText {...codeIssueText(tCode, issue)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** An issue's localized line, then its technical detail or the host's English message (left to right, muted). */
function IssueText({ text, detail, fallback }: CodeIssueText) {
  const extra = detail ?? fallback;
  return (
    <>
      <span dir="auto">{text}</span>
      {extra && (
        <span dir="ltr" className="ms-1 break-words font-mono text-[11px] text-muted-foreground">
          {extra}
        </span>
      )}
    </>
  );
}
