"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, FileText, LoaderCircle, Lock, Monitor, RotateCcw, Smartphone, Sparkles } from "lucide-react";
import type { SiteLocale } from "@workspace/store-sections";
import { findFontPairing } from "@workspace/store-sections/fonts";
import type { StoreProfile } from "@workspace/store-sections/render";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { SitePreview, type PreviewCatalog, type PreviewDevice } from "../../preview/site-preview.client";
import { COLOR_FIELDS } from "../../lib/design.lib";
import type { TemplateCardView, TemplatePreviewView } from "../../templates.dto";
import { useEditorAdapter } from "../../adapter.client";
import { loadTemplatePreview } from "./template-thumbnail.client";

type Localized = { ar?: string; en?: string };

/** What the dialog needs from the editor. */
export type TemplatePreviewHost = {
  storeId: string;
  store: StoreProfile;
  catalog: PreviewCatalog;
  fontClassName: string;
  defaultLocale: SiteLocale;
  readOnly: boolean;
  /** Saves pending editor changes; false when they could not be saved. */
  flush: () => Promise<boolean>;
};

/**
 * Template preview (owner request 2026-10-18): the template's pages rendered
 * live with this store's products, its details, pages and sections, and
 * "Use template". Applying saves the editor first (the merge reads the saved
 * drafts), writes drafts only, then reloads the editor on the new drafts.
 */
