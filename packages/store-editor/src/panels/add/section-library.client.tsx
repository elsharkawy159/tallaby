"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useDraggable } from "@dnd-kit/core";
import { ChevronDown, Database, Plus, Search, X, ZoomIn } from "lucide-react";
import { useStore } from "zustand";
import type { SectionInstance } from "@workspace/store-sections";
import {
  LIBRARY_CATEGORIES,
  SECTION_PRESETS,
  SITE_ROOT_CLASS,
  collectCatalogQueries,
  collectContentQueries,
  filterPresets,
  storeSectionRegistry,
  type DataNeed,
  type LibraryCategoryId,
  type RenderContext,
  type SectionPreset,
} from "@workspace/store-sections/render";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { useDragData } from "../../dnd/editor-dnd.client";
import type { EditorCommands } from "../../lib/editor-commands.lib";
import { LIBRARY_ICONS } from "../../lib/editor-icons.lib";
import { acceptsCardPreset, presetDataStatus, presetInstance } from "../../lib/editor-library.lib";
import { recordUse } from "../../lib/editor-palette.lib";
import { getInstance, refOf } from "../../lib/editor-selection.lib";
import { resolveCanvasCatalog, resolveCanvasContent } from "../../lib/editor.lib";
import type { EditorStore } from "../../state/editor.store";
import type { SectionPreviewHost } from "./add-panel.client";
import { SectionThumbnail } from "./section-thumbnail.client";

const pick = (value: { ar: string; en: string }, locale: string) => (locale === "en" ? value.en : value.ar) || value.ar;


/**
 * Add › Sections (P4B-05): the section library as a simple accordion, one
 * category open at a time (no trigger background), each holding its sections
 * as live previews drawn exactly like the canvas (store theme and element
 * styles). Searching opens every category with a match. Click adds after the
 * selection, drag places it on the canvas; every insert is an ordinary
 * section instance (one undo step).
 */
