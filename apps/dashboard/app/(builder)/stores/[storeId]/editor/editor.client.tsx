"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useStore } from "zustand";
import type { DesignSystem, SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  CLASSIC_TOKENS,
  collectCatalogQueries,
  designSystemToTokens,
  storeSectionRegistry,
  type RenderContext,
  type StoreProfile,
} from "@workspace/store-sections/render";
import { Button } from "@workspace/ui/components/button";
import { MediaPicker } from "@/components/media/media-picker.client";
import { EditorDndProvider } from "./dnd/editor-dnd.client";
import { EditorCanvas } from "./editor-canvas.client";
import { createEditorCommands } from "./editor-commands.lib";
import { QuickInsertDialog, ShortcutsDialog } from "./editor-dialogs.client";
import { EditorRail } from "./editor-rail.client";
import { EditorSidebar } from "./editor-sidebar.client";
import { EditorTopbar } from "./editor-topbar.client";
import type { EditorCategory, EditorForm, EditorProduct } from "./editor.data";
import { getInstance, isImageSelection, refOf } from "./editor-selection.lib";
import { resolveCanvasCatalog } from "./editor.lib";
import { publish } from "./editor.server";
import { createEditorStore, type EditorPage, type EditorStore, type Rail } from "./editor.store";
import { AddPanel } from "./panels/add-panel.client";
import { BrandPanel } from "./panels/brand-panel.client";
import { ExplorePanel } from "./panels/explore-panel.client";
import { FormsPanel } from "./panels/forms-panel.client";
import { LayersPanel } from "./panels/layers-panel.client";
import { MediaPanel } from "./panels/media-panel.client";
import { PagesPanel, nameOf } from "./panels/pages-panel.client";
import type { TemplateCardView } from "@/app/(main)/stores/[storeId]/website/templates/templates.dto";
import { useEditorAutosave } from "./use-editor-autosave.client";
import { useEditorShortcuts } from "./use-editor-shortcuts.client";
import { useStorePreview } from "./use-store-preview.client";

type Catalog = { products: EditorProduct[]; categories: EditorCategory[]; forms: EditorForm[] };

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
  defaultLocale: SiteLocale;
  locales: SiteLocale[];
  catalog: Catalog;
  isLive: boolean;
  /** STORE_PREVIEW_SECRET is configured (P4-08). */
  previewEnabled: boolean;
  /** Add › Templates: the gallery and this store's current template. */
  templates: { currentKey: string; items: TemplateCardView[] };
  /** Class names defining the store font variables (website/_components/store-fonts.ts). */
  fontClassName: string;
  /** Store category from Store settings › General (Explore tab searches). */
  category: { en: string | null; ar: string | null };
};

export function StoreEditor({ initial }: { initial: EditorInitial }) {
  const storeRef = useRef<EditorStore | null>(null);
  storeRef.current ??= createEditorStore({
    pages: initial.pages,
    header: initial.header,
    footer: initial.footer,
    designSystem: initial.designSystem,
    designVersion: initial.designVersion,
    defaultLocale: initial.defaultLocale,
  });
  return <EditorShell initial={initial} store={storeRef.current} />;
}

/**
 * The editor layout (P4B-03, like the reference workspace): top bar, tab
 * rail and its panel, the canvas, and the Content/Style sidebar.
 */
