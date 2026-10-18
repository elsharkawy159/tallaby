"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useDraggable } from "@dnd-kit/core";
import { ArrowLeft, Database, Plus, Search, X, ZoomIn } from "lucide-react";
import { useStore } from "zustand";
import type { SectionInstance } from "@workspace/store-sections";
import {
  LIBRARY_CATEGORIES,
  SITE_ROOT_CLASS,
  SectionRenderer,
  collectCatalogQueries,
  filterPresets,
  storeSectionRegistry,
  type DataNeed,
  type LibraryCategoryId,
  type PresetCapability,
  type RenderContext,
  type SectionPreset,
} from "@workspace/store-sections/render";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { classicStandIns } from "@/app/(main)/stores/[storeId]/website/_components/site-preview.client";
import { useDragData } from "../dnd/editor-dnd.client";
import type { EditorCommands } from "../editor-commands.lib";
import { LIBRARY_ICONS } from "../editor-icons.lib";
import { acceptsCardPreset, presetDataStatus, presetInstance } from "../editor-library.lib";
import { recordUse } from "../editor-palette.lib";
import { getInstance, refOf } from "../editor-selection.lib";
import { resolveCanvasCatalog } from "../editor.lib";
import type { EditorStore } from "../editor.store";
import type { SectionPreviewHost } from "./add-panel.client";
import { SectionThumbnail } from "./section-thumbnail.client";

const pick = (value: { ar: string; en: string }, locale: string) => (locale === "en" ? value.en : value.ar) || value.ar;

type CapabilityFilter = "all" | PresetCapability;
const CAPABILITY_FILTERS: CapabilityFilter[] = ["all", "dynamic", "interactive", "static"];

