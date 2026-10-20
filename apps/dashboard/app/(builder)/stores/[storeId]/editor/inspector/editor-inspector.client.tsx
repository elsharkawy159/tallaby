"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronDown, CircleAlert, CircleCheck, ExternalLink, Plus, RotateCcw, Settings2, Trash2, X } from "lucide-react";
import type { ComponentNode, SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  DATA_BINDINGS,
  getElementDefinition,
  isDataList,
  presetsForSection,
  type AnySectionDefinition,
  type ItemCollectionDefinition,
  type Localized,
  type PropDefinition,
  isCustomSlotLayout,
  PALETTE_TYPES,
  createNode,
  isFieldShown,
  parseVideoUrl,
  resetSlotLayout,
  videoLinkProblem,
  videoPageUrl,
  videoStillUrl,
  type VideoProvider,
} from "@workspace/store-sections/render";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { MediaPicker } from "@/components/media/media-picker.client";
import { LayoutDiagram } from "./controls/layout-diagram.client";
import type { EditorCategory, EditorForm, EditorProduct } from "../server/editor.data";
import { applyPresetDesign, currentPreset, distinctDesigns, fieldGroups } from "@workspace/store-editor/lib/editor-library.lib";
import { addItem, newId, readItemProp, readProp, removeItem, setItemProp, setSectionProp } from "@workspace/store-editor/lib/editor.lib";
import { placeItem } from "@workspace/store-editor/lib/editor-slots.lib";
import { partField, readNodeProp, readPart, setNodeProp, writePart } from "@workspace/store-editor/lib/editor-selection.lib";

type Catalog = {
  products: EditorProduct[];
  categories: EditorCategory[];
  forms: EditorForm[];
  /** This seller's coupons for campaign pickers; undefined when not loaded. */
  coupons?: { id: string; label: string }[];
};

/** The store whose media library the image fields open (P4-09). */
const InspectorStore = createContext<{ storeId: string; readOnly: boolean } | null>(null);

const label = (value: Localized, locale: string) => (locale === "en" ? value.en : value.ar) || value.ar;

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Characters used / allowed, under text fields (like the reference). */
function Counter({ value, max }: { value: string; max?: number }) {
  if (!max) return null;
  return (
    <p className="mt-1 text-end text-xs tabular-nums text-muted-foreground" aria-live="polite">
      {value.length}/{max}
    </p>
  );
}

