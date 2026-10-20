"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useStore } from "zustand";
import type { DesignSystem, SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  CLASSIC_TOKENS,
  collectCatalogQueries,
  collectContentQueries,
  designSystemToTokens,
  storeSectionRegistry,
  type RenderContext,
  type SectionPreset,
  type StoreProfile,
} from "@workspace/store-sections/render";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { MediaPicker } from "./media/media-picker.client";
import { findIndustry } from "./lib/industries.lib";
import { EditorDndProvider } from "./dnd/editor-dnd.client";
import { DeviceBanner } from "./canvas/device-banner.client";
import { EditorCanvas } from "./canvas/editor-canvas.client";
import { createEditorCommands } from "./lib/editor-commands.lib";
import { QuickInsertDialog, ShortcutsDialog } from "./shell/editor-dialogs.client";
import { EditorRail } from "./shell/editor-rail.client";
import { EditorSidebar } from "./inspector/editor-sidebar.client";
import { EditorTopbar } from "./shell/editor-topbar.client";
import type { EditorCatalogSnapshot } from "./editor.dto";
import { DataActionButton, DataRetryButton } from "./canvas/data-action.client";
import { failedNeeds } from "./lib/editor-data.lib";
import { useEditorData } from "./state/use-editor-data.client";
import { getInstance, imageSpotOf, isImageSelection, refOf, setImageAt } from "./lib/editor-selection.lib";
import { storeDataCounts } from "./lib/editor-library.lib";
import { dropUnknownSections, resolveCanvasCatalog, resolveCanvasContent } from "./lib/editor.lib";
import { EditorAdapterProvider, useEditorAdapter } from "./adapter.client";
import type { EditorAdapter } from "./adapter.types";
import { createEditorStore, type EditorPage, type EditorStore, type Rail } from "./state/editor.store";
import { AddPanel } from "./panels/add/add-panel.client";
import { BrandPanel } from "./panels/brand-panel.client";
import { ExplorePanel } from "./panels/explore-panel.client";
import { FormsPanel } from "./panels/forms-panel.client";
import { LayersPanel } from "./panels/layers-panel.client";
import { MediaPanel } from "./panels/media-panel.client";
import { PagesPanel, nameOf } from "./panels/pages-panel.client";
import { railEnabled } from "./shell/capabilities.lib";
import type { TemplateCardView } from "./templates.dto";
import { useDeviceCommands } from "./state/use-device-commands.client";
import { useEditorAutosave } from "./state/use-editor-autosave.client";
import { useDraftWatch } from "./state/use-draft-watch.client";
import { useEditorShortcuts } from "./state/use-editor-shortcuts.client";
import { useStorePreview } from "./state/use-store-preview.client";

type Catalog = EditorCatalogSnapshot;

export type EditorInitial = {
  storeId: string;
  storeUrl: string;
  store: StoreProfile;
  readOnly: boolean;
  pages: EditorPage[];
  header: SectionInstance | null;
  footer: SectionInstance | null;
  designSystem: DesignSystem;
  designVersion: number;
  /** stores.chrome_version: one counter for the header and footer drafts. */
  chromeVersion: number;
  defaultLocale: SiteLocale;
  locales: SiteLocale[];
  catalog: Catalog;
  /** `all` or `selected` (D24): where "add products" sends the seller. */
  catalogMode: string;
  isLive: boolean;
  /** The drafts differ from the live revision (getStoreSiteStatus). */
  hasUnpublishedChanges: boolean;
  /** STORE_PREVIEW_SECRET is configured (P4-08). */
  previewEnabled: boolean;
  /** Add › Templates: the gallery and this store's current template. */
  templates: { currentKey: string; items: TemplateCardView[] };
  /** Class names defining the store font variables (website/_components/store-fonts.ts). */
  fontClassName: string;
  /** Store category from Store settings › General (Explore tab searches). */
  category: { en: string | null; ar: string | null };
  /** Library section presets for Add › Sections (Task 10); the built-in library when unset. */
  presets?: SectionPreset[];
  /** Industry id for photo slots; found from `category` when unset. */
  industry?: string;
  /** Most sections the page may hold (section editing: 1). */
  maxSections?: number;
  /** Top-bar label when editing a template or a section. */
  title?: string;
};

