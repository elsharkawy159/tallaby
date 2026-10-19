"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileText, LayoutTemplate, LoaderCircle, Monitor, Smartphone, Sparkles } from "lucide-react";
import { useStore } from "zustand";
import type { SiteLocale } from "@workspace/store-sections";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { SitePreview, type PreviewDevice } from "@/app/(main)/stores/[storeId]/website/_components/site-preview.client";
import type { TemplateCardView, TemplatePreviewView } from "@/app/(main)/stores/[storeId]/website/templates/templates.dto";
import { templatePreview } from "@/app/(main)/stores/[storeId]/website/templates/templates.server";
import type { EditorCommands } from "../../lib/editor-commands.lib";
import { allTemplatePages, templatePagesFor, type TemplatePageOption } from "../../lib/editor-templates.lib";
import type { EditorStore } from "../../state/editor.store";
import { nameOf } from "../pages-panel.client";
import { TemplatesPanel } from "./templates-panel.client";
import type { TemplatePreviewHost } from "./template-preview-dialog.client";

type Localized = { ar?: string; en?: string };

/** Template content by key, kept for the editor session (templates are read-only here). */
const previewCache = new Map<string, TemplatePreviewView>();

/**
 * Add › Templates: designs for the page being edited (the matching page of
 * each template, by home page or address), applied to this page only, and
 * the whole-site templates gallery. Opens by itself after a new page is
 * created.
 */
