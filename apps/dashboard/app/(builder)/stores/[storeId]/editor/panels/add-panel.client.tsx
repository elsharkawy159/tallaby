"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Clock, Flame, Plus, Search, ZoomIn } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { useStore } from "zustand";
import type { DesignSystem, SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  ELEMENT_GROUPS,
  LAYOUT_PRESETS,
  PALETTE_TYPES,
  SITE_ROOT_CLASS,
  SectionRenderer,
  collectCatalogQueries,
  getElementDefinition,
  storeSectionRegistry,
  type AnySectionDefinition,
  type ElementType,
  type LayoutPreset,
  type RenderContext,
  type SectionCategory,
} from "@workspace/store-sections/render";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import type { TemplateCardView } from "@/app/(main)/stores/[storeId]/website/templates/templates.dto";
import type { DragPayload } from "../dnd/dnd.types";
import { useDragData } from "../dnd/editor-dnd.client";
import type { EditorCommands } from "../editor-commands.lib";
import { classicStandIns, type PreviewCatalog } from "@/app/(main)/stores/[storeId]/website/_components/site-preview.client";
import { CATEGORY_ICONS, ELEMENT_ICONS, PRESET_ICONS } from "../editor-icons.lib";
import { createInstance, resolveCanvasCatalog } from "../editor.lib";
import { matchesSearch, mostUsedItems, recentItems, recordUse, sectionsByCategory, type PaletteKey } from "../editor-palette.lib";
import type { EditorStore } from "../editor.store";
import { PageTemplatesTab } from "./page-templates.client";
import { SectionThumbnail } from "./section-thumbnail.client";
import type { TemplatePreviewHost } from "./template-preview-dialog.client";

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
  const tab = useStore(store, (s) => s.addTab);
  const setTab = useStore(store, (s) => s.setAddTab);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" className="m-3 mb-0 grid grid-cols-3 rounded-lg bg-muted p-1">
        {(["elements", "sections", "templates"] as const).map((key) => (
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
      {tab === "elements" && <ElementsTab commands={commands} uiLocale={uiLocale} />}
      {tab === "sections" && <SectionsTab store={store} commands={commands} uiLocale={uiLocale} preview={preview} />}
      {tab === "templates" && (
        <PageTemplatesTab store={store} commands={commands} uiLocale={uiLocale} templates={templates.items} currentKey={templates.currentKey} host={templateHost} />
      )}
    </div>
  );
}

function ElementsTab({ commands, uiLocale }: { commands: EditorCommands; uiLocale: string }) {
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
    for (const type of PALETTE_TYPES) {
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
  }, [commands, uiLocale]);

  const filter = (keys: PaletteKey[]) => keys.map((k) => items.get(k)).filter((i): i is Item => Boolean(i) && matchesSearch(query, i!.label, ...i!.keywords));
  const elementKeys = (group: string) =>
    PALETTE_TYPES.filter((type: ElementType) => getElementDefinition(type)!.group === group).map((type) => `el:${type}` as PaletteKey);
  const presetKeys = LAYOUT_PRESETS.map((p: LayoutPreset) => `preset:${p.id}` as PaletteKey);

  const groups: { key: string; title: string; icon?: ReactNode; items: Item[]; compact?: boolean }[] = [
    { key: "recent", title: t("recent"), icon: <Clock className="size-4" aria-hidden />, items: query ? [] : filter(usage.recent) },
    { key: "most", title: t("mostUsed"), icon: <Flame className="size-4" aria-hidden />, items: query ? [] : filter(usage.most) },
    { key: "layouts", title: t("layouts"), items: filter(presetKeys), compact: true },
    ...ELEMENT_GROUPS.map((group) => ({ key: group, title: t(`groups.${group}`), items: filter(elementKeys(group)) })),
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
  ctx: Omit<RenderContext, "pages" | "catalog" | "renderClassic">;
  catalog: PreviewCatalog;
  designSystem: DesignSystem;
  defaultLocale: SiteLocale;
  fontClassName: string;
};

/**
 * Sections tab (P4B-06, like the reference layouts palette): an accordion per
 * category with every insertable section drawn live (store theme, products
 * and fonts). Click adds it; the zoom button opens a larger preview.
 */
function SectionsTab({ store, commands, uiLocale, preview }: { store: EditorStore; commands: EditorCommands; uiLocale: string; preview: SectionPreviewHost }) {
  const t = useTranslations("storeEditor.add");
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState<AnySectionDefinition | null>(null);
  const [openCategory, setOpenCategory] = useState<SectionCategory | null>("hero");
  const header = useStore(store, (s) => s.header);
  const footer = useStore(store, (s) => s.footer);

  const groups = useMemo(() => sectionsByCategory(), []);
  // One preview instance per section, with the props a fresh insert gets.
  const instances = useMemo(
    () => new Map(groups.flatMap((g) => g.sections).map((d): [string, SectionInstance] => [d.id, { ...createInstance(d), id: `preview-${d.id}` }])),
    [groups],
  );
  const ctx = useMemo<RenderContext>(() => {
    const standIns = classicStandIns(preview.ctx.store);
    const all = [...instances.values(), ...Object.values(standIns)];
    const base: RenderContext = {
      ...preview.ctx,
      pages: [],
      catalog: resolveCanvasCatalog(collectCatalogQueries(all, storeSectionRegistry), preview.catalog, preview.ctx.locale),
    };
    return {
      ...base,
      renderClassic: (part) => <SectionRenderer instance={standIns[part]} registry={storeSectionRegistry} ctx={base} defaultLocale={preview.defaultLocale} />,
    };
  }, [instances, preview.ctx, preview.catalog, preview.defaultLocale]);

  const add = (definition: AnySectionDefinition) => {
    const state = store.getState();
    // Header and footer are shared by every page: set or select them instead of inserting.
    if (definition.chrome) {
      const part = definition.chrome;
      const current = part === "header" ? header : footer;
      if (current?.sectionId !== definition.id) {
        state.editChrome(part, { id: part === "header" ? "hdr" : "ftr", sectionId: definition.id, version: definition.version, props: structuredClone(definition.defaultProps) });
      }
      state.select({ target: part });
      return;
    }
    commands.addSection(definition);
    recordUse(`section:${definition.id}`);
  };

  const shown = groups
    .map((g) => ({
      ...g,
      sections: g.sections.filter((d) =>
        matchesSearch(query, t(`categories.${g.category}`), d.displayName.ar, d.displayName.en, d.description.ar, d.description.en),
      ),
    }))
    .filter((g) => g.sections.length > 0);
  const inUse = (d: AnySectionDefinition) => (d.chrome === "header" ? header?.sectionId === d.id : d.chrome === "footer" ? footer?.sectionId === d.id : false);
  const thumb = (d: AnySectionDefinition, maxHeight: number) => (
    <SectionThumbnail
      instance={instances.get(d.id)!}
      ctx={ctx}
      designSystem={preview.designSystem}
      defaultLocale={preview.defaultLocale}
      fontClassName={preview.fontClassName}
      maxHeight={maxHeight}
      className="rounded-md"
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Headings in the previews use the store's heading font, like the storefront. */}
      <style>{`.${SITE_ROOT_CLASS} :where(h1,h2,h3,h4){font-family:var(--sf-font-heading,var(--sf-font-body,var(--font-storefront))),system-ui,sans-serif}`}</style>
      <div className="border-b p-3">
        <p className="mb-2 text-xs text-muted-foreground">{t("sectionsIntro")}</p>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchSections")} className="ps-8" aria-label={t("searchSections")} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {shown.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{t("noResults")}</p>}
        <div className="px-2 pb-4">
          {shown.map((g) => (
            <CategoryGroup
              key={g.category}
              category={g.category}
              label={t(`categories.${g.category}`)}
              count={g.sections.length}
              // Searching opens every matching category; otherwise one at a time.
              open={Boolean(query) || openCategory === g.category}
              onToggle={() => setOpenCategory((prev) => (prev === g.category ? null : g.category))}
            >
              {g.sections.map((d) => card(d))}
            </CategoryGroup>
          ))}
        </div>
      </div>

      <Dialog open={zoom !== null} onOpenChange={(open) => !open && setZoom(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-none sm:max-w-4xl">
          {zoom && (
            <>
              <DialogHeader>
                <DialogTitle>{pick(zoom.displayName, uiLocale)}</DialogTitle>
                <DialogDescription>{pick(zoom.description, uiLocale)}</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto rounded-lg border">{thumb(zoom, 4000)}</div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setZoom(null)}>
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    add(zoom);
                    setZoom(null);
                  }}
                >
                  <Plus />
                  {zoom.chrome ? t("useSection") : t("addSection")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  function card(d: AnySectionDefinition) {
    return (
      <SectionCard
        key={d.id}
        definition={d}
        label={pick(d.displayName, uiLocale)}
        inUse={inUse(d)}
        thumb={thumb(d, 160)}
        onAdd={() => add(d)}
        onZoom={() => setZoom(d)}
      />
    );
  }
}

/**
 * A section card: drag it between two sections on the canvas, or click to
 * add it after the selection. Header and footer are shared by every page,
 * so they are set with a click, not dropped.
 */
function SectionCard({
  definition,
  label,
  inUse,
  thumb,
  onAdd,
  onZoom,
}: {
  definition: AnySectionDefinition;
  label: string;
  inUse: boolean;
  thumb: ReactNode;
  onAdd: () => void;
  onZoom: () => void;
}) {
  const t = useTranslations("storeEditor.add");
  const draggable = !definition.chrome;
  const data = useDragData({ kind: "section", sectionId: definition.id }, label);
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `section-card:${definition.id}`, data, disabled: !draggable });
  const { onKeyDown: _keyboard, ...pointer } = listeners ?? {};
  void _keyboard;
  return (
    <li className="group relative">
      <button
        ref={setNodeRef}
        type="button"
        {...attributes}
        {...pointer}
        onClick={onAdd}
        title={draggable ? t("dragHint") : undefined}
        className={cn(
          "flex w-full flex-col gap-1.5 rounded-lg border border-transparent p-1 text-center transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          draggable && "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50",
        )}
      >
        <span className="block overflow-hidden rounded-md border shadow-xs">{thumb}</span>
        <span className="flex items-center justify-center gap-1.5 pb-0.5">
          <span className="truncate text-xs font-medium">{label}</span>
          {inUse && <span className="shrink-0 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{t("inUse")}</span>}
        </span>
      </button>
      <button
        type="button"
        onClick={onZoom}
        aria-label={t("previewSection")}
        title={t("previewSection")}
        className="absolute end-2.5 top-2.5 grid size-7 place-items-center rounded-md border bg-background/90 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <ZoomIn className="size-3.5" aria-hidden />
      </button>
    </li>
  );
}

/** A plain collapsible category header (no background) and its section cards. */
function CategoryGroup({
  category,
  label,
  count,
  open,
  onToggle,
  children,
}: {
  category: SectionCategory;
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <section className="border-b last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-1.5 py-3 text-start text-sm font-medium text-foreground/90 transition-colors hover:text-foreground"
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="flex-1">{label}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", !open && "-rotate-90 rtl:rotate-90")} aria-hidden />
      </button>
      {open && <ul className="space-y-3 pb-4">{children}</ul>}
    </section>
  );
}
