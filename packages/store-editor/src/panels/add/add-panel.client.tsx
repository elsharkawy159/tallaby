"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Clock, Flame, Search } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { useStore } from "zustand";
import type { DesignSystem, SiteLocale } from "@workspace/store-sections";
import {
  LAYOUT_PRESETS,
  getElementDefinition,
  type DataNeed,
  type ElementType,
  type LayoutPreset,
  type ContentItemSummary,
  type RenderContext,
} from "@workspace/store-sections/render";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import type { TemplateCardView } from "../../templates.dto";
import type { DragPayload } from "../../dnd/dnd.types";
import { useDragData } from "../../dnd/editor-dnd.client";
import type { EditorCommands } from "../../lib/editor-commands.lib";
import type { PreviewCatalog } from "../../preview/site-preview.client";
import { ELEMENT_ICONS, PRESET_ICONS } from "../../lib/editor-icons.lib";
import { matchesSearch, mostUsedItems, recentItems, recordUse, type PaletteKey } from "../../lib/editor-palette.lib";
import type { EditorStore } from "../../state/editor.store";
import { PageTemplatesTab } from "./page-templates.client";
import { SectionLibrary } from "./section-library.client";
import type { TemplatePreviewHost } from "./template-preview-dialog.client";
import { useEditorAdapter } from "../../adapter.client";
import { addTabs } from "../../shell/capabilities.lib";
import { offeredElementGroups, offeredPaletteTypes, offersProductParts } from "../../lib/editor-pages.lib";

const pick = (value: { ar: string; en: string }, locale: string) => (locale === "en" ? value.en : value.ar) || value.ar;

type Item = { key: PaletteKey; label: string; icon: ReactNode; keywords: string[]; run: () => void; payload: DragPayload };

/**
 * Add panel (P4B-03/07/12), like the reference elements/layouts palette:
 * Elements (search, Recent, Most used, Layouts, element groups), Sections
 * (every section by category, with live previews) and Templates (designs
 * for the page being edited, and whole-site templates). Items are dragged
 * onto the canvas, or clicked (Enter) to insert after the selection;
 * nothing here writes outside the editor store.
 */
export function AddPanel({
  store,
  commands,
  uiLocale,
  preview,
  templates,
  templateHost,
}: {
  store: EditorStore;
  commands: EditorCommands;
  uiLocale: string;
  preview: SectionPreviewHost;
  templates: { currentKey: string; items: TemplateCardView[] };
  templateHost: TemplatePreviewHost;
}) {
  const t = useTranslations("storeEditor.add");
  const { capabilities } = useEditorAdapter();
  const tab = useStore(store, (s) => s.addTab);
  const setTab = useStore(store, (s) => s.setAddTab);
  const tabs = addTabs(capabilities);
  // Product elements draw the page's product: offered on the product page only.
  const productParts = useStore(store, (s) => offersProductParts(s.pages.find((p) => p.id === s.activePageId) ?? s.pages[0]));
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" className={cn("m-3 mb-0 grid rounded-lg bg-muted p-1", tabs.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {tabs.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "rounded-md py-1.5 text-sm font-medium transition-colors",
              tab === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>
      {tab === "elements" && <ElementsTab commands={commands} uiLocale={uiLocale} productParts={productParts} />}
      {tab === "sections" && <SectionLibrary store={store} commands={commands} uiLocale={uiLocale} preview={preview} />}
      {tab === "templates" && capabilities.templates && (
        <PageTemplatesTab store={store} commands={commands} uiLocale={uiLocale} templates={templates.items} currentKey={templates.currentKey} host={templateHost} />
      )}
    </div>
  );
}