/** One field, by `PropDefinition.type`. */
export function Field({
  prop,
  value,
  onChange,
  uiLocale,
  catalog,
  id,
}: {
  prop: PropDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  uiLocale: string;
  catalog: Catalog;
  id: string;
}) {
  const t = useTranslations("storeEditor.inspector");
  const inspectorStore = useContext(InspectorStore);
  const text = typeof value === "string" ? value : "";

  switch (prop.type) {
    case "textarea":
      return (
        <div>
          <Textarea id={id} value={text} maxLength={prop.maxLength} rows={4} onChange={(e) => onChange(e.target.value)} />
          <Counter value={text} max={prop.maxLength} />
        </div>
      );
    case "number":
      return (
        <Input
          id={id}
          type="number"
          dir="ltr"
          min={prop.min}
          max={prop.max}
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      );
    case "switch":
      return <Switch id={id} checked={value === true} onCheckedChange={(checked) => onChange(checked)} />;
    case "select":
      if (isShortChoice(prop, uiLocale)) {
        return (
          <div id={id} role="radiogroup" aria-label={label(prop.label, uiLocale)} className="grid auto-cols-fr grid-flow-col rounded-md border bg-muted/40 p-0.5">
            {(prop.options ?? []).map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={option.value === text}
                onClick={() => onChange(option.value)}
                className={cn(
                  "truncate rounded px-1.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  option.value === text ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label(option.label, uiLocale)}
              </button>
            ))}
          </div>
        );
      }
      return (
        <select id={id} className={SELECT_CLASS} value={text} onChange={(e) => onChange(e.target.value)}>
          {(prop.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {label(option.label, uiLocale)}
            </option>
          ))}
        </select>
      );
    case "color":
      return (
        <div className="flex gap-2">
          <input
            type="color"
            aria-label={label(prop.label, uiLocale)}
            value={/^#[0-9a-f]{6}$/i.test(text) ? text : "#145163"}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-12 rounded border"
          />
          <Input id={id} dir="ltr" value={text} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          {inspectorStore && <MediaPicker storeId={inspectorStore.storeId} readOnly={inspectorStore.readOnly} onPick={(asset) => onChange(asset.url)} />}
          <Input id={id} dir="ltr" placeholder="https://…" value={text} onChange={(e) => onChange(e.target.value)} />
          {/^https?:\/\//.test(text) && (
            // eslint-disable-next-line @next/next/no-img-element -- seller-entered preview
            <img src={text} alt="" className="h-20 w-full rounded-md border object-cover" />
          )}
          <p className="text-xs text-muted-foreground">{t("imageHint")}</p>
        </div>
      );
    case "category":
      return (
        <select id={id} className={SELECT_CLASS} value={text} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">{t("chooseCategory")}</option>
          {catalog.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {label(category.name, uiLocale)} ({category.productCount})
            </option>
          ))}
        </select>
      );
    case "product":
      return (
        <select id={id} className={SELECT_CLASS} value={text} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">{t("chooseProduct")}</option>
          {catalog.products.map((product) => (
            <option key={product.id} value={product.id}>
              {label(product.title, uiLocale)}
            </option>
          ))}
        </select>
      );
    case "form":
      // Only this store's forms (loaded for the session seller); the storefront also resolves the id for its own store only.
      return (
        <div className="space-y-1.5">
          <select id={id} className={SELECT_CLASS} value={text} onChange={(e) => onChange(e.target.value)}>
            <option value="">{t("chooseForm")}</option>
            {catalog.forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.active ? form.name : t("formDisabled", { name: form.name })}
              </option>
            ))}
          </select>
          {/* Relative to /stores/[storeId]/editor → /stores/[storeId]/website/forms */}
          <a href="website/forms" target="_blank" rel="noopener" className="text-xs text-primary underline-offset-2 hover:underline">
            {t("manageForms")}
          </a>
        </div>
      );
    case "products":
      return <ProductsPicker id={id} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} catalog={catalog} uiLocale={uiLocale} />;
    case "categories":
      return (
        <OrderedPicker
          id={id}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          options={catalog.categories.map((c) => ({ id: c.id, label: label(c.name, uiLocale) }))}
          placeholder={t("searchCategories")}
          missing={t("missingCategory")}
        />
      );
    case "coupon":
      // Only this seller's coupons; the storefront resolves the id for its own seller and hides inactive or expired ones.
      return (
        <div className="space-y-1.5">
          <select id={id} className={SELECT_CLASS} value={text} onChange={(e) => onChange(e.target.value)}>
            <option value="">{t("chooseCoupon")}</option>
            {(catalog.coupons ?? []).map((coupon) => (
              <option key={coupon.id} value={coupon.id}>
                {coupon.label}
              </option>
            ))}
          </select>
          {catalog.coupons !== undefined && catalog.coupons.length === 0 && <p className="text-xs text-muted-foreground">{t("noCoupons")}</p>}
        </div>
      );
    case "datetime":
      return <DateTimeField id={id} value={text} onChange={onChange} />;
    case "layout":
      return <LayoutPicker id={id} prop={prop} value={text} onChange={onChange} uiLocale={uiLocale} />;
    case "video":
      return <VideoField id={id} value={text} onChange={onChange} placeholder={prop.placeholder ? label(prop.placeholder, uiLocale) : undefined} />;
    default:
      return (
        <div>
          <Input id={id} dir={prop.type === "url" ? "ltr" : undefined} value={text} maxLength={prop.maxLength} onChange={(e) => onChange(e.target.value)} />
          {prop.type === "text" && <Counter value={text} max={prop.maxLength} />}
        </div>
      );
  }
}

/** Up to four options with short labels fit a button group instead of a dropdown. */
function isShortChoice(prop: PropDefinition, uiLocale: string): boolean {
  const options = prop.options ?? [];
  return options.length > 1 && options.length <= 4 && options.every((o) => label(o.label, uiLocale).length <= 14);
}