export function SectionLibrary({
  store,
  commands,
  uiLocale,
  preview,
}: {
  store: EditorStore;
  commands: EditorCommands;
  uiLocale: string;
  preview: SectionPreviewHost;
}) {
  const t = useTranslations("storeEditor.add.library");
  const tAdd = useTranslations("storeEditor.add");
  // One category open at a time (Hero first), so the list stays short.
  const [open, setOpen] = useState<LibraryCategoryId | null>("hero");
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState<SectionPreset | null>(null);
  const setWide = useStore(store, (s) => s.setLibraryWide);
  const header = useStore(store, (s) => s.header);
  const footer = useStore(store, (s) => s.footer);
  const defaultLocale = useStore(store, (s) => s.defaultLocale);
  const industry = useStore(store, (s) => s.industry);
  const presets = useStore(store, (s) => s.presets) ?? SECTION_PRESETS;
  const selection = useStore(store, (s) => s.selection);
  const selectedInstance = useStore(store, (s) => {
    if (!s.selection) return null;
    const page = s.pages.find((p) => p.id === s.activePageId) ?? s.pages[0];
    return page ? getInstance({ content: page.content, header: s.header, footer: s.footer }, refOf(s.selection)) : null;
  });

  // The accordion fits the normal panel width (the earlier wide grid is gone).
  useEffect(() => {
    setWide(false);
  }, [setWide]);

  // One preview instance per preset, with the props a fresh insert gets; previews never fetch.
  const instances = useMemo(() => {
    const out = new Map<string, SectionInstance>();
    for (const preset of presets) {
      const instance = presetInstance(preset, `preview-${preset.id.replace(/[^A-Za-z0-9_-]/g, "-")}`, defaultLocale, industry);
      if (instance) out.set(preset.id, instance);
    }
    return out;
  }, [presets, defaultLocale, industry]);
  const ctx = useMemo<RenderContext>(
    () => ({
      ...preview.ctx,
      pages: [],
      catalog: {
        ...resolveCanvasCatalog(collectCatalogQueries([...instances.values()], storeSectionRegistry), preview.catalog, preview.ctx.locale),
        counts: preview.counts,
      },
      content: resolveCanvasContent(collectContentQueries([...instances.values()], storeSectionRegistry), preview.posts),
    }),
    [instances, preview.ctx, preview.catalog, preview.counts, preview.posts],
  );

  const add = (preset: SectionPreset) => {
    const done = commands.addLibraryPreset(preset);
    if (done) recordUse(`section:${preset.id}`);
  };
  const inUse = (preset: SectionPreset) => {
    const chrome = storeSectionRegistry.get(preset.sectionId)?.chrome;
    const current = chrome === "header" ? header : chrome === "footer" ? footer : null;
    return Boolean(current && current.sectionId === preset.sectionId);
  };
  const thumb = (preset: SectionPreset, maxHeight: number) => {
    const instance = instances.get(preset.id);
    return instance ? (
      <SectionThumbnail
        instance={instance}
        ctx={ctx}
        designSystem={preview.designSystem}
        defaultLocale={preview.defaultLocale}
        fontClassName={preview.fontClassName}
        maxHeight={maxHeight}
      />
    ) : null;
  };
  const cardTarget = (preset: SectionPreset) => preset.kind === "card" && selection !== null && acceptsCardPreset(selectedInstance, preset);
  const actionLabel = (preset: SectionPreset) =>
    storeSectionRegistry.get(preset.sectionId)?.chrome ? t("useChrome") : cardTarget(preset) ? t("applyCard") : t("add");

  const matches = useMemo(() => filterPresets({ query }, presets), [query, presets]);
  const searching = query.trim() !== "";
  const groups = LIBRARY_CATEGORIES.map((c) => ({ category: c, presets: matches.filter((p) => p.category === c.id) })).filter((g) => g.presets.length > 0);
  const isOpen = (id: LibraryCategoryId) => searching || open === id;
  // Opening a category closes the one that was open.
  const toggle = (id: LibraryCategoryId) => setOpen((current) => (current === id ? null : id));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Headings in the previews use the store's heading font, like the storefront. */}
      <style>{`.${SITE_ROOT_CLASS} :where(h1,h2,h3,h4){font-family:var(--sf-font-heading,var(--sf-font-body,var(--font-storefront))),system-ui,sans-serif}`}</style>

      <div className="border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="ps-8 pe-8" aria-label={t("search")} />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("clearFilters")}
              className="absolute end-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("noResults")}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => setQuery("")}>
              {t("clearFilters")}
            </Button>
          </div>
        ) : (
          groups.map(({ category, presets }) => (
            <CategoryGroup key={category.id} category={category} uiLocale={uiLocale} open={isOpen(category.id)} onToggle={() => toggle(category.id)}>
              <ul className="space-y-4">
                {presets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    uiLocale={uiLocale}
                    category={null}
                    inUse={inUse(preset)}
                    status={presetDataStatus(preset, preview.counts)}
                    actionLabel={actionLabel(preset)}
                    thumb={<LazyMount>{thumb(preset, 220)}</LazyMount>}
                    onAdd={() => add(preset)}
                    onZoom={() => setZoom(preset)}
                  />
                ))}
              </ul>
            </CategoryGroup>
          ))
        )}
      </div>

      <Dialog open={zoom !== null} onOpenChange={(value) => !value && setZoom(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-none sm:max-w-4xl">
          {zoom && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">{pick(zoom.name, uiLocale)}</DialogTitle>
                <DialogDescription className="sr-only">{pick(zoom.name, uiLocale)}</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto rounded-lg border">{thumb(zoom, 4000)}</div>
              <DialogFooter className="items-center sm:justify-between">
                <DataChip status={presetDataStatus(zoom, preview.counts)} />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setZoom(null)}>
                    {tAdd("cancel")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      add(zoom);
                      setZoom(null);
                    }}
                  >
                    <Plus />
                    {actionLabel(zoom)}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * One library category: a plain collapsible header (no background) with its
 * icon, name and a chevron, and its section cards underneath.
 */
function CategoryGroup({
  category,
  uiLocale,
  open,
  onToggle,
  children,
}: {
  category: (typeof LIBRARY_CATEGORIES)[number];
  uiLocale: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const Icon = LIBRARY_ICONS[category.icon] ?? LIBRARY_ICONS["layout-grid"]!;
  const panelId = `library-${category.id}`;
  return (
    <section className="border-b last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-2.5 py-3 text-start text-foreground/90 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{pick(category.name, uiLocale)}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", !open && "-rotate-90 rtl:rotate-90")} aria-hidden />
      </button>
      {open && (
        <div id={panelId} className="space-y-3 pb-4">
          {children}
        </div>
      )}
    </section>
  );
}