export function PageTemplatesTab({
  store,
  commands,
  uiLocale,
  templates,
  currentKey,
  host,
}: {
  store: EditorStore;
  commands: EditorCommands;
  uiLocale: string;
  templates: TemplateCardView[];
  currentKey: string;
  host: TemplatePreviewHost;
}) {
  const t = useTranslations("storeEditor.pageTemplates");
  const pages = useStore(store, (s) => s.pages);
  const activePageId = useStore(store, (s) => s.activePageId);
  const page = pages.find((p) => p.id === activePageId) ?? pages[0]!;
  const [scope, setScope] = useState<"page" | "site">("page");
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<{ option: TemplatePageOption; pageId: string } | null>(null);
  const text = (value: Localized) => (uiLocale === "en" ? value.en || value.ar : value.ar || value.en) || "";

  const matches = templatePagesFor(templates, page);
  const options = showAll ? allTemplatePages(templates) : matches;
  const pageName = nameOf(page.name, uiLocale) || page.slug;
  const address = page.isHome ? "/" : `/${page.slug}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2.5 border-b p-3">
        <div role="tablist" className="grid grid-cols-2 gap-1 text-xs">
          {(["page", "site"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={scope === key}
              onClick={() => setScope(key)}
              className={cn(
                "rounded-md border px-2 py-1.5 font-medium transition-colors",
                scope === key ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`scope.${key}`)}
            </button>
          ))}
        </div>
        {scope === "page" && (
          <p className="text-xs text-muted-foreground">
            {t("forPage", { name: pageName })}{" "}
            <span dir="ltr" className="font-mono">
              {address}
            </span>
          </p>
        )}
      </div>

      {scope === "site" ? (
        <TemplatesPanel templates={templates} currentKey={currentKey} uiLocale={uiLocale} host={host} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {options.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-4 text-center">
              <LayoutTemplate className="mx-auto size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">{t("emptyTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("emptyBody")}</p>
              <div className="flex flex-col gap-2">
                {templates.length > 0 && (
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowAll(true)}>
                    {t("showAll")}
                  </Button>
                )}
                <Button type="button" size="sm" variant="ghost" onClick={() => store.getState().setAddTab("sections")}>
                  {t("startBlank")}
                </Button>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {options.map((option) => (
                <li key={`${option.template.key}:${option.page.slug}`}>
                  <button
                    type="button"
                    onClick={() => setOpen({ option, pageId: page.id })}
                    className="group w-full overflow-hidden rounded-xl border bg-card text-start transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex flex-col gap-1 overflow-hidden border-b bg-muted/50 p-2.5">
                      <span className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                        <FileText className="size-3" aria-hidden />
                        {option.page.name}
                        <span dir="ltr" className="ms-auto font-mono font-normal">
                          {option.page.isHome ? "/" : `/${option.page.slug}`}
                        </span>
                      </span>
                      {option.page.sections.slice(0, 5).map((section, index) => (
                        <span key={index} className="truncate rounded border bg-background px-2 py-1 text-[10px]">
                          {text(section)}
                        </span>
                      ))}
                      {option.page.sections.length > 5 && (
                        <span className="text-[10px] text-muted-foreground">{t("more", { count: option.page.sections.length - 5 })}</span>
                      )}
                    </span>
                    <span className="flex items-center justify-between gap-2 p-2.5">
                      <span className="truncate text-sm font-semibold">{text(option.template.name)}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{t("sectionsCount", { count: option.page.sections.length })}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {showAll && matches.length > 0 && (
            <Button type="button" size="sm" variant="ghost" className="mt-3 w-full" onClick={() => setShowAll(false)}>
              {t("showMatching")}
            </Button>
          )}
          {!showAll && options.length > 0 && templates.length > 0 && (
            <Button type="button" size="sm" variant="ghost" className="mt-3 w-full text-muted-foreground" onClick={() => setShowAll(true)}>
              {t("showAll")}
            </Button>
          )}
        </div>
      )}

      <PageTemplateDialog
        open={open}
        store={store}
        commands={commands}
        uiLocale={uiLocale}
        host={host}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}

/**
 * Preview of one template page with this store's own look (colours, fonts,
 * header and footer), since only the page's sections are copied. "Apply to
 * this page" replaces that page's content in one undo step.
 */
function PageTemplateDialog({
  open,
  store,
  commands,
  uiLocale,
  host,
  onClose,
}: {
  open: { option: TemplatePageOption; pageId: string } | null;
  store: EditorStore;
  commands: EditorCommands;
  uiLocale: string;
  host: TemplatePreviewHost;
  onClose: () => void;
}) {
  const t = useTranslations("storeEditor.pageTemplates");
  const tTemplates = useTranslations("storeEditor.templates");
  const header = useStore(store, (s) => s.header);
  const footer = useStore(store, (s) => s.footer);
  const designSystem = useStore(store, (s) => s.designSystem);
  const pages = useStore(store, (s) => s.pages);
  const [preview, setPreview] = useState<TemplatePreviewView | null>(null);
  const [failed, setFailed] = useState(false);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [locale, setLocale] = useState<SiteLocale>(host.defaultLocale);
  const key = open?.option.template.key;

  useEffect(() => {
    if (!key) return;
    setFailed(false);
    const cached = previewCache.get(key);
    setPreview(cached ?? null);
    if (cached) return;
    let live = true;
    void templatePreview(host.storeId, key).then((result) => {
      if (!live) return;
      if (result.success) {
        previewCache.set(key, result.data);
        setPreview(result.data);
      } else setFailed(true);
    });
    return () => {
      live = false;
    };
  }, [key, host.storeId]);

  const text = (value: Localized) => (uiLocale === "en" ? value.en || value.ar : value.ar || value.en) || "";
  const templatePage = open && preview ? preview.pages.find((p) => p.slug === open.option.page.slug && p.isHome === open.option.page.isHome) : undefined;
  const target = open ? pages.find((p) => p.id === open.pageId) : undefined;
  const replacing = target?.content.sections.length ?? 0;

  const apply = () => {
    if (!open || !templatePage || !target) return;
    if (!commands.applyTemplatePage(target.id, templatePage.content)) return;
    toast.success(t("applied", { name: nameOf(target.name, uiLocale) || target.slug }), {
      action: { label: t("undo"), onClick: () => store.getState().undo() },
    });
    onClose();
  };

  return (
    <Dialog open={open !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex h-[90dvh] max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[min(1100px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1100px,calc(100vw-2rem))]">
        {open && (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3 pe-12">
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base">
                  {text(open.option.template.name)} · {open.option.page.name}
                </DialogTitle>
                <DialogDescription className="text-xs">{t("previewNote")}</DialogDescription>
              </div>
              <div className="flex items-center gap-1">
                {(["ar", "en"] as const).map((l) => (
                  <Button key={l} type="button" variant={locale === l ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setLocale(l)}>
                    {l.toUpperCase()}
                  </Button>
                ))}
                <Button type="button" variant={device === "desktop" ? "secondary" : "ghost"} size="icon" className="size-7" onClick={() => setDevice("desktop")} aria-label={tTemplates("desktop")}>
                  <Monitor className="size-3.5" />
                </Button>
                <Button type="button" variant={device === "mobile" ? "secondary" : "ghost"} size="icon" className="size-7" onClick={() => setDevice("mobile")} aria-label={tTemplates("mobile")}>
                  <Smartphone className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-muted/30 p-2">
              {templatePage ? (
                <SitePreview
                  className="h-full"
                  store={host.store}
                  catalog={host.catalog}
                  sections={templatePage.sections}
                  header={header}
                  footer={footer}
                  designSystem={designSystem}
                  locale={locale}
                  defaultLocale={host.defaultLocale}
                  device={device}
                  fontClassName={host.fontClassName}
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  {failed || (preview && !templatePage) ? tTemplates("previewFailed") : <LoaderCircle className="size-5 animate-spin" aria-label={tTemplates("loading")} />}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t p-3">
              <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                {replacing > 0 ? t("replaces", { count: replacing }) : t("onlyThisPage")}
              </p>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="button" disabled={host.readOnly || !templatePage || !target} onClick={apply}>
                <Sparkles />
                {t("apply")}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
