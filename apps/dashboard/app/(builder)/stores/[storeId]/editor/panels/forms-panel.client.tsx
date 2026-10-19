"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Boxes,
  CalendarCheck,
  CircleHelp,
  ClipboardList,
  ExternalLink,
  FileText,
  Inbox,
  LoaderCircle,
  Mail,
  MessageSquare,
  Palette,
  PhoneCall,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "zustand";
import { FORM_TEMPLATE_IDS, buildTemplateForm, getFormTemplate } from "@workspace/lib/store-forms";
import type { SectionInstance } from "@workspace/store-sections";
import {
  SITE_ROOT_CLASS,
  collectCatalogQueries,
  collectContentQueries,
  collectFormIds,
  storeSectionRegistry,
  type PublicStoreForm,
  type RenderContext,
} from "@workspace/store-sections/render";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { createFormFromTemplate } from "@/app/(main)/stores/[storeId]/website/forms/forms.server";
import type { EditorCommands } from "../lib/editor-commands.lib";
import { formSectionInstance } from "../lib/editor-library.lib";
import { resolveCanvasCatalog, resolveCanvasContent } from "../lib/editor.lib";
import type { SectionPreviewHost } from "./add/add-panel.client";
import { LazyMount } from "./add/section-library.client";
import { SectionThumbnail } from "./add/section-thumbnail.client";
import type { EditorForm } from "../server/editor.data";
import type { EditorFormSummary } from "../server/editor.dto";
import { listForms } from "../server/editor.server";
import type { EditorStore } from "../state/editor.store";

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  contact: MessageSquare,
  newsletter: Mail,
  callback: PhoneCall,
  quote: FileText,
  booking: CalendarCheck,
  productQuestion: CircleHelp,
  wholesale: Boxes,
  feedback: Star,
  returns: RotateCcw,
  customOrder: Palette,
};

/**
 * Forms tab (owner request 2026-10-18, like the reference `forms-panel.tsx`):
 * this store's forms (Website › Forms), each addable to the page as a form
 * section bound to it, and ready-made forms that are created and added in one
 * click. Submissions are stored as leads in the store's inbox (Website › Forms
 * › Inbox). The list reloads when the browser tab regains focus, since forms
 * are edited on their own page. Every card shows the form section it adds as a
 * live thumbnail, drawn like the Sections library (store theme, real fields).
 */