function ElementsTab({ commands, uiLocale, productParts }: { commands: EditorCommands; uiLocale: string; productParts: boolean }) {
  const t = useTranslations("storeEditor.add");
  const [query, setQuery] = useState("");
  const [usage, setUsage] = useState<{ recent: PaletteKey[]; most: PaletteKey[] }>({ recent: [], most: [] });
  // Read after mount: storage is per viewer and missing on the server.
  useEffect(() => setUsage({ recent: recentItems(), most: mostUsedItems() }), []);

  const items = useMemo(() => {
    const map = new Map<PaletteKey, Item>();
    const use = (key: PaletteKey, action: () => void) => () => {
      action();
      recordUse(key);
      setUsage({ recent: recentItems(), most: mostUsedItems() });
    };
    for (const type of offeredPaletteTypes(productParts)) {
      const definition = getElementDefinition(type)!;
      const Icon = ELEMENT_ICONS[type];
      const key = `el:${type}` as const;
      map.set(key, {
        key,
        label: pick(definition.label, uiLocale),
        icon: <Icon className="size-4" aria-hidden />,
        keywords: [definition.label.ar, definition.label.en, ...definition.keywords],
        run: use(key, () => commands.addElement(type)),
        payload: { kind: "element", elementType: type },
      });
    }
    for (const preset of LAYOUT_PRESETS) {
      const Icon = PRESET_ICONS[preset.id] ?? ELEMENT_ICONS.grid;
      const key = `preset:${preset.id}` as const;
      map.set(key, {
        key,
        label: pick(preset.label, uiLocale),
        icon: <Icon className="size-4" aria-hidden />,
        keywords: [preset.label.ar, preset.label.en, ...preset.keywords],
        run: use(key, () => commands.addPreset(preset)),
        payload: { kind: "preset", presetId: preset.id },
      });
    }
    return map;
  }, [commands, uiLocale, productParts]);

  const filter = (keys: PaletteKey[]) => keys.map((k) => items.get(k)).filter((i): i is Item => Boolean(i) && matchesSearch(query, i!.label, ...i!.keywords));
  const elementKeys = (group: string) =>
    offeredPaletteTypes(productParts).filter((type: ElementType) => getElementDefinition(type)!.group === group).map((type) => `el:${type}` as PaletteKey);
  const presetKeys = LAYOUT_PRESETS.map((p: LayoutPreset) => `preset:${p.id}` as PaletteKey);

  const groups: { key: string; title: string; icon?: ReactNode; items: Item[]; compact?: boolean }[] = [
    { key: "recent", title: t("recent"), icon: <Clock className="size-4" aria-hidden />, items: query ? [] : filter(usage.recent) },
    { key: "most", title: t("mostUsed"), icon: <Flame className="size-4" aria-hidden />, items: query ? [] : filter(usage.most) },
    { key: "layouts", title: t("layouts"), items: filter(presetKeys), compact: true },
    ...offeredElementGroups(productParts).map((group) => ({ key: group, title: t(`groups.${group}`), items: filter(elementKeys(group)) })),
  ];
  const empty = groups.every((g) => g.items.length === 0);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <h2 className="mb-2 text-sm font-semibold">{t("elementsTitle")}</h2>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="ps-8" aria-label={t("search")} />
      </div>
      {empty && <p className="py-6 text-center text-sm text-muted-foreground">{t("noResults")}</p>}
      {groups.map((group) =>
        group.items.length ? <PaletteGroup key={group.key} groupKey={group.key} title={group.title} icon={group.icon} items={group.items} compact={group.compact} /> : null,
      )}
    </div>
  );
}

function PaletteGroup({ groupKey, title, icon, items, compact }: { groupKey: string; title: string; icon?: ReactNode; items: Item[]; compact?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="mb-4">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mb-2 flex w-full items-center gap-2 text-sm">
        {icon}
        <span className="flex-1 text-start font-medium">{title}</span>
        <span className="rounded bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">{items.length}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", !open && "-rotate-90 rtl:rotate-90")} aria-hidden />
      </button>
      {open && (
        <ul className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <li key={item.key}>
              {/* Same item in Recent and its group: the draggable id includes the group. */}
              <PaletteItem id={`palette:${groupKey}:${item.key}`} item={item} compact={compact} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * One palette tile: drag it onto the canvas, or click (Enter) to insert it
 * after the selection. Keyboard users insert with Enter, so no keyboard drag
 * across the frame is offered here.
 */
function PaletteItem({ id, item, compact }: { id: string; item: Item; compact?: boolean }) {
  const t = useTranslations("storeEditor.add");
  const data = useDragData(item.payload, item.label);
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id, data });
  const { onKeyDown: _keyboard, ...pointer } = listeners ?? {};
  void _keyboard;
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...pointer}
      onClick={item.run}
      title={t("dragElementHint")}
      className={cn(
        "flex w-full cursor-grab items-center gap-2 rounded-lg border bg-background text-start text-sm shadow-xs transition-colors hover:border-primary/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
        compact ? "px-2.5 py-2" : "px-2.5 py-3",
        isDragging && "opacity-50",
      )}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-md border bg-muted/40 text-muted-foreground">{item.icon}</span>
      <span className="min-w-0 truncate">{item.label}</span>
    </button>
  );
}

/** What the section previews need from the editor (stable across page edits). */
export type SectionPreviewHost = {
  ctx: Omit<RenderContext, "pages" | "catalog">;
  catalog: PreviewCatalog;
  /** Published blog posts for post-list previews (null: failed to load). */
  posts?: ContentItemSummary[] | null;
  designSystem: DesignSystem;
  defaultLocale: SiteLocale;
  fontClassName: string;
  /** How many records the store has per data need (library chips, empty states). */
  counts: Partial<Record<DataNeed, number>>;
};