function EditorShell({ initial, store }: { initial: EditorInitial; store: EditorStore }) {
  const t = useTranslations("storeEditor");
  const uiLocale = useLocale();
  const pages = useStore(store, (s) => s.pages);
  const activePageId = useStore(store, (s) => s.activePageId);
  const header = useStore(store, (s) => s.header);
  const footer = useStore(store, (s) => s.footer);
  const designSystem = useStore(store, (s) => s.designSystem);
  const locale = useStore(store, (s) => s.locale);
  const defaultLocale = useStore(store, (s) => s.defaultLocale);
  const device = useStore(store, (s) => s.device);
  const rail = useStore(store, (s) => s.rail);
  const { flush, saveStatus } = useEditorAutosave(initial.storeId, store);
  const [publishing, setPublishing] = useState(false);
  const [isLive, setIsLive] = useState(initial.isLive);
  const [panelOpen, setPanelOpen] = useState(true);
  const [quickInsert, setQuickInsert] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const preview = useStorePreview(initial.storeId, flush);
  // Forms refresh from the Forms tab (they are edited on their own page).
  const [forms, setForms] = useState(initial.catalog.forms);
  const catalog = useMemo(() => ({ ...initial.catalog, forms }), [initial.catalog, forms]);
  const commands = useMemo(() => createEditorCommands(store), [store]);

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

  // What does not change with page edits (also used by the Add panel's section previews).
  const baseCtx = useMemo<Omit<RenderContext, "pages" | "catalog" | "renderClassic">>(
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
      formatPrice: (amount) => new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(amount),
      renderCartButton: () => <span className="inline-flex h-9 items-center rounded-full border border-(--sf-line) px-3 text-sm">🛒</span>,
      renderAddToCart: () => <span className="inline-flex h-8 items-center justify-center rounded-md bg-(--sf-brand) px-3 text-xs font-semibold text-white">{t("canvas.addToCart")}</span>,
      // Static preview of this store's forms (no renderForm in the canvas).
      forms: Object.fromEntries(forms.map((f) => [f.id, f.form])),
    }),
    [locale, forms, initial.store, t],
  );

  const ctx = useMemo<RenderContext>(() => {
    const sections = [...page.content.sections, ...(header ? [header] : []), ...(footer ? [footer] : [])];
    return {
      ...baseCtx,
      pages: pages
        .filter((p) => p.isHome || p.showInNav)
        .map((p) => ({ name: nameOf(p.name, locale), href: p.isHome ? "/" : `/${p.slug}`, isHome: p.isHome })),
      catalog: resolveCanvasCatalog(collectCatalogQueries(sections, storeSectionRegistry), catalog, locale),
      renderClassic: (part) => <ClassicPlaceholder part={part} />,
    };
  }, [baseCtx, page.content.sections, header, footer, pages, locale, catalog]);

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
      const result = await publish(initial.storeId);
      if (result.success) {
        setIsLive(true);
        toast.success(t("published", { number: result.data.revisionNumber }));
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
        if (!isImageSelection(instance, selection)) return;
        if (state.rail !== "explore") state.setRail("explore");
        setPanelOpen(true);
      }),
    [store],
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
        onPublish={() => void onPublish()}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />

      {saveStatus === "conflict" && (
        <div role="alert" className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {t("conflict")}
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            {t("reload")}
          </Button>
        </div>
      )}

      <EditorDndProvider store={store} commands={commands} storeId={initial.storeId} readOnly={initial.readOnly}>
      <div className="flex min-h-0 flex-1">
        <EditorRail store={store} panelOpen={panelOpen} onToggle={toggleRail} />
        {panelOpen && (
          <aside aria-label={t(`rail.${rail}`)} className="flex w-[300px] shrink-0 flex-col border-e bg-background">
            {rail === "add" && (
              <AddPanel
                store={store}
                commands={commands}
                uiLocale={uiLocale}
                preview={{ ctx: baseCtx, catalog, designSystem, defaultLocale, fontClassName: initial.fontClassName }}
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
              <FormsPanel storeId={initial.storeId} readOnly={initial.readOnly} store={store} commands={commands} forms={forms} onForms={setForms} />
            )}
            {rail === "explore" && (
              <ExplorePanel storeId={initial.storeId} readOnly={initial.readOnly} category={initial.category} uiLocale={uiLocale} commands={commands} />
            )}
            {rail === "layers" && <LayersPanel store={store} commands={commands} uiLocale={uiLocale} />}
            {rail === "media" && <MediaPanel storeId={initial.storeId} readOnly={initial.readOnly} commands={commands} />}
            {rail === "pages" && (
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <PagesPanel storeId={initial.storeId} store={store} uiLocale={uiLocale} />
              </div>
            )}
            {rail === "brand" && <BrandPanel store={store} storeId={initial.storeId} readOnly={initial.readOnly} />}
          </aside>
        )}

        <main className="min-w-0 flex-1">
          <EditorCanvas
            ctx={ctx}
            sections={page.content.sections}
            header={header}
            footer={footer}
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
        </main>

        <aside aria-label={t("sidebar.label")} className="hidden w-[320px] shrink-0 border-s bg-background lg:block">
          <EditorSidebar store={store} storeId={initial.storeId} readOnly={initial.readOnly} catalog={catalog} uiLocale={uiLocale} />
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
        storeId={initial.storeId}
        readOnly={initial.readOnly}
        hideTrigger
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onPick={(asset) => commands.applyImage(asset.url)}
      />
    </div>
  );
}

function ClassicPlaceholder({ part }: { part: string }) {
  const t = useTranslations("storeEditor.classic");
  return (
    <div className="mx-auto my-3 w-[calc(100%-2rem)] max-w-(--sf-max-width,1200px) rounded-xl border-2 border-dashed border-(--sf-line) bg-(--sf-shelf) p-6 text-center">
      <p className="font-semibold">{t(`${part}.title` as never)}</p>
      <p className="mt-1 text-sm text-(--sf-muted)">{t("note")}</p>
    </div>
  );
}
