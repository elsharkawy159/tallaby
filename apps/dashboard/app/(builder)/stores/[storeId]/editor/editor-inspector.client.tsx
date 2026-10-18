"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2, X } from "lucide-react";
import type { ComponentNode, SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  getElementDefinition,
  type AnySectionDefinition,
  type ItemCollectionDefinition,
  type Localized,
  type PropDefinition,
  isCustomSlotLayout,
  resetSlotLayout,
} from "@workspace/store-sections/render";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { MediaPicker } from "@/components/media/media-picker.client";
import type { EditorCategory, EditorForm, EditorProduct } from "./editor.data";
import { addItem, readItemProp, readProp, removeItem, setItemProp, setSectionProp } from "./editor.lib";
import { placeItem } from "./editor-slots.lib";
import { partField, readNodeProp, readPart, setNodeProp, writePart } from "./editor-selection.lib";

type Catalog = { products: EditorProduct[]; categories: EditorCategory[]; forms: EditorForm[] };

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
          <input type="color" aria-label={label(prop.label, uiLocale)} value={/^#[0-9a-f]{6}$/i.test(text) ? text : "#145163"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded border" />
          <Input id={id} dir="ltr" value={text} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          {inspectorStore && (
            <MediaPicker storeId={inspectorStore.storeId} readOnly={inspectorStore.readOnly} onPick={(asset) => onChange(asset.url)} />
          )}
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
    default:
      return (
        <div>
          <Input id={id} dir={prop.type === "url" ? "ltr" : undefined} value={text} maxLength={prop.maxLength} onChange={(e) => onChange(e.target.value)} />
          {prop.type === "text" && <Counter value={text} max={prop.maxLength} />}
        </div>
      );
  }
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
            <Button type="button" size="icon" variant="ghost" className="size-7" disabled={index === 0} onClick={() => onChange(moveIds(value, index, index - 1))} aria-label={t("moveUp")}>
              <ArrowUp className="size-3.5" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => onChange(value.filter((v) => v !== productId))} aria-label={t("remove")}>
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
              <Button type="button" size="icon" variant="ghost" className="size-7" disabled={index === 0} onClick={() => onChange(placeItem(instance, definition.key, index, index - 1))} aria-label={t("moveUp")}>
                <ArrowUp className="size-3.5" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="size-7" disabled={index === items.length - 1} onClick={() => onChange(placeItem(instance, definition.key, index, index + 1))} aria-label={t("moveDown")}>
                <ArrowDown className="size-3.5" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="size-7" disabled={target.locale !== target.defaultLocale} onClick={() => onChange(removeItem(instance, definition.key, index))} aria-label={t("remove")}>
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
        {definition.propDefinitions.map((prop) => {
          const editTarget = { ...target, translatable: prop.translatable };
          const fieldId = `${instance.id}-${prop.key}`;
          const locked = locale !== defaultLocale && !prop.translatable;
          return (
            <div key={prop.key} className="space-y-1.5">
              <Label htmlFor={fieldId}>{label(prop.label, uiLocale)}</Label>
              <fieldset disabled={locked} className={locked ? "opacity-60" : undefined}>
                <Field
                  id={fieldId}
                  prop={prop}
                  value={readProp(instance, prop.key, editTarget)}
                  onChange={(value) => onChange(setSectionProp(instance, prop.key, value, editTarget))}
                  uiLocale={uiLocale}
                  catalog={catalog}
                />
              </fieldset>
            </div>
          );
        })}
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
}: {
  node: ComponentNode;
  onChange: (node: ComponentNode) => void;
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
  return (
    <InspectorStore.Provider value={mediaStore}>
      <div className="space-y-4">
        {locale !== defaultLocale && <p className="rounded-md bg-muted p-2 text-xs">{t("translating", { locale: locale.toUpperCase() })}</p>}
        {definition.fields.length === 0 && <p className="text-sm text-muted-foreground">{t("styleOnly")}</p>}
        {definition.fields.map((prop) => {
          const target = { locale, defaultLocale, translatable: prop.translatable };
          const fieldId = `${node.id}-${prop.key}`;
          const locked = locale !== defaultLocale && !prop.translatable;
          return (
            <div key={prop.key} className="space-y-1.5">
              <Label htmlFor={fieldId}>{label(prop.label, uiLocale)}</Label>
              <fieldset disabled={locked} className={locked ? "opacity-60" : undefined}>
                <Field
                  id={fieldId}
                  prop={prop}
                  value={readNodeProp(node, prop.key, target)}
                  onChange={(value) => onChange(setNodeProp(node, prop.key, value, target))}
                  uiLocale={uiLocale}
                  catalog={catalog}
                />
              </fieldset>
            </div>
          );
        })}
      </div>
    </InspectorStore.Provider>
  );
}
