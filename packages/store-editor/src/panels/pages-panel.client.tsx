"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, Package, Plus, Trash2 } from "lucide-react";
import { isProductPage } from "@workspace/store-sections";
import { useStore } from "zustand";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
import { useEditorAdapter } from "../adapter.client";
import { pagesPanelOrder } from "../lib/editor-pages.lib";
import { hasPendingChanges, type EditorPage, type EditorStore } from "../state/editor.store";

export const nameOf = (value: { ar?: string; en?: string }, locale: string) => (locale === "en" ? value.en || value.ar : value.ar || value.en) || "";

export function PagesPanel({ store, uiLocale }: { store: EditorStore; uiLocale: string }) {
  // Only rendered when the host has pages (capabilities.pages).
  const { pages: pagesApi, capabilities } = useEditorAdapter();
  const t = useTranslations("storeEditor.pages");
  const tErrors = useTranslations("storeEditor.errors");
  const state = useStore(store);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!pagesApi) return;
    setBusy(true);
    const result = await pagesApi.create({ name: { [state.defaultLocale]: name }, slug });
    setBusy(false);
    if (!result.success) {
      toast.error(tErrors(result.error));
      return;
    }
    const pageName = { [state.defaultLocale]: name } as { ar?: string; en?: string };
    state.setPages([...state.pages, { id: result.data.id, slug: result.data.slug, isHome: false, name: pageName, seo: {}, showInNav: true, content: { sections: [] }, version: 1 }]);
    state.setActivePage(result.data.id);
    // A new page starts by choosing a design: Add › Templates, filtered to this page.
    if (capabilities.templates) {
      state.setAddTab("templates");
      state.setRail("add");
    }
    setName("");
    setSlug("");
  };

  const toggleNav = async (page: EditorPage) => {
    if (!pagesApi) return;
    const result = await pagesApi.update(page.id, { showInNav: !page.showInNav });
    if (!result.success) return toast.error(tErrors(result.error));
    state.setPages(state.pages.map((p) => (p.id === page.id ? { ...p, showInNav: !p.showInNav } : p)));
  };

  const remove = async (page: EditorPage) => {
    if (hasPendingChanges(state) && state.dirtyPages[page.id]) return toast.error(tErrors("saveFirst"));
    if (!pagesApi) return;
    const result = await pagesApi.remove(page.id);
    if (!result.success) return toast.error(tErrors(result.error));
    state.setPages(state.pages.filter((p) => p.id !== page.id));
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-1">
        {pagesPanelOrder(state.pages).map((page) => (
          <li key={page.id} className={cn("flex min-h-11 items-center gap-2 rounded-[14px] border border-(--s-line) px-3 py-2 text-[13px] transition-colors hover:border-(--tallaby-teal-100)", page.id === state.activePageId && "border-(--s-primary) bg-(--s-tint) hover:border-(--s-primary)")}>
            <button type="button" className="flex min-w-0 flex-1 flex-col items-start text-start font-semibold text-(--s-text)" onClick={() => state.setActivePage(page.id)}>
              <span className="max-w-full truncate">{nameOf(page.name, uiLocale) || page.slug}</span>
              <span dir="ltr" className="max-w-full truncate font-montserrat text-[11px] font-medium text-(--s-subtle)">
                {/* The product page draws every product, at /products/<slug>. */}
                /{page.isHome ? "" : isProductPage(page) ? "products/…" : page.slug}
              </span>
            </button>
            {isProductPage(page) ? (
              // Fixed page: no menu toggle, no delete (the server refuses both too).
              <span className="inline-flex shrink-0 items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Package className="size-3" aria-hidden />
                {t("productBadge")}
              </span>
            ) : !page.isHome && (
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
        className="space-y-2.5 rounded-[14px] border border-(--s-line) p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
      >
        <p className="text-[12.5px] font-bold text-(--s-body)">{t("new")}</p>
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