/**
 * The website editor. Every server call goes through `adapter` (the host's
 * EditorAdapter: seller dashboard, admin, template or section editing), and
 * panels the host does not support (`adapter.capabilities`) are not shown.
 */
export function StoreEditor({ initial, adapter }: { initial: EditorInitial; adapter: EditorAdapter }) {
  return (
    <EditorAdapterProvider adapter={adapter}>
      <EditorRoot initial={initial} />
    </EditorAdapterProvider>
  );
}

function EditorRoot({ initial }: { initial: EditorInitial }) {
  const t = useTranslations("storeEditor");
  const storeRef = useRef<EditorStore | null>(null);
  const droppedRef = useRef(0);
  if (!storeRef.current) {
    // Drafts may still hold removed coded sections; they would block every save.
    const clean = dropUnknownSections(initial, storeSectionRegistry.allowedSections());
    const store = createEditorStore({
      pages: clean.pages,
      header: clean.header,
      footer: clean.footer,
      designSystem: initial.designSystem,
      designVersion: initial.designVersion,
      chromeVersion: initial.chromeVersion,
      defaultLocale: initial.defaultLocale,
      industry: initial.industry ?? findIndustry(initial.category)?.id,
      presets: initial.presets,
      maxSections: initial.maxSections,
    });
    if (clean.dropped) store.setState({ dirtyPages: clean.dirtyPages, dirtyChrome: clean.dirtyChrome, saveStatus: "unsaved" });
    storeRef.current = store;
    droppedRef.current = clean.dropped;
  }
  useEffect(() => {
    if (droppedRef.current) toast.info(t("legacySectionsDropped", { count: droppedRef.current }), { id: "legacy-sections" });
  }, [t]);
  return <EditorShell initial={initial} store={storeRef.current} />;
}

/**
 * The editor layout (P4B-03, like the reference workspace): top bar, tab
 * rail and its panel, the canvas, and the Content/Style sidebar.
 */