export function FormsPanel({
  storeId,
  readOnly,
  store,
  commands,
  forms,
  onForms,
  preview,
}: {
  storeId: string;
  readOnly: boolean;
  store: EditorStore;
  commands: EditorCommands;
  forms: EditorForm[];
  /** Fresh forms for the canvas and the inspector. */
  onForms: (forms: EditorForm[]) => void;
  /** Theme and data for the card thumbnails (the same host as Add › Sections). */
  preview: SectionPreviewHost;
}) {
  const t = useTranslations("storeEditor.forms");
  const tTemplates = useTranslations("storeForms.templates");
  const [query, setQuery] = useState("");
  const [summaries, setSummaries] = useState<Record<string, EditorFormSummary>>({});
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [, startCreating] = useTransition();
  const pages = useStore(store, (s) => s.pages);
  const activePageId = useStore(store, (s) => s.activePageId);
  const industry = useStore(store, (s) => s.industry);
  const page = pages.find((p) => p.id === activePageId) ?? pages[0];
  const inbox = `/stores/${storeId}/website/forms/submissions`;

  const reload = useCallback(async () => {
    setLoading(true);
    const result = await listForms(storeId);
    setLoading(false);
    if (!result.success) {
      toast.error(t("loadFailed"));
      return null;
    }
    onForms(result.data.forms);
    setSummaries(Object.fromEntries(result.data.summaries.map((s) => [s.id, s])));
    return result.data.forms;
  }, [storeId, onForms, t]);

  useEffect(() => {
    void reload();
    const onVisible = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  const onPage = useMemo(() => new Set(collectFormIds(page?.content.sections ?? [], storeSectionRegistry)), [page]);
  const needle = query.trim().toLowerCase();
  const shown = needle ? forms.filter((f) => f.name.toLowerCase().includes(needle)) : forms;
  const templates = needle ? FORM_TEMPLATE_IDS.filter((id) => tTemplates(`${id}.name` as never).toLowerCase().includes(needle)) : FORM_TEMPLATE_IDS;

  // Ready-made forms as they will be created (same text as createFormFromTemplate), for their thumbnails.
  const templateForms = useMemo(() => {
    const out: Record<string, { name: string; form: PublicStoreForm }> = {};
    for (const id of FORM_TEMPLATE_IDS) {
      const template = getFormTemplate(id);
      if (!template) continue;
      const input = buildTemplateForm(template, (key) => tTemplates(`${id}.${key}` as never));
      const formId = `template-${id}`;
      out[id] = {
        name: input.name,
        form: {
          id: formId,
          fields: input.fields.map((f) => ({
            key: f.key,
            type: f.type,
            label: f.label,
            required: f.required ?? false,
            width: f.width ?? "full",
            ...(f.placeholder && { placeholder: f.placeholder }),
            ...(f.options && { options: f.options }),
          })),
          submitLabel: input.settings?.submitLabel ?? "",
          successMessage: input.settings?.successMessage ?? "",
        },
      };
    }
    return out;
  }, [tTemplates]);

  // One preview form section per form and ready-made form; previews never fetch.
  const instances = useMemo(() => {
    const out = new Map<string, SectionInstance>();
    const opts = { defaultLocale: preview.defaultLocale, industry };
    for (const form of forms) {
      const instance = formSectionInstance(form, `preview-form-${form.id}`, opts);
      if (instance) out.set(form.id, instance);
    }
    for (const { name, form } of Object.values(templateForms)) {
      const instance = formSectionInstance({ id: form.id, name }, `preview-${form.id}`, opts);
      if (instance) out.set(form.id, instance);
    }
    return out;
  }, [forms, templateForms, preview.defaultLocale, industry]);
  const ctx = useMemo<RenderContext>(
    () => ({
      ...preview.ctx,
      pages: [],
      forms: { ...preview.ctx.forms, ...Object.fromEntries(Object.values(templateForms).map(({ form }) => [form.id, form])) },
      catalog: {
        ...resolveCanvasCatalog(collectCatalogQueries([...instances.values()], storeSectionRegistry), preview.catalog, preview.ctx.locale),
        counts: preview.counts,
      },
      content: resolveCanvasContent(collectContentQueries([...instances.values()], storeSectionRegistry), preview.posts),
    }),
    [instances, templateForms, preview.ctx, preview.catalog, preview.counts, preview.posts],
  );
  const thumb = (formId: string) => {
    const instance = instances.get(formId);
    return instance ? (
      <LazyMount>
        <SectionThumbnail
          instance={instance}
          ctx={ctx}
          designSystem={preview.designSystem}
          defaultLocale={preview.defaultLocale}
          fontClassName={preview.fontClassName}
          maxHeight={200}
        />
      </LazyMount>
    ) : null;
  };

  const insert = (form: EditorForm) => {
    if (!commands.addFormSection(form.id, form.name)) {
      toast.error(t("addFailed"));
      return;
    }
    toast.success(t("added", { name: form.name }), {
      description: t("addedHint"),
      action: { label: t("leads"), onClick: () => window.open(`${inbox}?form=${form.id}`, "_blank", "noopener") },
    });
  };

  // A ready-made form, built on the server in the seller's language, then added to the page.
  const onTemplate = (templateId: string) => {
    setCreating(templateId);
    startCreating(async () => {
      const result = await createFormFromTemplate(storeId, templateId);
      if (!result.success) {
        setCreating(null);
        toast.error(result.error === "limitReached" ? t("limitReached") : t("createFailed"));
        return;
      }
      const fresh = await reload();
      setCreating(null);
      const created = fresh?.find((f) => f.id === result.data.id);
      if (created) insert(created);
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Headings in the previews use the store's heading font, like the storefront. */}
      <style>{`.${SITE_ROOT_CLASS} :where(h1,h2,h3,h4){font-family:var(--sf-font-heading,var(--sf-font-body,var(--font-storefront))),system-ui,sans-serif}`}</style>
      <div className="space-y-2 border-b p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t("title")}</p>
            <p className="truncate text-xs text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="size-7" disabled={loading} onClick={() => void reload()} aria-label={t("refresh")} title={t("refresh")}>
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            </Button>
            <Button asChild variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
              <a href={inbox} target="_blank" rel="noreferrer" title={t("leadsHint")}>
                <Inbox className="size-3.5" />
                {t("leads")}
              </a>
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="ps-8" />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        <section className="space-y-2" aria-labelledby="forms-panel-yours">
          <h3 id="forms-panel-yours" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("yourForms")}
          </h3>
          {forms.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-center">
              <ClipboardList className="size-6 text-muted-foreground/60" aria-hidden />
              <p className="text-sm font-medium">{t("emptyTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("emptyText")}</p>
            </div>
          ) : shown.length === 0 ? (
            <p className="py-3 text-center text-xs text-muted-foreground">{t("noMatch")}</p>
          ) : (
            shown.map((form) => {
              const summary = summaries[form.id];
              const leads = `${inbox}?form=${form.id}`;
              return (
                <div key={form.id} className="group/card rounded-lg border bg-card p-2.5 transition-colors hover:border-primary/40">
                  <button
                    type="button"
                    onClick={() => insert(form)}
                    aria-label={`${form.name}. ${t("add")}`}
                    title={t("add")}
                    className="relative mb-2 block w-full overflow-hidden rounded-md border bg-muted/30 transition-[border-color,box-shadow] group-hover/card:border-foreground/30 group-hover/card:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {thumb(form.id)}
                    <AddOverlay label={t("add")} />
                  </button>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                      <ClipboardList className="size-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{form.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("fields", { count: summary?.fieldCount ?? form.form.fields.length })}
                        {summary && (
                          <>
                            {" · "}
                            <a href={leads} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">
                              {t("submissions", { count: summary.submissionCount })}
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                    <a
                      href={`/stores/${storeId}/website/forms/${form.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t("edit", { name: form.name })}
                      title={t("edit", { name: form.name })}
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {!form.active && (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        {t("disabled")}
                      </Badge>
                    )}
                    {onPage.has(form.id) && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                        {t("onPage")}
                      </Badge>
                    )}
                    {summary && summary.newCount > 0 && (
                      <a href={leads} target="_blank" rel="noreferrer">
                        <Badge className="h-5 px-1.5 text-[10px]">{t("newSubmissions", { count: summary.newCount })}</Badge>
                      </a>
                    )}
                    <Button type="button" size="sm" variant="secondary" className="ms-auto h-7 gap-1 px-2 text-xs" onClick={() => insert(form)}>
                      <Plus className="size-3.5" />
                      {t("add")}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <section className="space-y-2" aria-labelledby="forms-panel-templates">
          <div>
            <h3 id="forms-panel-templates" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("templates")}
            </h3>
            <p className="text-[11px] text-muted-foreground">{t("templatesHint")}</p>
          </div>
          {templates.length === 0 ? (
            <p className="py-3 text-center text-xs text-muted-foreground">{t("noMatch")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {templates.map((id) => {
                const Icon = TEMPLATE_ICONS[id] ?? ClipboardList;
                const name = tTemplates(`${id}.name` as never);
                const busy = creating === id;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={readOnly || creating !== null}
                    onClick={() => onTemplate(id)}
                    aria-label={t("useTemplate", { name })}
                    className="group group/card flex flex-wrap items-start gap-2.5 rounded-lg border bg-card p-2.5 text-start transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="relative block w-full overflow-hidden rounded-md border bg-muted/30 transition-[border-color,box-shadow] group-hover/card:border-foreground/30 group-hover/card:shadow-sm">
                      {thumb(`template-${id}`)}
                      <AddOverlay label={t("add")} />
                    </span>
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary">
                      {busy ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <Icon className="size-3.5" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{name}</span>
                      <span className="line-clamp-2 text-[11px] text-muted-foreground">{tTemplates(`${id}.description` as never)}</span>
                    </span>
                    <Plus className="mt-1 size-3.5 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
      {!readOnly && <p className="shrink-0 border-t px-3 py-2.5 text-[11px] text-muted-foreground">{t("hint")}</p>}
    </div>
  );
}

/** The "Add" pill shown over a thumbnail on hover, like the Sections library cards. */
function AddOverlay({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-center opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100 motion-reduce:transition-none">
      <span className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-sm">
        <Plus className="size-3" aria-hidden />
        {label}
      </span>
    </span>
  );
}