const PROVIDER_NAMES: Record<VideoProvider, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  file: "MP4",
};

/**
 * A video link with a live check: which site it is from (with YouTube's
 * still), why it can't be used (a share short link), and a tip for vertical videos.
 */
function VideoField({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (value: unknown) => void; placeholder?: string }) {
  const t = useTranslations("storeEditor.inspector.video");
  const source = parseVideoUrl(value);
  const problem = videoLinkProblem(value);
  const still = source ? videoStillUrl(source) : null;
  const vertical = source && ((source.provider === "youtube" && source.short) || source.provider === "tiktok" || source.provider === "instagram" || (source.provider === "facebook" && source.kind === "reel"));
  return (
    <div className="space-y-2">
      <Input id={id} dir="ltr" inputMode="url" placeholder={placeholder} value={value} maxLength={2048} onChange={(e) => onChange(e.target.value.trim())} />
      {problem && (
        <p className="flex items-start gap-1.5 text-xs text-destructive">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {t(problem === "short-link" ? "shortLink" : "invalid")}
        </p>
      )}
      {source && (
        <div className="flex items-center gap-2.5 rounded-md border p-1.5">
          {still ? (
            // eslint-disable-next-line @next/next/no-img-element -- the site's own still
            <img src={still} alt="" className="h-10 w-16 shrink-0 rounded object-cover" />
          ) : (
            <span className="grid h-10 w-16 shrink-0 place-items-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
              {PROVIDER_NAMES[source.provider]}
            </span>
          )}
          <p className="flex min-w-0 flex-1 items-center gap-1 text-xs font-medium">
            <CircleCheck className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span className="truncate">{t("found", { site: PROVIDER_NAMES[source.provider] })}</span>
          </p>
          <a
            href={videoPageUrl(source)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("open")}
            title={t("open")}
            className="grid size-7 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      )}
      {vertical && <p className="text-xs text-muted-foreground">{t("verticalHint")}</p>}
      {source?.provider === "instagram" && <p className="text-xs text-muted-foreground">{t("instagramHint")}</p>}
    </div>
  );
}

/**
 * One inspector field: label, control and hint. Switches sit on the label's
 * line so on/off options read as a compact list.
 */
function FieldRow({ prop, id, locked, uiLocale, children }: { prop: PropDefinition; id: string; locked: boolean; uiLocale: string; children: React.ReactNode }) {
  const hint = prop.hint ? label(prop.hint, uiLocale) : null;
  if (prop.type === "switch") {
    return (
      <fieldset disabled={locked} className={cn("flex items-start justify-between gap-3", locked && "opacity-60")}>
        <div className="min-w-0 space-y-0.5">
          <Label htmlFor={id} className="text-sm font-normal">
            {label(prop.label, uiLocale)}
          </Label>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {children}
      </fieldset>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label(prop.label, uiLocale)}</Label>
      <fieldset disabled={locked} className={locked ? "opacity-60" : undefined}>
        {children}
      </fieldset>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Ordered pick of this store's products (P4-07). */
function ProductsPicker({
  id,
  value,
  onChange,
  catalog,
  uiLocale,
}: {
  id: string;
  value: string[];
  onChange: (value: unknown) => void;
  catalog: Catalog;
  uiLocale: string;
}) {
  const t = useTranslations("storeEditor.inspector");
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(catalog.products.map((p) => [p.id, p])), [catalog.products]);
  const matches = catalog.products
    .filter((p) => !value.includes(p.id))
    .filter((p) => !query || `${p.title.ar} ${p.title.en}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);
  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {value.map((productId, index) => (
          <li key={productId} className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm">
            <span className="min-w-0 flex-1 truncate">{byId.get(productId) ? label(byId.get(productId)!.title, uiLocale) : t("missingProduct")}</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7"
              disabled={index === 0}
              onClick={() => onChange(moveIds(value, index, index - 1))}
              aria-label={t("moveUp")}
            >
              <ArrowUp className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={() => onChange(value.filter((v) => v !== productId))}
              aria-label={t("remove")}
            >
              <X className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>
      <Input id={id} placeholder={t("searchProducts")} value={query} onChange={(e) => setQuery(e.target.value)} />
      {matches.length > 0 && (
        <ul className="max-h-48 overflow-auto rounded-md border">
          {matches.map((product) => (
            <li key={product.id}>
              <button type="button" className="w-full px-2 py-1.5 text-start text-sm hover:bg-muted" onClick={() => onChange([...value, product.id])}>
                {label(product.title, uiLocale)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Ordered pick from a list (categories); same controls as the product picker. */
function OrderedPicker({
  id,
  value,
  onChange,
  options,
  placeholder,
  missing,
}: {
  id: string;
  value: string[];
  onChange: (value: unknown) => void;
  options: { id: string; label: string }[];
  placeholder: string;
  missing: string;
}) {
  const t = useTranslations("storeEditor.inspector");
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const matches = options.filter((o) => !value.includes(o.id) && (!query || o.label.toLowerCase().includes(query.toLowerCase()))).slice(0, 8);
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((itemId, index) => (
            <li key={itemId} className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm">
              <span className="min-w-0 flex-1 truncate">{byId.get(itemId)?.label ?? missing}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7"
                disabled={index === 0}
                onClick={() => onChange(moveIds(value, index, index - 1))}
                aria-label={t("moveUp")}
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => onChange(value.filter((v) => v !== itemId))}
                aria-label={t("remove")}
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Input id={id} placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
      {matches.length > 0 && (
        <ul className="max-h-48 overflow-auto rounded-md border">
          {matches.map((option) => (
            <li key={option.id}>
              <button type="button" className="w-full px-2 py-1.5 text-start text-sm hover:bg-muted" onClick={() => onChange([...value, option.id])}>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A local date and time, stored as an ISO instant (empty clears it). */
function DateTimeField({ id, value, onChange }: { id: string; value: string; onChange: (value: unknown) => void }) {
  const t = useTranslations("storeEditor.inspector");
  const date = value ? new Date(value) : null;
  const local = date && !Number.isNaN(date.getTime()) ? new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "";
  const past = date !== null && !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
  return (
    <div className="space-y-1">
      <Input id={id} type="datetime-local" dir="ltr" value={local} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")} />
      <p className={past ? "text-xs text-amber-700 dark:text-amber-400" : "text-xs text-muted-foreground"}>{past ? t("datePast") : t("dateHint")}</p>
    </div>
  );
}

/** Visual picker for `layout` fields: one small diagram per option. */
function LayoutPicker({
  id,
  prop,
  value,
  onChange,
  uiLocale,
}: {
  id: string;
  prop: PropDefinition;
  value: string;
  onChange: (value: unknown) => void;
  uiLocale: string;
}) {
  return (
    <div id={id} role="radiogroup" aria-label={label(prop.label, uiLocale)} className="grid grid-cols-3 gap-1.5">
      {(prop.options ?? []).map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md border p-1.5 text-[11px] leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-foreground bg-muted text-foreground" : "text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            <LayoutDiagram name={option.diagram ?? option.value} className="h-8 w-full" />
            <span className="line-clamp-2 text-center">{label(option.label, uiLocale)}</span>
          </button>
        );
      })}
    </div>
  );
}

function moveIds(list: string[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

function Collection({
  definition,
  instance,
  onChange,
  target,
  uiLocale,
  catalog,
}: {
  definition: ItemCollectionDefinition;
  instance: SectionInstance;
  onChange: (instance: SectionInstance) => void;
  target: { locale: SiteLocale; defaultLocale: SiteLocale };
  uiLocale: string;
  catalog: Catalog;
}) {
  const t = useTranslations("storeEditor.inspector");
  const items = Array.isArray(instance.props[definition.key]) ? (instance.props[definition.key] as unknown[]) : [];
  const max = definition.maxItems ?? 50;
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 flex w-full items-center justify-between text-sm font-semibold">
        {label(definition.label, uiLocale)}
        <span className="text-xs font-normal text-muted-foreground">
          {items.length}/{max}
        </span>
      </legend>
      {items.map((_, index) => (
        <div key={index} className="space-y-2 rounded-lg border p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">#{index + 1}</span>
            <div className="flex">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7"
                disabled={index === 0}
                onClick={() => onChange(placeItem(instance, definition.key, index, index - 1))}
                aria-label={t("moveUp")}
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7"
                disabled={index === items.length - 1}
                onClick={() => onChange(placeItem(instance, definition.key, index, index + 1))}
                aria-label={t("moveDown")}
              >
                <ArrowDown className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7"
                disabled={target.locale !== target.defaultLocale}
                onClick={() => onChange(removeItem(instance, definition.key, index))}
                aria-label={t("remove")}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
          {definition.itemPropDefinitions.map((prop) => {
            const editTarget = { ...target, translatable: prop.translatable };
            const fieldId = `${instance.id}-${definition.key}-${index}-${prop.key}`;
            const locked = target.locale !== target.defaultLocale && !prop.translatable;
            return (
              <div key={prop.key} className="space-y-1">
                <Label htmlFor={fieldId} className="text-xs">
                  {label(prop.label, uiLocale)}
                </Label>
                <fieldset disabled={locked}>
                  <Field
                    id={fieldId}
                    prop={prop}
                    value={readItemProp(instance, definition.key, index, prop.key, editTarget)}
                    onChange={(value) => onChange(setItemProp(instance, definition.key, index, prop.key, value, editTarget))}
                    uiLocale={uiLocale}
                    catalog={catalog}
                  />
                </fieldset>
              </div>
            );
          })}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={items.length >= max || target.locale !== target.defaultLocale}
        onClick={() => onChange(addItem(instance, definition.key, definition.newItemTemplate(), max))}
      >
        <Plus aria-hidden />
        {t("addItem")}
      </Button>
    </fieldset>
  );
}

/** A titled group of inspector fields (Design, Data, Content, Options). */
function FieldGroup({ title, children }: { title: string | null; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      {title && <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>}
      {children}
    </section>
  );
}

/** Field id of a part in the full inspector (`items.2.title` → `<id>-items-2-title`). */
const partFieldId = (instanceId: string, part: string) => `${instanceId}-${part.replaceAll(".", "-")}`;

/** Properties of the selected section, generated from its definition. */
export function SectionInspector({
  definition,
  instance,
  onChange,
  locale,
  defaultLocale,
  uiLocale,
  catalog,
  storeId,
  readOnly = false,
  focusPart,
  onlyPart = false,
}: {
  definition: AnySectionDefinition;
  instance: SectionInstance;
  onChange: (instance: SectionInstance) => void;
  locale: SiteLocale;
  defaultLocale: SiteLocale;
  uiLocale: string;
  catalog: Catalog;
  storeId: string;
  readOnly?: boolean;
  /** The part clicked on the canvas: its field is focused (P4B-04). */
  focusPart?: string;
  /** Show only the focused part's field ("Selected element only"). */
  onlyPart?: boolean;
}) {
  const t = useTranslations("storeEditor.inspector");
  const target = { locale, defaultLocale };
  const mediaStore = useMemo(() => ({ storeId, readOnly }), [storeId, readOnly]);
  const focusedField = partField(definition, focusPart);
  const groups = fieldGroups(definition, instance.props);
  const designs = useMemo(() => distinctDesigns(presetsForSection(definition.id)), [definition.id]);
  const activeDesign = currentPreset(instance, designs);

  const renderField = (prop: PropDefinition) => {
    const editTarget = { ...target, translatable: prop.translatable };
    const fieldId = `${instance.id}-${prop.key}`;
    const locked = locale !== defaultLocale && !prop.translatable;
    return (
      <FieldRow key={prop.key} prop={prop} id={fieldId} locked={locked} uiLocale={uiLocale}>
        <Field
          id={fieldId}
          prop={prop}
          value={readProp(instance, prop.key, editTarget)}
          onChange={(value) => onChange(setSectionProp(instance, prop.key, value, editTarget))}
          uiLocale={uiLocale}
          catalog={catalog}
        />
      </FieldRow>
    );
  };

  useEffect(() => {
    if (!focusPart) return;
    const element = document.getElementById(partFieldId(instance.id, focusPart));
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) element.focus({ preventScroll: true });
    // Only when the clicked part changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusPart, instance.id]);

  if (onlyPart && focusPart && focusedField) {
    const locked = locale !== defaultLocale && !focusedField.translatable;
    const fieldId = partFieldId(instance.id, focusPart);
    return (
      <InspectorStore.Provider value={mediaStore}>
        <div className="space-y-1.5">
          <Label htmlFor={fieldId}>{label(focusedField.label, uiLocale)}</Label>
          <fieldset disabled={locked} className={locked ? "opacity-60" : undefined}>
            <Field
              id={fieldId}
              prop={focusedField}
              value={readPart(instance, focusPart, focusedField, target)}
              onChange={(value) => onChange(writePart(instance, focusPart, focusedField, value, target))}
              uiLocale={uiLocale}
              catalog={catalog}
            />
          </fieldset>
        </div>
      </InspectorStore.Provider>
    );
  }

  return (
    <InspectorStore.Provider value={mediaStore}>
      <div className="space-y-4">
        {locale !== defaultLocale && <p className="rounded-md bg-muted p-2 text-xs">{t("translating", { locale: locale.toUpperCase() })}</p>}
        {definition.propDefinitions.length === 0 && !definition.itemCollections?.length && (
          <p className="text-sm text-muted-foreground">{t("nothingToEdit")}</p>
        )}
        {(designs.length > 1 || groups.design.length > 0) && (
          <FieldGroup title={t("groups.design")}>
            {designs.length > 1 && (
              <div role="radiogroup" aria-label={t("designs")} className="flex flex-wrap gap-1.5">
                {designs.map((preset) => {
                  const active = preset.id === activeDesign?.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={locale !== defaultLocale}
                      onClick={() => onChange(applyPresetDesign(instance, preset))}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                        active ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                      )}
                    >
                      {label(preset.name, uiLocale)}
                    </button>
                  );
                })}
              </div>
            )}
            {groups.design.map(renderField)}
          </FieldGroup>
        )}
        {groups.data.length > 0 && <FieldGroup title={t("groups.data")}>{groups.data.map(renderField)}</FieldGroup>}
        {groups.content.length > 0 && (
          <FieldGroup title={groups.data.length || groups.design.length || designs.length > 1 ? t("groups.content") : null}>
            {groups.content.map(renderField)}
          </FieldGroup>
        )}
        {groups.options.length > 0 && <FieldGroup title={t("groups.options")}>{groups.options.map(renderField)}</FieldGroup>}
        {definition.itemCollections?.map((collection) => (
          <Collection
            key={collection.key}
            definition={collection}
            instance={instance}
            onChange={onChange}
            target={target}
            uiLocale={uiLocale}
            catalog={catalog}
          />
        ))}
        {definition.slots?.length ? (
          // Parts are moved on the canvas (P4B-16); here the seller can go back to the default order.
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-2.5">
            <p className="text-xs text-muted-foreground">{t("partsHint")}</p>
            {isCustomSlotLayout(instance, definition.slots) && (
              <Button type="button" size="sm" variant="outline" className="h-7 shrink-0" onClick={() => onChange(resetSlotLayout(instance, definition.slots!))}>
                <RotateCcw className="size-3.5" aria-hidden />
                {t("resetLayout")}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </InspectorStore.Provider>
  );
}

/** Record fields a node inside a data list can show (`storeEditor.inspector.boundFields`). */
const BOUND_FIELDS: ReadonlySet<string> = new Set(Object.values(DATA_BINDINGS).flat());

/** Content fields of the selected element of a custom section (P4B-07). */
export function ElementInspector({
  node,
  onChange,
  locale,
  defaultLocale,
  uiLocale,
  catalog,
  storeId,
  readOnly = false,
  onOpenStyle,
}: {
  node: ComponentNode;
  onChange: (node: ComponentNode) => void;
  /** Switches the sidebar to Style (elements with no content fields). */
  onOpenStyle?: () => void;
  locale: SiteLocale;
  defaultLocale: SiteLocale;
  uiLocale: string;
  catalog: Catalog;
  storeId: string;
  readOnly?: boolean;
}) {
  const t = useTranslations("storeEditor.inspector");
  const definition = getElementDefinition(node.type);
  const mediaStore = useMemo(() => ({ storeId, readOnly }), [storeId, readOnly]);
  if (!definition) return null;

  // Fields that only apply to another choice (a category when the source is "from a category").
  // …and options the element's current choice can't use (a video site's unsupported player options).
  const values = { ...definition.defaultProps, ...node.props };
  const shown = definition.fields.filter((prop) => isFieldShown(prop, values) && !definition.hideField?.(prop.key, values));
  const main = shown.filter((p) => p.group !== "advanced" && p.group !== "data");
  const data = shown.filter((p) => p.group === "data");
  const advanced = shown.filter((p) => p.group === "advanced");
  const renderField = (prop: PropDefinition) => {
    const target = { locale, defaultLocale, translatable: prop.translatable };
    const fieldId = node.id + "-" + prop.key;
    return (
      <FieldRow key={prop.key} prop={prop} id={fieldId} locked={locale !== defaultLocale && !prop.translatable} uiLocale={uiLocale}>
        <Field
          id={fieldId}
          prop={prop}
          value={readNodeProp(node, prop.key, target) ?? definition.defaultProps[prop.key]}
          onChange={(value) => onChange(setNodeProp(node, prop.key, value, target))}
          uiLocale={uiLocale}
          catalog={catalog}
        />
      </FieldRow>
    );
  };
  // Items that only live in this element (playlist videos) are added here, not from the palette.
  const itemType = definition.childTypes?.length === 1 && !PALETTE_TYPES.includes(definition.childTypes[0]!) ? definition.childTypes[0]! : null;
  const itemDefinition = itemType ? getElementDefinition(itemType) : undefined;

  return (
    <InspectorStore.Provider value={mediaStore}>
      <div className="space-y-5">
        {locale !== defaultLocale && <p className="rounded-md bg-muted p-2 text-xs">{t("translating", { locale: locale.toUpperCase() })}</p>}
        {isDataList(node.type) && <p className="rounded-md bg-muted p-2 text-xs">{t("listTemplate")}</p>}
        {typeof node.props.bind === "string" && BOUND_FIELDS.has(node.props.bind) && (
          <p className="rounded-md bg-muted p-2 text-xs">{t("boundField", { field: t(`boundFields.${node.props.bind}`) })}</p>
        )}
        {definition.fields.length === 0 && (
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            <p>{t("styleOnly")}</p>
            {onOpenStyle && (
              <Button type="button" variant="link" size="sm" className="mt-1 h-auto p-0" onClick={onOpenStyle}>
                {t("openStyle")}
              </Button>
            )}
          </div>
        )}
        {main.length > 0 && <div className="space-y-4">{main.map(renderField)}</div>}
        {data.length > 0 && <FieldGroup title={t("groups.data")}>{data.map(renderField)}</FieldGroup>}
        {itemType && itemDefinition && (
          <div className="space-y-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={readOnly || locale !== defaultLocale}
              onClick={() => onChange({ ...node, children: [...node.children, createNode(itemType, () => newId("n"))] })}
            >
              <Plus aria-hidden />
              {t("addChild", { name: label(itemDefinition.label, uiLocale) })}
            </Button>
            <p className="text-xs text-muted-foreground">{t("addChildHint")}</p>
          </div>
        )}
        {advanced.length > 0 && (
          <details className="group rounded-lg border">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <Settings2 className="size-4 text-muted-foreground" aria-hidden />
              <span className="flex-1">{t("advanced")}</span>
              <span className="text-xs font-normal text-muted-foreground">{t("advancedCount", { count: advanced.length })}</span>
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="space-y-4 border-t px-3 py-3">{advanced.map(renderField)}</div>
          </details>
        )}
      </div>
    </InspectorStore.Provider>
  );
}