function EditorShell({ initial, store }: { initial: EditorInitial; store: EditorStore }) {
  const t = useTranslations("storeEditor");
  const adapter = useEditorAdapter();
  const { capabilities } = adapter;
  const uiLocale = useLocale();
  const pages = useStore(store, (s) => s.pages);
  const activePageId = useStore(store, (s) => s.activePageId);
  const header = useStore(store, (s) => s.header);
  const footer = useStore(store, (s) => s.footer);
  const designSystem = useStore(store, (s) => s.designSystem);
  const locale = useStore(store, (s) => s.locale);
  const defaultLocale = useStore(store, (s) => s.defaultLocale);
  const device = useStore(store, (s) => s.device);
  // Section/template editing: the industry switcher picks the photos for slots (canvas only).
  const slotIndustry = useStore(store, (s) => (capabilities.industrySwitcher ? (s.industry ?? "general") : undefined));
  const rail = useStore(store, (s) => s.rail);
  const { flush, saveStatus } = useEditorAutosave(store);
  const { byAdmin: changedByAdmin } = useDraftWatch(store, adapter);
  const [publishing, setPublishing] = useState(false);
  const [isLive, setIsLive] = useState(initial.isLive);
  // Any draft edit (pages, chrome, design) counts until the next publish; reverted edits still count.
  const [hasChanges, setHasChanges] = useState(() => initial.hasUnpublishedChanges || store.getState().saveStatus !== "saved");
  useEffect(
    () =>
      store.subscribe((s, prev) => {
        if (s.pages !== prev.pages || s.header !== prev.header || s.footer !== prev.footer || s.designSystem !== prev.designSystem) setHasChanges(true);
      }),
    [store],
  );
  const [panelOpen, setPanelOpen] = useState(true);
  const [quickInsert, setQuickInsert] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const preview = useStorePreview(previewLinkOf(adapter), flush);
  // Store data refreshes when the seller comes back to this tab (P4B-05); forms also refresh from the Forms tab.
  const { data: catalog, state: dataState, refresh: refreshData, setForms } = useEditorData(initial.catalog);
  const forms = catalog.forms;
  const baseCommands = useMemo(() => createEditorCommands(store), [store]);
  const commands = useDeviceCommands(store, baseCommands);

  const shortcutActions = useMemo(
    () => ({
      save: () => void flush(),
      quickInsert: () => setQuickInsert({ open: true, index: null }),
      showShortcuts: () => setShortcutsOpen(true),
    }),
    [flush],
  );
  const onFrameKeyDown = useEditorShortcuts(store, commands, shortcutActions);

  const page = pages.find((p) => p.id === activePageId) ?? pages[0]!;
  // A picture hovered in Images/Explore: drawn on the canvas only (the drafts are untouched).
  const imagePreview = useStore(store, (s) => s.imagePreview);
  const selection = useStore(store, (s) => s.selection);
  const shown = useMemo(() => {
    const plain = { sections: page.content.sections, header, footer };
    if (!imagePreview || !selection) return plain;
    const instance = getInstance({ content: page.content, header, footer }, refOf(selection));
    const spot = imageSpotOf(instance, selection);
    if (!instance || !spot) return plain;
    const next = setImageAt(instance, spot, imagePreview, { locale, defaultLocale });
    if (selection.target === "page") return { ...plain, sections: plain.sections.map((s) => (s.id === instance.id ? next : s)) };
    return { ...plain, [selection.target]: next };
  }, [imagePreview, selection, page.content, header, footer, locale, defaultLocale]);
  const navPages = pages.filter((p) => !p.isHome && p.showInNav).length;
  const counts = useMemo(
    () =>
      storeDataCounts({
        products: catalog.products,
        categories: catalog.categories,
        forms,
        contact: initial.store.contact,
        navPages,
        brands: catalog.brands,
        reviews: catalog.reviewStats ? catalog.reviewStats.count : null,
        coupons: catalog.coupons?.filter((c) => c.live) ?? null,
        posts: catalog.posts,
      }),
    [catalog.products, catalog.categories, forms, initial.store.contact, navPages, catalog.brands, catalog.reviewStats, catalog.coupons, catalog.posts],
  );
  const openPages = () => {
    store.getState().setRail("pages");
    setPanelOpen(true);
  };
  const dataStore = { id: initial.storeId, catalogMode: initial.catalogMode };
  const libraryWide = useStore(store, (s) => s.libraryWide && s.rail === "add" && s.addTab === "sections");

  // What does not change with page edits (also used by the Add panel's section previews).
  const baseCtx = useMemo<Omit<RenderContext, "pages" | "catalog">>(
    () => ({
      mode: "edit",
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      store: initial.store,
      Link: ({ href, className, children, ...rest }) => (
        <a href={href} className={className} data-part={rest["data-part"]}>
          {children}
        </a>
      ),
      imageUrl: (src) => (src && /^(https?:)?\/\//.test(src) ? src : src ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sellers/${src}` : null),
      formatDate: (iso) => {
        const date = new Date(iso);
        return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar-EG", { day: "numeric", month: "long", year: "numeric" }).format(date);
      },
      formatPrice: (amount) => new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(amount),
      renderCartButton: () => <span className="inline-flex h-9 items-center rounded-full border border-(--sf-line) px-3 text-sm">🛒</span>,
      renderAddToCart: () => <span className="inline-flex h-8 items-center justify-center rounded-md bg-(--sf-brand) px-3 text-xs font-semibold text-white">{t("canvas.addToCart")}</span>,
      renderWishlistButton: () => <span aria-hidden className="inline-flex size-8 items-center justify-center rounded-full border border-(--sf-line) bg-(--sf-paper) text-sm">♡</span>,
      // Static preview of this store's forms (no renderForm in the canvas).
      forms: Object.fromEntries(forms.map((f) => [f.id, f.form])),
      ...(slotIndustry && { industry: slotIndustry }),
    }),
    [locale, forms, initial.store, t, slotIndustry],
  );

  const ctx = useMemo<RenderContext>(() => {
    const sections = [...page.content.sections, ...(header ? [header] : []), ...(footer ? [footer] : [])];
    return {
      ...baseCtx,
      pages: pages
        .filter((p) => p.isHome || p.showInNav)
        .map((p) => ({ name: nameOf(p.name, locale), href: p.isHome ? "/" : `/${p.slug}`, isHome: p.isHome })),
      catalog: { ...resolveCanvasCatalog(collectCatalogQueries(sections, storeSectionRegistry), catalog, locale), counts },
      content: resolveCanvasContent(collectContentQueries(sections, storeSectionRegistry), catalog.posts),
      editorData: {
        state: dataState,
        failed: failedNeeds(catalog.failed),
        renderAction: (need, label) => <DataActionButton need={need} label={label} store={dataStore} onOpenPages={openPages} />,
        renderRetry: (label) => <DataRetryButton label={label} onRetry={() => void refreshData(true)} />,
      },
    };
    // openPages and dataStore only read stable values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCtx, page.content.sections, header, footer, pages, locale, catalog, counts, dataState, refreshData]);

  // The store's --sf-* colors on the editor too, so color swatches show the real theme
  // (only --sf-* keys: the dashboard's own tokens stay untouched).
  const themeVars = useMemo(
    () => Object.fromEntries(Object.entries({ ...CLASSIC_TOKENS, ...designSystemToTokens(designSystem) }).filter(([key]) => key.startsWith("--sf-"))),
    [designSystem],
  );

  const onPublish = async () => {
    setPublishing(true);
    try {
      const saved = await flush();
      if (!saved) {
        toast.error(t(store.getState().saveStatus === "conflict" ? "errors.versionConflict" : "errors.saveFirst"));
        return;
      }
      const result = await adapter.publish();
      if (result.success) {
        setIsLive(true);
        setHasChanges(false);
        toast.success(t(capabilities.publishLabel === "section" ? "publishedSection" : "published", { number: result.data.revisionNumber }));
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    } finally {
      setPublishing(false);
    }
  };

  // Selecting an image opens Explore, so a photo can be dropped onto it right away.
  useEffect(
    () =>
      store.subscribe((state, prev) => {
        const { selection } = state;
        if (!selection || selection === prev.selection) return;
        const page = state.pages.find((p) => p.id === state.activePageId) ?? state.pages[0];
        if (!page) return;
        const instance = getInstance({ content: page.content, header: state.header, footer: state.footer }, refOf(selection));
        if (!isImageSelection(instance, selection) || !capabilities.explore) return;
        if (state.rail !== "explore") state.setRail("explore");
        setPanelOpen(true);
      }),
    [store, capabilities.explore],
  );

  const toggleRail = (next: Rail) => {
    if (next === rail && panelOpen) setPanelOpen(false);
    else {
      store.getState().setRail(next);
      setPanelOpen(true);
    }
  };

  return (
    <div className={`flex h-dvh flex-col bg-background ${initial.fontClassName}`} style={themeVars as React.CSSProperties}>
      <EditorTopbar
        store={store}
        storeId={initial.storeId}
        storeUrl={initial.storeUrl}
        locales={initial.locales}
        uiLocale={uiLocale}
        saveStatus={saveStatus}
        onRetrySave={() => void flush()}
        previewEnabled={initial.previewEnabled}
        preview={preview}
        readOnly={initial.readOnly}
        publishing={publishing}
        isLive={isLive}
        hasChanges={hasChanges}
        onPublish={() => void onPublish()}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />

      {saveStatus === "conflict" && (
        <div role="alert" className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {changedByAdmin ? (
            <span>
              <strong className="font-semibold">{t("adminUpdated.title")}</strong> {t("adminUpdated.body")}
            </span>
          ) : (
            t("conflict")
          )}
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            {changedByAdmin ? t("adminUpdated.reload") : t("reload")}
          </Button>
        </div>
      )}

      <EditorDndProvider store={store} commands={commands} readOnly={initial.readOnly}>
      <div className="flex min-h-0 flex-1">
        <EditorRail store={store} panelOpen={panelOpen} onToggle={toggleRail} />
        {panelOpen && railEnabled(rail, capabilities) && (
          <aside
            aria-label={t(`rail.${rail}`)}
            className={cn(
              "flex shrink-0 flex-col border-e bg-background transition-[width] duration-200 ease-out motion-reduce:transition-none",
              libraryWide ? "w-[min(560px,calc(100vw-30rem))]" : "w-[300px]",
            )}
          >
            {rail === "add" && (
              <AddPanel
                store={store}
                commands={commands}
                uiLocale={uiLocale}
                preview={{ ctx: baseCtx, catalog, posts: catalog.posts, designSystem, defaultLocale, fontClassName: initial.fontClassName, counts }}
                templates={initial.templates}
                templateHost={{
                  storeId: initial.storeId,
                  store: initial.store,
                  catalog,
                  fontClassName: initial.fontClassName,
                  defaultLocale,
                  readOnly: initial.readOnly,
                  flush,
                }}
              />
            )}
            {rail === "forms" && (
              <FormsPanel
                storeId={initial.storeId}
                readOnly={initial.readOnly}
                store={store}
                commands={commands}
                forms={forms}
                onForms={setForms}
                preview={{ ctx: baseCtx, catalog, posts: catalog.posts, designSystem, defaultLocale, fontClassName: initial.fontClassName, counts }}
              />
            )}
            {rail === "explore" && (
              <ExplorePanel storeId={initial.storeId} readOnly={initial.readOnly} category={initial.category} uiLocale={uiLocale} commands={commands} />
            )}
            {rail === "layers" && <LayersPanel store={store} commands={commands} uiLocale={uiLocale} />}
            {rail === "media" && <MediaPanel readOnly={initial.readOnly} commands={commands} />}
            {rail === "pages" && (
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <PagesPanel store={store} uiLocale={uiLocale} />
              </div>
            )}
            {rail === "brand" && <BrandPanel store={store} storeId={initial.storeId} readOnly={initial.readOnly} />}
          </aside>
        )}

        <main className="flex min-w-0 flex-1 flex-col">
          <DeviceBanner store={store} />
          <div className="min-h-0 flex-1">
            <EditorCanvas
              ctx={ctx}
              sections={shown.sections}
              header={shown.header}
              footer={shown.footer}
              designSystem={designSystem}
              fontClassName={initial.fontClassName}
              defaultLocale={defaultLocale}
              device={device}
              store={store}
              commands={commands}
              uiLocale={uiLocale}
              onRequestImage={() => setImagePickerOpen(true)}
              onQuickInsert={(index) => setQuickInsert({ open: true, index })}
              onFrameKeyDown={onFrameKeyDown}
            />
          </div>
        </main>

        <aside aria-label={t("sidebar.label")} className="hidden w-[320px] shrink-0 border-s bg-background lg:block">
          <EditorSidebar store={store} commands={commands} storeId={initial.storeId} readOnly={initial.readOnly} catalog={catalog} uiLocale={uiLocale} />
        </aside>
      </div>
      </EditorDndProvider>

      <QuickInsertDialog
        open={quickInsert.open}
        index={quickInsert.index}
        onOpenChange={(open) => setQuickInsert((prev) => ({ ...prev, open }))}
        commands={commands}
        uiLocale={uiLocale}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <MediaPicker
        readOnly={initial.readOnly}
        hideTrigger
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onPick={(asset) => commands.applyImage(asset.url)}
      />
    </div>
  );
}

/** The host's preview link, or "unavailable" when it has none (the button is hidden then). */
const previewLinkOf = (adapter: EditorAdapter) => () =>
  adapter.previewLink ? adapter.previewLink() : Promise.resolve({ success: false as const, error: "previewUnavailable" as const });