/**
 * Add › Sections (P4B-05): the section library. The narrow panel lists the
 * 15 categories; opening one (or searching) widens the panel to a
 * two-column grid of live previews drawn with the store's own theme and
 * products, filtered by subcategory and capability. Click adds after the
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
  const [category, setCategory] = useState<LibraryCategoryId | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [capability, setCapability] = useState<CapabilityFilter>("all");
  const [zoom, setZoom] = useState<SectionPreset | null>(null);
  const setWide = useStore(store, (s) => s.setLibraryWide);
  const header = useStore(store, (s) => s.header);
  const footer = useStore(store, (s) => s.footer);
  const selection = useStore(store, (s) => s.selection);
  const selectedInstance = useStore(store, (s) => {
    if (!s.selection) return null;
    const page = s.pages.find((p) => p.id === s.activePageId) ?? s.pages[0];
    return page ? getInstance({ content: page.content, header: s.header, footer: s.footer }, refOf(s.selection)) : null;
  });

  const browsing = category !== null || query.trim() !== "";
  useEffect(() => {
    setWide(browsing);
  }, [browsing, setWide]);
  // The panel goes back to its normal width when the library closes.
  useEffect(() => () => setWide(false), [setWide]);

  const results = useMemo(
    () => filterPresets({ query, category, subcategory, capabilities: capability === "all" ? undefined : [capability] }),
    [query, category, subcategory, capability],
  );

  // One preview instance per preset, with the props a fresh insert gets; previews never fetch.
  const instances = useMemo(() => {
    const out = new Map<string, SectionInstance>();
    for (const preset of filterPresets({})) {
      const instance = presetInstance(preset, `preview-${preset.id.replace(/[^A-Za-z0-9_-]/g, "-")}`);
      if (instance) out.set(preset.id, instance);
    }
    return out;
  }, []);
  const ctx = useMemo<RenderContext>(() => {
    const standIns = classicStandIns(preview.ctx.store);
    const all = [...instances.values(), ...Object.values(standIns)];
    const base: RenderContext = {
      ...preview.ctx,
      pages: [],
      catalog: { ...resolveCanvasCatalog(collectCatalogQueries(all, storeSectionRegistry), preview.catalog, preview.ctx.locale), counts: preview.counts },
    };
    return {
      ...base,
      renderClassic: (part) => <SectionRenderer instance={standIns[part]} registry={storeSectionRegistry} ctx={base} defaultLocale={preview.defaultLocale} />,
    };
  }, [instances, preview.ctx, preview.catalog, preview.counts, preview.defaultLocale]);

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

  const openCategory = (id: LibraryCategoryId | null) => {
    setCategory(id);
    setSubcategory(null);
  };
  const resetFilters = () => {
    setQuery("");
    setSubcategory(null);
    setCapability("all");
  };

  const current = category ? LIBRARY_CATEGORIES.find((c) => c.id === category) : null;
  const inCategory = category ? filterPresets({ category }) : [];
  const subcategories = current ? current.subcategories.filter((s) => inCategory.some((p) => p.subcategory === s.id)) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Headings in the previews use the store's heading font, like the storefront. */}
      <style>{`.${SITE_ROOT_CLASS} :where(h1,h2,h3,h4){font-family:var(--sf-font-heading,var(--sf-font-body,var(--font-storefront))),system-ui,sans-serif}`}</style>

      <div className="space-y-3 border-b p-3">
        {current ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => openCategory(null)} aria-label={t("back")} title={t("back")}>
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
            </Button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold">{pick(current.name, uiLocale)}</h2>
              <p className="truncate text-xs text-muted-foreground">{pick(current.description, uiLocale)}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">{t("intro")}</p>
        )}
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
        {browsing && (
          <div className="flex flex-wrap items-center gap-2">
            {subcategories.length > 1 && (
              <div role="group" aria-label={pick(current!.name, uiLocale)} className="-mx-1 flex max-w-full gap-1 overflow-x-auto px-1 pb-0.5">
                <Chip active={subcategory === null} onClick={() => setSubcategory(null)}>
                  {t("all")}
                </Chip>
                {subcategories.map((s) => (
                  <Chip key={s.id} active={subcategory === s.id} onClick={() => setSubcategory(s.id)}>
                    {pick(s.name, uiLocale)}
                  </Chip>
                ))}
              </div>
            )}
            <div role="radiogroup" aria-label={t("filterLabel")} className="ms-auto flex rounded-md border p-0.5">
              {CAPABILITY_FILTERS.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={capability === key}
                  onClick={() => setCapability(key)}
                  className={cn(
                    "rounded px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    capability === key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`filters.${key}`)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!browsing ? (
          <CategoryList uiLocale={uiLocale} onOpen={openCategory} />
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("noResults")}</p>
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              {t("clearFilters")}
            </Button>
          </div>
        ) : (
          <div className="p-3">
            {category === "product-cards" && <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{t("cardsIntro")}</p>}
            <p className="mb-2 text-xs tabular-nums text-muted-foreground" aria-live="polite">
              {t("count", { count: results.length })}
            </p>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
              {results.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  uiLocale={uiLocale}
                  category={category ? null : LIBRARY_CATEGORIES.find((c) => c.id === preset.category)?.name ?? null}
                  inUse={inUse(preset)}
                  status={presetDataStatus(preset, preview.counts)}
                  actionLabel={actionLabel(preset)}
                  thumb={<LazyMount>{thumb(preset, 200)}</LazyMount>}
                  onAdd={() => add(preset)}
                  onZoom={() => setZoom(preset)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      <Dialog open={zoom !== null} onOpenChange={(open) => !open && setZoom(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-none sm:max-w-4xl">
          {zoom && (
            <>
              <DialogHeader>
                <DialogTitle>{pick(zoom.name, uiLocale)}</DialogTitle>
                <DialogDescription>{pick(zoom.description, uiLocale)}</DialogDescription>
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

function CategoryList({ uiLocale, onOpen }: { uiLocale: string; onOpen: (id: LibraryCategoryId) => void }) {
  const t = useTranslations("storeEditor.add.library");
  const counts = useMemo(() => Object.fromEntries(LIBRARY_CATEGORIES.map((c) => [c.id, filterPresets({ category: c.id }).length])), []);
  return (
    <ul className="p-1.5">
      {LIBRARY_CATEGORIES.filter((c) => counts[c.id]! > 0).map((category) => {
        const Icon = LIBRARY_ICONS[category.icon] ?? LIBRARY_ICONS["layout-grid"]!;
        return (
          <li key={category.id}>
            <button
              type="button"
              onClick={() => onOpen(category.id)}
              className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-start transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{pick(category.name, uiLocale)}</span>
                <span className="block truncate text-xs text-muted-foreground">{pick(category.description, uiLocale)}</span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground" aria-label={t("count", { count: counts[category.id]! })}>
                {counts[category.id]}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "border-foreground bg-foreground text-background" : "bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
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
        <span className="relative block overflow-hidden rounded-md border bg-muted/30 transition-[border-color,box-shadow] group-hover/card:border-foreground/30 group-hover/card:shadow-sm">
          {thumb}
          <span className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-center opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100 motion-reduce:transition-none">
            <span className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-sm">
              <Plus className="size-3" aria-hidden />
              {actionLabel}
            </span>
          </span>
        </span>
        <span className="min-w-0 space-y-0.5 px-0.5">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium leading-snug">{label}</span>
            {inUse && <span className="shrink-0 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{t("library.inUse")}</span>}
          </span>
          {category && <span className="block truncate text-[11px] text-muted-foreground">{pick(category, uiLocale)}</span>}
          <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">{pick(preset.description, uiLocale)}</span>
          <DataChip status={status} />
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
function LazyMount({ children }: { children: ReactNode }) {
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
