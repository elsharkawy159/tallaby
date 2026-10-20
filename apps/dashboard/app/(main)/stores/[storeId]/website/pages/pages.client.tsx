"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, FileText, Home, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { BUTTON_CLASS, FIELD_CLASS, SectionCard, SMALL_BUTTON_CLASS, TEXTAREA_CLASS } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import { createPage, deletePage, reorderPages, updatePage } from "@/app/(builder)/stores/[storeId]/editor/server/editor.server";
import type { EditorErrorKey } from "@workspace/store-editor";
import type { WebsitePageRow } from "../website.types";
import { checkSlug, cleanSeo, moveItem, pageName, slugFromName, type SlugProblem } from "./pages.lib";

type FormState = {
  nameAr: string;
  nameEn: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  noindex: boolean;
  showInNav: boolean;
};

const EMPTY_FORM: FormState = {
  nameAr: "",
  nameEn: "",
  slug: "",
  seoTitle: "",
  seoDescription: "",
  ogImage: "",
  noindex: false,
  showInNav: true,
};

const SLUG_ERRORS: EditorErrorKey[] = ["invalidSlug", "reservedSlug", "slugTaken"];

function toForm(page: WebsitePageRow): FormState {
  return {
    nameAr: page.name.ar ?? "",
    nameEn: page.name.en ?? "",
    slug: page.slug,
    seoTitle: page.seo.title ?? "",
    seoDescription: page.seo.description ?? "",
    ogImage: page.seo.ogImage ?? "",
    noindex: Boolean(page.seo.noindex),
    showInNav: page.showInNav,
  };
}

/**
 * Website › Pages (PLAN.md P4-17): the store's pages outside the editor.
 * Every change goes through the editor actions (P4-04), which re-check the
 * store and enforce the slug rules; this list only mirrors them.
 */
