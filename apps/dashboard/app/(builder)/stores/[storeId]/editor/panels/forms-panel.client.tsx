"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ClipboardList, ExternalLink, LoaderCircle, Plus, RefreshCw, Search } from "lucide-react";
import { useStore } from "zustand";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { createForm } from "@/app/(main)/stores/[storeId]/website/forms/forms.server";
import type { EditorCommands } from "../lib/editor-commands.lib";
import type { EditorForm } from "../server/editor.data";
import type { EditorFormSummary } from "../server/editor.dto";
import { listForms } from "../server/editor.server";
import type { EditorStore } from "../state/editor.store";

/**
 * Forms tab (owner request 2026-10-18, like the reference `forms-panel.tsx`):
 * this store's forms (Website › Forms), each addable to the page as a
 * contact-form section bound to it. The list reloads when the browser tab
 * regains focus, since forms are edited on their own page.
 */
export function FormsPanel({
  storeId,
  readOnly,
  store,
  commands,
  forms,
  onForms,
}: {
  storeId: string;
  readOnly: boolean;
  store: EditorStore;
  commands: EditorCommands;
  forms: EditorForm[];
  /** Fresh forms for the canvas and the inspector. */
  onForms: (forms: EditorForm[]) => void;
}) {
  const t = useTranslations("storeEditor.forms");
  const tStarter = useTranslations("storeForms.starter");
  const [query, setQuery] = useState("");
  const [summaries, setSummaries] = useState<Record<string, EditorFormSummary>>({});
  const [loading, setLoading] = useState(false);
  const [creating, startCreating] = useTransition();
  const pages = useStore(store, (s) => s.pages);
  const activePageId = useStore(store, (s) => s.activePageId);
  const page = pages.find((p) => p.id === activePageId) ?? pages[0];

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

  const onPage = useMemo(
    () => new Set((page?.content.sections ?? []).filter((s) => s.sectionId === "contact-form").map((s) => String(s.props.formId ?? ""))),
    [page],
  );
  const needle = query.trim().toLowerCase();
  const shown = needle ? forms.filter((f) => f.name.toLowerCase().includes(needle)) : forms;

  const insert = (form: EditorForm) => {
    if (!commands.addFormSection(form.id, form.name)) {
      toast.error(t("addFailed"));
      return;
    }
    toast.success(t("added", { name: form.name }));
  };

  // The same ready-made contact form as Website › Forms, added to the page at once.
  const onCreate = () =>
    startCreating(async () => {
      const result = await createForm(storeId, {
        name: tStarter("name"),
        fields: [
          { id: "name", type: "text", key: "name", label: tStarter("fullName"), required: true, width: "half" },
          { id: "phone", type: "phone", key: "phone", label: tStarter("phone"), required: false, width: "half" },
          { id: "email", type: "email", key: "email", label: tStarter("email"), required: true, width: "full" },
          { id: "message", type: "textarea", key: "message", label: tStarter("message"), required: true, width: "full" },
        ],
      });
      if (!result.success) {
        toast.error(t("createFailed"));
        return;
      }
      const fresh = await reload();
      const created = fresh?.find((f) => f.id === result.data.id);
      if (created) insert(created);
    });

  return (
    <div className="flex h-full min-h-0 flex-col">
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
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" disabled={readOnly || creating} onClick={onCreate}>
              {creating ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              {t("new")}
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="ps-8" />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {forms.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
            <ClipboardList className="size-7 text-muted-foreground/60" aria-hidden />
            <p className="text-sm font-medium">{t("emptyTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("emptyText")}</p>
            <Button type="button" size="sm" className="mt-1" disabled={readOnly || creating} onClick={onCreate}>
              {t("create")}
            </Button>
          </div>
        ) : shown.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("noMatch")}</p>
        ) : (
          shown.map((form) => {
            const summary = summaries[form.id];
            return (
              <div key={form.id} className="rounded-lg border bg-card p-2.5 transition-colors hover:border-primary/40">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <ClipboardList className="size-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{form.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("fields", { count: summary?.fieldCount ?? form.form.fields.length })}
                      {summary && ` · ${t("submissions", { count: summary.submissionCount })}`}
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
                    <a href={`/stores/${storeId}/website/forms/submissions?form=${form.id}`} target="_blank" rel="noreferrer">
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
      </div>
      {!readOnly && <p className="shrink-0 border-t px-3 py-2.5 text-[11px] text-muted-foreground">{t("hint")}</p>}
    </div>
  );
}