export function TemplatePreviewDialog({
  template,
  current,
  uiLocale,
  host,
  onOpenChange,
}: {
  template: TemplateCardView | null;
  current: boolean;
  uiLocale: string;
  host: TemplatePreviewHost;
  onOpenChange: (open: boolean) => void;
}) {
  const templatesApi = useEditorAdapter().templates;
  const t = useTranslations("storeEditor.templates");
  const tw = useTranslations("websiteTemplates");
  const [preview, setPreview] = useState<TemplatePreviewView | null>(null);
  const [failed, setFailed] = useState(false);
  const [pageSlug, setPageSlug] = useState<string | null>(null);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [locale, setLocale] = useState<SiteLocale>(host.defaultLocale);
  const [applying, startApplying] = useTransition();
  const key = template?.key;

  useEffect(() => {
    if (!key) return;
    setPageSlug(null);
    setFailed(false);
    setPreview(null);
    let live = true;
    void loadTemplatePreview(templatesApi, host.storeId, key).then((data) => {
      if (!live) return;
      if (data) setPreview(data);
      else setFailed(true);
    });
    return () => {
      live = false;
    };
  }, [key, templatesApi, host.storeId]);

  const text = (value: Localized) => (uiLocale === "en" ? value.en || value.ar : value.ar || value.en) || "";
  const page = preview ? (preview.pages.find((p) => p.slug === pageSlug) ?? preview.pages.find((p) => p.isHome) ?? preview.pages[0]) : undefined;
  const fonts = preview ? findFontPairing(preview.designSystem.typography) : null;
  const sectionCount = template?.pages.reduce((sum, p) => sum + p.sections.length, 0) ?? 0;

  const onUse = () =>
    startApplying(async () => {
      if (!template || !templatesApi) return;
      if (!(await host.flush())) {
        toast.error(t("saveFirst"));
        return;
      }
      const result = await templatesApi.apply(template.key);
      if (!result.success) {
        toast.error(tw(`errors.${result.error}`));
        return;
      }
      toast.success(tw("applied", { name: text(template.name) }));
      window.location.reload();
    });

  return (
    <Dialog open={template !== null} onOpenChange={(open) => !applying && onOpenChange(open)}>
      <DialogContent className="flex h-[90dvh] max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[min(1200px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1200px,calc(100vw-2rem))]">
        {template && (
          <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-1">
            <div className="flex min-h-0 flex-col border-b bg-muted/30 lg:border-e lg:border-b-0">
              <div className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2 pe-12 lg:pe-3">
                <div role="tablist" aria-label={t("pages")} className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
                  {(preview?.pages ?? []).map((p) => (
                    <button
                      key={p.slug}
                      type="button"
                      role="tab"
                      aria-selected={page?.slug === p.slug}
                      onClick={() => setPageSlug(p.slug)}
                      className={cn(
                        "shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors",
                        page?.slug === p.slug ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {(["ar", "en"] as const).map((l) => (
                    <Button key={l} type="button" variant={locale === l ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setLocale(l)}>
                      {l.toUpperCase()}
                    </Button>
                  ))}
                  <Button type="button" variant={device === "desktop" ? "secondary" : "ghost"} size="icon" className="size-7" onClick={() => setDevice("desktop")} aria-label={t("desktop")}>
                    <Monitor className="size-3.5" />
                  </Button>
                  <Button type="button" variant={device === "mobile" ? "secondary" : "ghost"} size="icon" className="size-7" onClick={() => setDevice("mobile")} aria-label={t("mobile")}>
                    <Smartphone className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 p-2">
                {preview && page ? (
                  <SitePreview
                    key={`${template.key}:${page.slug}`}
                    className="h-full"
                    store={host.store}
                    // A store with no products yet sees the template with its demo store.
                    catalog={host.catalog.products.length || !preview.demo ? host.catalog : { products: preview.demo.products, categories: preview.demo.categories }}
                    sections={page.sections}
                    header={preview.header}
                    footer={preview.footer}
                    designSystem={preview.designSystem}
                    locale={locale}
                    defaultLocale={host.defaultLocale}
                    device={device}
                    fontClassName={host.fontClassName}
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-muted-foreground">
                    {failed ? t("previewFailed") : <LoaderCircle className="size-5 animate-spin" aria-label={t("loading")} />}
                  </div>
                )}
              </div>
            </div>

            <aside className="flex min-h-0 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
                <div className="space-y-2 pe-8">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {current && (
                      <Badge className="gap-1">
                        <Check className="size-3" />
                        {tw("current")}
                      </Badge>
                    )}
                    {template.isDefault && <Badge variant="outline">{tw("default")}</Badge>}
                    {template.isPremium && (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="size-3" />
                        {tw("soon")}
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="text-lg">{text(template.name)}</DialogTitle>
                  <DialogDescription>{text(template.description) || tw("description")}</DialogDescription>
                </div>

                <dl className="grid grid-cols-3 gap-2 text-center">
                  {[
                    [t("pagesLabel"), template.pages.length],
                    [t("sectionsLabel"), sectionCount],
                    [t("versionLabel"), template.version],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg border p-2">
                      <dt className="text-[10px] text-muted-foreground">{label}</dt>
                      <dd className="text-sm font-semibold tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>

                {preview && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold">{t("look")}</p>
                    <div className="flex overflow-hidden rounded-md border">
                      {COLOR_FIELDS.map(({ key: colorKey, classic }) => (
                        <span key={colorKey} className="h-6 flex-1" style={{ background: preview.designSystem.colors[colorKey] ?? classic }} title={colorKey} />
                      ))}
                    </div>
                    <p dir="ltr" className="text-start text-xs text-muted-foreground rtl:text-end">
                      {fonts && (fonts.heading === fonts.body ? fonts.heading : `${fonts.heading} · ${fonts.body}`)}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-semibold">{t("pagesAndSections")}</p>
                  <ul className="space-y-2">
                    {template.pages.map((p) => (
                      <li key={p.slug} className="rounded-lg border">
                        <button
                          type="button"
                          onClick={() => setPageSlug(p.slug)}
                          className={cn("flex w-full items-center gap-1.5 px-2.5 py-1.5 text-start text-xs font-medium", page?.slug === p.slug && "text-primary")}
                        >
                          <FileText className="size-3.5 shrink-0" />
                          <span className="truncate">{p.name}</span>
                          {p.isHome && <span className="text-[10px] font-normal text-muted-foreground">· {t("home")}</span>}
                          <span className="ms-auto text-[10px] font-normal text-muted-foreground">{t("sectionsCount", { count: p.sections.length })}</span>
                        </button>
                        <ol className="flex flex-wrap gap-1 border-t px-2.5 py-2">
                          {p.sections.map((section, index) => (
                            <li key={index} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                              {text(section)}
                            </li>
                          ))}
                        </ol>
                      </li>
                    ))}
                  </ul>
                </div>

                <ul className="list-disc space-y-1 ps-4 text-xs text-muted-foreground">
                  <li>{tw("confirm.keeps")}</li>
                  <li>{tw("confirm.draft")}</li>
                  <li>{tw("confirm.untouched")}</li>
                </ul>
              </div>

              <div className="flex shrink-0 gap-2 border-t p-3">
                <Button type="button" variant="outline" className="shrink-0" disabled={applying} onClick={() => onOpenChange(false)}>
                  {tw("cancel")}
                </Button>
                <Button type="button" className="min-w-0 flex-1" disabled={host.readOnly || applying || template.isPremium} onClick={onUse}>
                  {applying ? <LoaderCircle className="animate-spin" /> : current ? <RotateCcw /> : <Sparkles />}
                  <span className="truncate">{current ? tw("reapply") : tw("use")}</span>
                </Button>
              </div>
            </aside>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