function DataChip({ status }: { status: { need: DataNeed; count: number | null } | null }) {
  const t = useTranslations("storeEditor.add.library");
  if (!status) return <span />;
  const counted = status.count !== null && ["products", "categories", "brands", "reviews", "promotions", "forms"].includes(status.need);
  const label = counted ? t(`data.${status.need}` as "data.products", { count: status.count! }) : status.count === null ? t("dataUnknown") : t(`data.${status.need}` as "data.articles");
  const missing = counted && status.count === 0;
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1 text-[11px]", missing ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
      <Database className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}

/**
 * One library card: the live preview, its name and what it shows. Click adds
 * it; drag places it on the canvas (not header/footer, which are shared by
 * every page and set with a click).
 */
function PresetCard({
  preset,
  uiLocale,
  category,
  inUse,
  status,
  actionLabel,
  thumb,
  onAdd,
  onZoom,
}: {
  preset: SectionPreset;
  uiLocale: string;
  category: { ar: string; en: string } | null;
  inUse: boolean;
  status: { need: DataNeed; count: number | null } | null;
  actionLabel: string;
  thumb: ReactNode;
  onAdd: () => void;
  onZoom: () => void;
}) {
  const t = useTranslations("storeEditor.add");
  const definition = storeSectionRegistry.get(preset.sectionId);
  const draggable = Boolean(definition && !definition.chrome);
  const label = pick(preset.name, uiLocale);
  const data = useDragData({ kind: "section", sectionId: preset.sectionId, presetId: preset.id }, label);
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `library:${preset.id}`, data, disabled: !draggable });
  const { onKeyDown: _keyboard, ...pointer } = listeners ?? {};
  void _keyboard;
  return (
    <li className="group/card relative min-w-0">
      <button
        ref={setNodeRef}
        type="button"
        {...attributes}
        {...pointer}
        onClick={onAdd}
        aria-label={`${label}. ${actionLabel}`}
        title={draggable ? t("dragHint") : actionLabel}
        className={cn(
          "flex w-full flex-col gap-2 rounded-lg text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          draggable && "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50",
        )}
      >
        <span data-drag-preview className="relative block overflow-hidden rounded-md border bg-muted/30 transition-[border-color,box-shadow] group-hover/card:border-foreground/30 group-hover/card:shadow-sm">
          {thumb}
          <span className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-center opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100 motion-reduce:transition-none">
            <span className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-sm">
              <Plus className="size-3" aria-hidden />
              {actionLabel}
            </span>
          </span>
        </span>
        <span className="flex min-w-0 flex-col items-center gap-0.5 px-0.5 text-center">
          <span className="flex max-w-full items-center justify-center gap-1.5">
            <span className="truncate text-[13px] font-medium leading-snug">{label}</span>
            {inUse && <span className="shrink-0 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{t("library.inUse")}</span>}
          </span>
          {category && <span className="block max-w-full truncate text-[11px] text-muted-foreground">{pick(category, uiLocale)}</span>}
          {status && <DataChip status={status} />}
        </span>
      </button>
      <button
        type="button"
        onClick={onZoom}
        aria-label={`${t("library.preview")}: ${label}`}
        title={t("library.preview")}
        className="absolute end-1.5 top-1.5 grid size-7 place-items-center rounded-md border bg-background/95 opacity-0 shadow-sm transition-opacity group-hover/card:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ZoomIn className="size-3.5" aria-hidden />
      </button>
    </li>
  );
}

/**
 * Mounts a preview only when it scrolls near the viewport, so a category
 * with many sections stays fast. Once mounted it stays mounted.
 */
export function LazyMount({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "240px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);
  return (
    <span ref={ref} className="block">
      {visible ? children : <span aria-hidden className="block h-28 animate-pulse bg-muted/60 motion-reduce:animate-none" />}
    </span>
  );
}
