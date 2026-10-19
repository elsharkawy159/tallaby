"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useStore } from "zustand";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
import { createPage, deletePage, updatePage } from "../server/editor.server";
import { hasPendingChanges, type EditorPage, type EditorStore } from "../state/editor.store";

export const nameOf = (value: { ar?: string; en?: string }, locale: string) => (locale === "en" ? value.en || value.ar : value.ar || value.en) || "";

export function PagesPanel({ storeId, store, uiLocale }: { storeId: string; store: EditorStore; uiLocale: string }) {
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
    // A new page starts by choosing a design: Add › Templates, filtered to this page.
    state.setAddTab("templates");
    state.setRail("add");
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
