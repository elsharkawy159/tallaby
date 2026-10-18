"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import {
  ArrowRight,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  GripVertical,
  LoaderCircle,
  Monitor,
  Palette,
  PanelTop,
  Plus,
  Redo2,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  UploadCloud,
} from "lucide-react";
import { useStore } from "zustand";
import type { DesignSystem, SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  SECTION_CATEGORIES,
  collectCatalogQueries,
  storeSectionRegistry,
  type AnySectionDefinition,
  type RenderContext,
  type StoreProfile,
} from "@workspace/store-sections/render";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
import { EditorCanvas } from "./editor-canvas.client";
import type { EditorCategory, EditorProduct } from "./editor.data";
import { SectionInspector } from "./editor-inspector.client";
import { createInstance, duplicateSection, insertSection, moveSection, removeSection, resolveCanvasCatalog, updateSection } from "./editor.lib";
import { createPage, deletePage, publish, updatePage } from "./editor.server";
import { createEditorStore, hasPendingChanges, type EditorPage, type EditorStore } from "./editor.store";
import { useEditorAutosave } from "./use-editor-autosave.client";
import { useStorePreview } from "./use-store-preview.client";

type Catalog = { products: EditorProduct[]; categories: EditorCategory[] };

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
};

const nameOf = (value: { ar?: string; en?: string }, locale: string) => (locale === "en" ? value.en || value.ar : value.ar || value.en) || "";
const label = (value: { ar: string; en: string }, locale: string) => (locale === "en" ? value.en : value.ar) || value.ar;

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