export function WebsitePages({ storeId, initial, readOnly }: { storeId: string; initial: WebsitePageRow[]; readOnly: boolean }) {
  const t = useTranslations("websitePages");
  const te = useTranslations("storeEditor");
  const locale = useLocale();
  const router = useRouter();
  const [pages, setPages] = useState(initial);
  const [editing, setEditing] = useState<WebsitePageRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<WebsitePageRow | null>(null);
  const [pending, startTransition] = useTransition();

  const errorText = (error: string) => te(`errors.${error}` as "errors.generic");

  const reorder = (index: number, direction: -1 | 1) => {
    const previous = pages;
    const next = moveItem(pages, index, direction);
    if (next === pages) return;
    setPages(next);
    startTransition(async () => {
      const result = await reorderPages(storeId, next.map((page) => page.id)).catch(() => null);
      if (!result?.success) {
        setPages(previous);
        toast.error(errorText(result?.error ?? "generic"));
      } else {
        router.refresh();
      }
    });
  };

  const toggleNav = (page: WebsitePageRow, showInNav: boolean) => {
    setPages((list) => list.map((p) => (p.id === page.id ? { ...p, showInNav } : p)));
    startTransition(async () => {
      const result = await updatePage(storeId, page.id, { showInNav }).catch(() => null);
      if (!result?.success) {
        setPages((list) => list.map((p) => (p.id === page.id ? { ...p, showInNav: page.showInNav } : p)));
        toast.error(errorText(result?.error ?? "generic"));
      }
    });
  };

  const confirmDelete = () => {
    const page = deleting;
    if (!page) return;
    startTransition(async () => {
      const result = await deletePage(storeId, page.id).catch(() => null);
      if (result?.success) {
        setPages((list) => list.filter((p) => p.id !== page.id));
        toast.success(t("deleted"));
        router.refresh();
      } else {
        toast.error(errorText(result?.error ?? "generic"));
      }
      setDeleting(null);
    });
  };

  return (
    <SectionCard
      id="website-pages"
      icon={FileText}
      title={t("title")}
      description={t("description")}
      action={
        !readOnly && (
          <Button type="button" size="sm" className={SMALL_BUTTON_CLASS} onClick={() => setEditing("new")}>
            <Plus aria-hidden />
            {t("new")}
          </Button>
        )
      }
    >
      <p className="mb-3 text-xs text-muted-foreground">
        {t("draftNote")}{" "}
        <Link href={`/stores/${storeId}/website`} className="font-medium text-primary hover:underline">
          {t("publishLink")}
        </Link>
      </p>
      <ul className="divide-y rounded-xl border">
        {pages.map((page, index) => (
          <li key={page.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={t("moveUp")}
                disabled={readOnly || pending || index === 0}
                onClick={() => reorder(index, -1)}
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={t("moveDown")}
                disabled={readOnly || pending || index === pages.length - 1}
                onClick={() => reorder(index, 1)}
              >
                <ArrowDown className="size-3.5" />
              </Button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {page.isHome && <Home className="size-4 text-muted-foreground" aria-hidden />}
                <span className="truncate text-sm font-semibold">{pageName(page.name, locale) || page.slug}</span>
                {page.isHome && <Badge variant="secondary">{t("home")}</Badge>}
                {page.seo.noindex && <Badge variant="outline">{t("noindexBadge")}</Badge>}
              </div>
              <p dir="ltr" className="truncate text-start font-mono text-xs text-muted-foreground rtl:text-end">
                {page.isHome ? "/" : `/${page.slug}`}
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={page.isHome || page.showInNav}
                disabled={readOnly || page.isHome}
                onCheckedChange={(checked) => toggleNav(page, checked)}
                aria-label={t("showInNav")}
              />
              {t("inMenu")}
            </label>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("edit")}
                disabled={readOnly}
                onClick={() => setEditing(page)}
              >
                <Pencil className="size-4" />
              </Button>
              {!page.isHome && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  aria-label={t("delete")}
                  disabled={readOnly || pending}
                  onClick={() => setDeleting(page)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <PageSheet
        storeId={storeId}
        pages={pages}
        page={editing}
        onClose={() => setEditing(null)}
        onSaved={(saved) => {
          setPages((list) => (list.some((p) => p.id === saved.id) ? list.map((p) => (p.id === saved.id ? saved : p)) : [...list, saved]));
          setEditing(null);
          router.refresh();
        }}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle", { name: deleting ? pageName(deleting.name, locale) || deleting.slug : "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}

function PageSheet({
  storeId,
  pages,
  page,
  onClose,
  onSaved,
}: {
  storeId: string;
  pages: WebsitePageRow[];
  page: WebsitePageRow | "new" | null;
  onClose: () => void;
  onSaved: (page: WebsitePageRow) => void;
}) {
  const open = page !== null;
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && <PageForm key={page === "new" ? "new" : page.id} storeId={storeId} pages={pages} page={page} onSaved={onSaved} onCancel={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function PageForm({
  storeId,
  pages,
  page,
  onSaved,
  onCancel,
}: {
  storeId: string;
  pages: WebsitePageRow[];
  page: WebsitePageRow | "new";
  onSaved: (page: WebsitePageRow) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("websitePages");
  const te = useTranslations("storeEditor");
  const isNew = page === "new";
  const isHome = !isNew && page.isHome;
  const [form, setForm] = useState<FormState>(isNew ? EMPTY_FORM : toForm(page));
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [slugError, setSlugError] = useState<SlugProblem | null>(null);
  const [saving, startSaving] = useTransition();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const hasName = Boolean(form.nameAr.trim() || form.nameEn.trim());

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasName) return;
    const slug = form.slug.trim().toLowerCase();
    if (!isHome) {
      const problem = checkSlug(slug, pages, isNew ? undefined : page.id);
      setSlugError(problem);
      if (problem) return;
    }
    const name = { ar: form.nameAr.trim() || undefined, en: form.nameEn.trim() || undefined };
    const seo = cleanSeo({ title: form.seoTitle, description: form.seoDescription, ogImage: form.ogImage, noindex: form.noindex });

    startSaving(async () => {
      try {
        let id = isNew ? "" : page.id;
        if (isNew) {
          const created = await createPage(storeId, { name, slug });
          if (!created.success) return showError(created.error);
          id = created.data.id;
        }
        // New pages get their SEO and menu setting right after creation.
        const updated = await updatePage(storeId, id, {
          ...(isNew ? {} : { name, ...(isHome ? {} : { slug }) }),
          seo,
          showInNav: form.showInNav,
        });
        if (!updated.success) {
          showError(updated.error);
          // The page exists already: list it with the defaults it was created with.
          if (isNew) onSaved({ id, slug, isHome: false, name, seo: {}, showInNav: true, updatedAt: new Date().toISOString() });
          return;
        }
        toast.success(t(isNew ? "created" : "saved"));
        onSaved({
          id,
          slug: isHome ? (page as WebsitePageRow).slug : slug,
          isHome,
          name,
          seo,
          showInNav: form.showInNav,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        toast.error(te("errors.generic"));
      }
    });
  };

  const showError = (error: EditorErrorKey) => {
    if (SLUG_ERRORS.includes(error)) setSlugError(error as SlugProblem);
    else toast.error(te(`errors.${error}` as "errors.generic"));
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle>{isNew ? t("new") : t("editTitle")}</SheetTitle>
        <SheetDescription>{t("sheetDescription")}</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-5 px-4 pb-4">
        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-semibold">{t("basics")}</legend>
          <div className="space-y-1.5">
            <Label htmlFor="page-name-ar">{t("nameAr")}</Label>
            <Input id="page-name-ar" dir="rtl" className={FIELD_CLASS} value={form.nameAr} maxLength={80} onChange={(e) => set("nameAr", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="page-name-en">{t("nameEn")}</Label>
            <Input
              id="page-name-en"
              dir="ltr"
              className={FIELD_CLASS}
              value={form.nameEn}
              maxLength={80}
              onChange={(e) => {
                set("nameEn", e.target.value);
                if (!slugEdited) set("slug", slugFromName(e.target.value));
              }}
            />
          </div>
          {!hasName && <p className="text-xs text-muted-foreground">{t("nameRequired")}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="page-slug">{t("slug")}</Label>
            <Input
              id="page-slug"
              dir="ltr"
              className={cn(FIELD_CLASS, "font-mono", slugError && "border-destructive")}
              value={isHome ? "/" : form.slug}
              disabled={isHome}
              maxLength={64}
              aria-invalid={Boolean(slugError)}
              aria-describedby="page-slug-hint"
              onChange={(e) => {
                setSlugEdited(true);
                setSlugError(null);
                set("slug", e.target.value.toLowerCase());
              }}
            />
            <p id="page-slug-hint" className={cn("text-xs", slugError ? "text-destructive" : "text-muted-foreground")}>
              {isHome ? t("homeSlug") : slugError ? te(`errors.${slugError}`) : t("slugHint")}
            </p>
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            {t("showInNav")}
            <Switch checked={isHome || form.showInNav} disabled={isHome} onCheckedChange={(checked) => set("showInNav", checked)} />
          </label>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-semibold">{t("seo")}</legend>
          <div className="space-y-1.5">
            <Label htmlFor="page-seo-title">{t("seoTitle")}</Label>
            <Input id="page-seo-title" className={FIELD_CLASS} value={form.seoTitle} maxLength={120} onChange={(e) => set("seoTitle", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="page-seo-description">{t("seoDescription")}</Label>
            <Textarea
              id="page-seo-description"
              className={TEXTAREA_CLASS}
              value={form.seoDescription}
              maxLength={320}
              onChange={(e) => set("seoDescription", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="page-og-image">{t("ogImage")}</Label>
            <Input
              id="page-og-image"
              dir="ltr"
              type="url"
              inputMode="url"
              placeholder="https://"
              className={FIELD_CLASS}
              value={form.ogImage}
              maxLength={2048}
              onChange={(e) => set("ogImage", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("ogImageHint")}</p>
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              {t("noindex")}
              <span className="block text-xs text-muted-foreground">{t("noindexHint")}</span>
            </span>
            <Switch checked={form.noindex} onCheckedChange={(checked) => set("noindex", checked)} />
          </label>
        </fieldset>
      </div>

      <SheetFooter className="flex-row gap-2 border-t">
        <Button type="submit" className={BUTTON_CLASS} disabled={saving || !hasName}>
          {saving && <LoaderCircle className="animate-spin" aria-hidden />}
          {isNew ? t("create") : t("save")}
        </Button>
        <Button type="button" variant="outline" className={BUTTON_CLASS} onClick={onCancel}>
          {t("cancel")}
        </Button>
      </SheetFooter>
    </form>
  );
}