function EditorShell({ initial, store }: { initial: EditorInitial; store: EditorStore }) {
  const t = useTranslations("storeEditor");
  const uiLocale = useLocale();
  const state = useStore(store);
  const { flush, saveStatus } = useEditorAutosave(initial.storeId, store);
  const [publishing, setPublishing] = useState(false);
  const [isLive, setIsLive] = useState(initial.isLive);
  const preview = useStorePreview(initial.storeId, flush);

  const page = state.pages.find((p) => p.id === state.activePageId) ?? state.pages[0]!;
  const selected =
    state.selection?.target === "page"
      ? page.content.sections.find((s) => s.id === (state.selection as { sectionId: string }).sectionId) ?? null
      : state.selection?.target === "header"
        ? state.header
        : state.selection?.target === "footer"
          ? state.footer
          : null;
  const selectedDefinition = selected ? storeSectionRegistry.get(selected.sectionId) : undefined;

  // Keyboard: undo / redo.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      event.preventDefault();
      if (event.shiftKey) store.getState().redo();
      else store.getState().undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);

  const ctx = useMemo<RenderContext>(() => {
    const sections = [...page.content.sections, ...(state.header ? [state.header] : []), ...(state.footer ? [state.footer] : [])];
    const catalog = resolveCanvasCatalog(collectCatalogQueries(sections, storeSectionRegistry), initial.catalog, state.locale);
    return {
      mode: "edit",
      locale: state.locale,
      dir: state.locale === "ar" ? "rtl" : "ltr",
      store: initial.store,
      pages: state.pages
        .filter((p) => p.isHome || p.showInNav)
        .map((p) => ({ name: nameOf(p.name, state.locale), href: p.isHome ? "/" : `/${p.slug}`, isHome: p.isHome })),
      catalog,
      Link: ({ href, className, children }) => (
        <a href={href} className={className}>
          {children}
        </a>
      ),
      imageUrl: (src) => (src && /^(https?:)?\/\//.test(src) ? src : src ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sellers/${src}` : null),
      formatPrice: (amount) => new Intl.NumberFormat(state.locale === "ar" ? "ar-EG" : "en-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(amount),
      renderCartButton: () => <span className="inline-flex h-9 items-center rounded-full border border-(--sf-line) px-3 text-sm">🛒</span>,
      renderAddToCart: () => <span className="inline-flex h-8 items-center justify-center rounded-md bg-(--sf-brand) px-3 text-xs font-semibold text-white">{t("canvas.addToCart")}</span>,
      renderClassic: (part) => <ClassicPlaceholder part={part} />,
    };
  }, [page.content.sections, state.header, state.footer, state.pages, state.locale, initial.catalog, initial.store, t]);

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

  const editSelected = (next: SectionInstance) => {
    const selection = state.selection;
    if (!selection) return;
    if (selection.target === "page") state.editPage(page.id, (content) => updateSection(content, selection.sectionId, () => next));
    else state.editChrome(selection.target, next);
  };

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/stores/${initial.storeId}/website`}>
            <ArrowRight className="ltr:rotate-180" aria-hidden />
            <span className="hidden sm:inline">{t("back")}</span>
          </Link>
        </Button>
        <span className="hidden truncate font-semibold md:inline">{initial.store.name}</span>
        <select
          aria-label={t("pageLabel")}
          className="h-9 max-w-44 rounded-md border bg-background px-2 text-sm"
          value={page.id}
          onChange={(e) => state.setActivePage(e.target.value)}
        >
          {state.pages.map((p) => (
            <option key={p.id} value={p.id}>
              {nameOf(p.name, uiLocale) || p.slug}
            </option>
          ))}
        </select>
        {initial.locales.length > 1 && (
          <div role="group" aria-label={t("editingLanguage")} className="flex rounded-md border p-0.5">
            {initial.locales.map((locale) => (
              <button
                key={locale}
                type="button"
                aria-pressed={state.locale === locale}
                onClick={() => state.setLocale(locale)}
                className={cn("rounded px-2 py-1 text-xs font-semibold uppercase", state.locale === locale && "bg-muted")}
              >
                {locale}
              </button>
            ))}
          </div>
        )}
        <div role="group" aria-label={t("device")} className="ms-auto hidden rounded-md border p-0.5 sm:flex">
          {([
            ["desktop", Monitor],
            ["tablet", Tablet],
            ["mobile", Smartphone],
          ] as const).map(([device, Icon]) => (
            <button
              key={device}
              type="button"
              aria-pressed={state.device === device}
              aria-label={t(`devices.${device}`)}
              onClick={() => state.setDevice(device)}
              className={cn("rounded p-1.5", state.device === device && "bg-muted")}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={() => state.undo()} disabled={state.past.length === 0} aria-label={t("undo")}>
          <Undo2 className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => state.redo()} disabled={state.future.length === 0} aria-label={t("redo")}>
          <Redo2 className="size-4" />
        </Button>
        <SaveBadge status={saveStatus} />
        <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
          <a href={initial.storeUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            {t("viewStore")}
          </a>
        </Button>
        {initial.previewEnabled && (
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
            onClick={preview.open}
            disabled={preview.opening || initial.readOnly || saveStatus === "conflict"}
          >
            {preview.opening ? <LoaderCircle className="animate-spin" aria-hidden /> : <Eye aria-hidden />}
            {t("previewOnStore")}
          </Button>
        )}
        <Button size="sm" onClick={onPublish} disabled={publishing || initial.readOnly || saveStatus === "conflict"}>
          {publishing ? <LoaderCircle className="animate-spin" aria-hidden /> : <UploadCloud aria-hidden />}
          {t(isLive ? "publishChanges" : "publish")}
        </Button>
      </header>

      {saveStatus === "conflict" && (
        <div role="alert" className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {t("conflict")}
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            {t("reload")}
          </Button>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="flex min-h-0 flex-col border-e">
          <div role="tablist" className="flex border-b">
            {([
              ["sections", PanelTop],
              ["pages", FileText],
              ["theme", Palette],
            ] as const).map(([panel, Icon]) => (
              <button
                key={panel}
                type="button"
                role="tab"
                aria-selected={state.panel === panel}
                onClick={() => state.setPanel(panel)}
                className={cn("flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium", state.panel === panel ? "border-b-2 border-primary" : "text-muted-foreground")}
              >
                <Icon className="size-4" aria-hidden />
                {t(`panels.${panel}`)}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {state.panel === "sections" && <SectionsPanel store={store} page={page} uiLocale={uiLocale} />}
            {state.panel === "pages" && <PagesPanel storeId={initial.storeId} store={store} uiLocale={uiLocale} />}
            {state.panel === "theme" && <ThemePanel store={store} />}
          </div>
        </aside>

        <EditorCanvas
          ctx={ctx}
          sections={page.content.sections}
          header={state.header}
          footer={state.footer}
          designSystem={state.designSystem}
          defaultLocale={state.defaultLocale}
          device={state.device}
          selection={state.selection}
          onSelect={(selection) => state.select(selection)}
        />

        <aside className="hidden min-h-0 overflow-y-auto border-s p-4 lg:block">
          {selected && selectedDefinition ? (
            <SectionInspector
              key={selected.id}
              definition={selectedDefinition}
              instance={selected}
              onChange={editSelected}
              locale={state.locale}
              defaultLocale={state.defaultLocale}
              uiLocale={uiLocale}
              catalog={initial.catalog}
              storeId={initial.storeId}
              readOnly={initial.readOnly}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("inspector.empty")}</p>
          )}
        </aside>
      </div>
    </div>
  );
}

function SaveBadge({ status }: { status: string }) {
  const t = useTranslations("storeEditor.save");
  return (
    <Badge variant={status === "error" || status === "conflict" ? "destructive" : "outline"} className="hidden whitespace-nowrap sm:inline-flex">
      {status === "saving" && <LoaderCircle className="size-3 animate-spin" aria-hidden />}
      {t(status)}
    </Badge>
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

function SectionsPanel({ store, page, uiLocale }: { store: EditorStore; page: EditorPage; uiLocale: string }) {
  const t = useTranslations("storeEditor.sections");
  const state = useStore(store);
  const [adding, setAdding] = useState(false);
  const pageSections = storeSectionRegistry.list().filter((d) => !d.chrome);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    state.editPage(page.id, (content) => moveSection(content, result.source.index, result.destination!.index));
  };
  const add = (definition: AnySectionDefinition) => {
    const instance = createInstance(definition);
    state.editPage(page.id, (content) => insertSection(content, instance));
    state.select({ target: "page", sectionId: instance.id });
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      <ChromeRow label={t("header")} active={state.selection?.target === "header"} onClick={() => state.select({ target: "header" })} />
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="page-sections">
          {(provided) => (
            <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
              {page.content.sections.map((instance, index) => {
                const definition = storeSectionRegistry.get(instance.sectionId);
                const active = state.selection?.target === "page" && state.selection.sectionId === instance.id;
                return (
                  <Draggable key={instance.id} draggableId={instance.id} index={index}>
                    {(drag) => (
                      <li
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        className={cn("group flex items-center gap-1 rounded-md border bg-background px-1.5 py-1.5 text-sm", active && "border-primary")}
                      >
                        <span {...drag.dragHandleProps} aria-label={t("drag")} className="cursor-grab text-muted-foreground">
                          <GripVertical className="size-4" />
                        </span>
                        <button type="button" className="min-w-0 flex-1 truncate text-start" onClick={() => state.select({ target: "page", sectionId: instance.id })}>
                          {definition ? label(definition.displayName, uiLocale) : instance.sectionId}
                        </button>
                        <IconButton label={t("duplicate")} onClick={() => state.editPage(page.id, (content) => duplicateSection(content, instance.id).content)}>
                          <Copy className="size-3.5" />
                        </IconButton>
                        <IconButton
                          label={t("remove")}
                          onClick={() => {
                            state.editPage(page.id, (content) => removeSection(content, instance.id));
                            state.select(null);
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </IconButton>
                      </li>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      <ChromeRow label={t("footer")} active={state.selection?.target === "footer"} onClick={() => state.select({ target: "footer" })} />

      {adding ? (
        <div className="space-y-3 rounded-lg border p-2">
          {SECTION_CATEGORIES.filter((category) => pageSections.some((d) => d.category === category)).map((category) => (
            <div key={category}>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">{t(`categories.${category}`)}</p>
              <ul className="space-y-1">
                {pageSections
                  .filter((d) => d.category === category)
                  .map((definition) => (
                    <li key={definition.id}>
                      <button type="button" onClick={() => add(definition)} className="w-full rounded-md px-2 py-1.5 text-start text-sm hover:bg-muted">
                        <span className="block font-medium">{label(definition.displayName, uiLocale)}</span>
                        <span className="block text-xs text-muted-foreground">{label(definition.description, uiLocale)}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setAdding(false)}>
            {t("cancel")}
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setAdding(true)} disabled={page.content.sections.length >= 80}>
          <Plus aria-hidden />
          {t("add")}
        </Button>
      )}
    </div>
  );
}

function ChromeRow({ label: text, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("w-full rounded-md border border-dashed px-2 py-1.5 text-start text-xs text-muted-foreground", active && "border-primary text-foreground")}>
      {text}
    </button>
  );
}

function IconButton({ label: text, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={text} title={text} onClick={onClick} className="rounded p-1 text-muted-foreground opacity-0 hover:bg-muted group-hover:opacity-100 focus-visible:opacity-100">
      {children}
    </button>
  );
}

function PagesPanel({ storeId, store, uiLocale }: { storeId: string; store: EditorStore; uiLocale: string }) {
  const t = useTranslations("storeEditor.pages");
  const tErrors = useTranslations("storeEditor.errors");
  const state = useStore(store);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    const result = await createPage(storeId, { name: { [state.defaultLocale]: name }, slug });
    setBusy(false);
    if (!result.success) {
      toast.error(tErrors(result.error));
      return;
    }
    const pageName = { [state.defaultLocale]: name } as { ar?: string; en?: string };
    state.setPages([...state.pages, { id: result.data.id, slug: result.data.slug, isHome: false, name: pageName, seo: {}, showInNav: true, content: { sections: [] }, version: 1 }]);
    state.setActivePage(result.data.id);
    setName("");
    setSlug("");
  };

  const toggleNav = async (page: EditorPage) => {
    const result = await updatePage(storeId, page.id, { showInNav: !page.showInNav });
    if (!result.success) return toast.error(tErrors(result.error));
    state.setPages(state.pages.map((p) => (p.id === page.id ? { ...p, showInNav: !p.showInNav } : p)));
  };

  const remove = async (page: EditorPage) => {
    if (hasPendingChanges(state) && state.dirtyPages[page.id]) return toast.error(tErrors("saveFirst"));
    const result = await deletePage(storeId, page.id);
    if (!result.success) return toast.error(tErrors(result.error));
    state.setPages(state.pages.filter((p) => p.id !== page.id));
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-1">
        {state.pages.map((page) => (
          <li key={page.id} className={cn("flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm", page.id === state.activePageId && "border-primary")}>
            <button type="button" className="min-w-0 flex-1 truncate text-start" onClick={() => state.setActivePage(page.id)}>
              {nameOf(page.name, uiLocale) || page.slug}
              <span dir="ltr" className="ms-1 text-xs text-muted-foreground">
                /{page.isHome ? "" : page.slug}
              </span>
            </button>
            {!page.isHome && (
              <>
                <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => void toggleNav(page)}>
                  {page.showInNav ? t("inMenu") : t("hidden")}
                </button>
                <button type="button" aria-label={t("delete")} onClick={() => void remove(page)} className="text-muted-foreground">
                  <Trash2 className="size-3.5" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <form
        className="space-y-2 rounded-lg border p-2"
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
      >
        <p className="text-sm font-semibold">{t("new")}</p>
        <div className="space-y-1">
          <Label htmlFor="new-page-name">{t("name")}</Label>
          <Input id="new-page-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-page-slug">{t("slug")}</Label>
          <Input id="new-page-slug" dir="ltr" value={slug} placeholder="about" onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
          <p className="text-xs text-muted-foreground">{t("slugHint")}</p>
        </div>
        <Button type="submit" size="sm" className="w-full" disabled={busy || !name.trim() || !slug}>
          {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
          {t("create")}
        </Button>
      </form>
    </div>
  );
}

const COLOR_KEYS = ["primary", "background", "foreground", "muted", "border", "secondary", "accent"] as const;

function ThemePanel({ store }: { store: EditorStore }) {
  const t = useTranslations("storeEditor.theme");
  const state = useStore(store);
  const colors = state.designSystem.colors ?? {};
  const setColor = (key: (typeof COLOR_KEYS)[number], value: string | undefined) =>
    state.editDesign((ds) => ({ ...ds, colors: { ...ds.colors, [key]: value } }));
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("intro")}</p>
      {COLOR_KEYS.map((key) => (
        <div key={key} className="flex items-center gap-2">
          <input
            type="color"
            aria-label={t(`colors.${key}`)}
            value={colors[key] && /^#[0-9a-f]{6}$/i.test(colors[key]!) ? colors[key] : "#ffffff"}
            onChange={(e) => setColor(key, e.target.value)}
            className="h-8 w-10 rounded border"
          />
          <span className="flex-1 text-sm">{t(`colors.${key}`)}</span>
          {colors[key] && (
            <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => setColor(key, undefined)}>
              {t("reset")}
            </button>
          )}
        </div>
      ))}
      <div className="space-y-1">
        <Label htmlFor="theme-radius">{t("radius")}</Label>
        <input
          id="theme-radius"
          type="range"
          min={0}
          max={24}
          value={state.designSystem.spacing?.borderRadius ?? 12}
          onChange={(e) => state.editDesign((ds) => ({ ...ds, spacing: { ...ds.spacing, borderRadius: Number(e.target.value) } }))}
          className="w-full"
        />
      </div>
    </div>
  );
}
