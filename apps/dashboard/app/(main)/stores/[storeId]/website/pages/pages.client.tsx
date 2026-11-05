"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  File,
  FileText,
  Files,
  Home,
  LoaderCircle,
  Package,
  PanelBottom,
  PanelTop,
  Pencil,
  Plus,
  Share2,
  Store,
  Trash2,
} from "lucide-react";
import type { DesignSystem, SectionInstance, SiteLocale } from "@workspace/store-sections";
import type { StoreProfile } from "@workspace/store-sections/render";
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
import {
  CheckRow,
  Chip,
  Chips,
  Field,
  FieldRow,
  IconButton,
  IconTile,
  InputGroup,
  Modal,
  Note,
  PageHeader,
  PageTabs,
  SectionCard,
  SellerButton,
  Tag,
  TextArea,
  TextInput,
  Toggle,
} from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { createPage, deletePage, reorderPages, updatePage } from "@/app/(builder)/stores/[storeId]/editor/server/editor.server";
import type { EditorErrorKey } from "@workspace/store-editor/editor.dto";
import { SitePreview } from "../_components/site-preview.client";
import type { WebsitePageRow } from "../website.types";
import { PAGE_PRESETS, checkSlug, cleanSeo, moveItem, pageName, slugFromName, type SlugProblem } from "./pages.lib";

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

const EMPTY_CATALOG = { products: [], categories: [] };

/**
 * Website › Pages (PLAN.md P4-17; Claude Design "Seller Pages" v3): the store's
 * pages and header menu, then its footer as it really draws. Every page change
 * goes through the editor actions (P4-04), which re-check the store and enforce
 * the slug rules. The header and footer are element trees, so changing them
 * happens in the website editor; this page leads there.
 */
export function WebsitePages({
  storeId,
  initial,
  readOnly,
  header,
  footer,
  designSystem,
  store,
  defaultLocale,
  fontClassName,
  children,
}: {
  storeId: string;
  initial: WebsitePageRow[];
  readOnly: boolean;
  /** The store's draft header. Its links are nodes in its own tree, so only its real drawing shows them truthfully. */
  header: SectionInstance | null;
  /** The store's draft footer. */
  footer: SectionInstance | null;
  designSystem: DesignSystem;
  store: StoreProfile;
  defaultLocale: SiteLocale;
  fontClassName: string;
  /** Rendered under the title (the offline note). */
  children?: ReactNode;
}) {
  const t = useTranslations("websitePages");
  const te = useTranslations("storeEditor");
  const tw = useTranslations("sellerWebsite.pages");
  const locale = useLocale();
  const router = useRouter();
  const [pages, setPages] = useState(initial);
  const [editing, setEditing] = useState<WebsitePageRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<WebsitePageRow | null>(null);
  const [section, setSection] = useState("pages-header");
  const [pending, startTransition] = useTransition();

  const errorText = (error: string) => te(`errors.${error}` as "errors.generic");
  const editorHref = `/stores/${storeId}/editor`;

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

  const scrollTo = (key: string) => {
    setSection(key);
    document.getElementById(key)?.scrollIntoView({ block: "start" });
  };

  return (
    <>
      <PageHeader
        className="sui-rise"
        title={t("title")}
        description={tw("description")}
        actions={
          !readOnly && (
            <SellerButton onClick={() => setEditing("new")}>
              <Plus aria-hidden />
              {t("new")}
            </SellerButton>
          )
        }
      />
      {children}

      <PageTabs
        className="sui-rise"
        label={tw("sectionsLabel")}
        value={section}
        onChange={scrollTo}
        tabs={[
          { key: "pages-header", icon: PanelTop, label: tw("headerSection") },
          { key: "pages-footer", icon: PanelBottom, label: tw("footerSection") },
        ]}
      />

      <div id="pages-header" className="flex scroll-mt-[140px] flex-col gap-3.5">
        <SectionHead icon={PanelTop} title={tw("headerSection")} action={<EditorLink href={editorHref}>{tw("changeHeader")}</EditorLink>} />

        <Field label={tw("headerPreview")} hint={tw("headerPreviewHint")}>
          {header ? (
            <SitePreview
              // Under 768px of frame width the store draws its fixed bottom nav, which covered the header at 150px.
              className={cn("h-[215px] overflow-hidden rounded-[22px] border border-(--s-line) bg-(--s-surface-2) min-[1180px]:h-[150px]", fontClassName)}
              store={store}
              catalog={EMPTY_CATALOG}
              sections={[]}
              header={header}
              footer={null}
              designSystem={designSystem}
              locale={defaultLocale}
              defaultLocale={defaultLocale}
              fontClassName={fontClassName}
            />
          ) : (
            <Note>{tw("noHeader")}</Note>
          )}
        </Field>

        <SectionCard
          id="website-pages"
          icon={Files}
          title={
            <>
              {tw("allPages")}
              <Tag>{tw("pageCount", { count: pages.length })}</Tag>
            </>
          }
          description={
            <>
              {t("draftNote")}{" "}
              <Link href={`/stores/${storeId}/website`} className="font-semibold text-(--s-link)">
                {t("publishLink")}
              </Link>
            </>
          }
        >
          <ul className="flex flex-col overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-surface)">
            {pages.map((page, index) => {
              const name = pageName(page.name, locale) || page.slug;
              const fixed = page.isHome || page.kind === "product";
              return (
                <li key={page.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-3 transition-colors duration-150 hover:bg-(--s-tint) [&+&]:border-t [&+&]:border-(--s-line-soft)">
                  <span className="flex shrink-0 flex-col max-[600px]:flex-row">
                    <IconButton className="size-[22px] rounded-md max-[600px]:size-10" aria-label={t("moveUp")} disabled={readOnly || pending || index === 0} onClick={() => reorder(index, -1)}>
                      <ChevronUp className="!size-4" aria-hidden />
                    </IconButton>
                    <IconButton
                      className="size-[22px] rounded-md max-[600px]:size-10"
                      aria-label={t("moveDown")}
                      disabled={readOnly || pending || index === pages.length - 1}
                      onClick={() => reorder(index, 1)}
                    >
                      <ChevronDown className="!size-4" aria-hidden />
                    </IconButton>
                  </span>
                  <IconTile icon={page.isHome ? Home : page.kind === "product" ? Package : FileText} className="size-10 max-[600px]:hidden [&_svg]:size-[18px]" />
                  <div className="min-w-[150px] flex-1 max-[600px]:order-first max-[600px]:basis-full">
                    <b className="flex flex-wrap items-center gap-2 text-sm font-bold text-(--s-text)">
                      {name}
                      {page.isHome && (
                        <Tag tone="warning">
                          <Home aria-hidden />
                          {t("home")}
                        </Tag>
                      )}
                      {page.kind === "product" && (
                        <Tag tone="info">
                          <Package aria-hidden />
                          {t("productBadge")}
                        </Tag>
                      )}
                      {page.seo.noindex && <Tag>{t("noindexBadge")}</Tag>}
                    </b>
                    <bdi dir="ltr" className="block truncate font-mono text-xs text-(--s-subtle)">
                      {page.isHome ? "/" : page.kind === "product" ? "/products/…" : `/${page.slug}`}
                    </bdi>
                  </div>
                  <Toggle
                    className="whitespace-nowrap text-[12.5px] text-(--s-subtle) max-[600px]:ms-auto"
                    label={t("inMenu")}
                    aria-label={`${t("showInNav")}: ${name}`}
                    checked={page.isHome || page.showInNav}
                    disabled={readOnly || fixed}
                    onCheckedChange={(checked) => toggleNav(page, checked)}
                  />
                  <span className="flex shrink-0 gap-0.5">
                    <IconButton aria-label={`${t("edit")}: ${name}`} disabled={readOnly} onClick={() => setEditing(page)}>
                      <Pencil aria-hidden />
                    </IconButton>
                    {/* The product page is fixed: it is never deleted (the server refuses too). */}
                    {fixed ? (
                      <span className="size-9 max-[600px]:hidden" />
                    ) : (
                      <IconButton className="text-destructive hover:text-destructive" aria-label={`${t("delete")}: ${name}`} disabled={readOnly || pending} onClick={() => setDeleting(page)}>
                        <Trash2 aria-hidden />
                      </IconButton>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <Note>
            {tw("contentNote")}{" "}
            <Link href={editorHref} className="text-(--s-link)">
              {tw("openEditor")}
            </Link>
          </Note>
        </SectionCard>
      </div>

      <div id="pages-footer" className="mt-3 flex scroll-mt-[140px] flex-col gap-3.5">
        <SectionHead icon={PanelBottom} title={tw("footerSection")} action={<EditorLink href={editorHref}>{tw("changeFooter")}</EditorLink>} />

        <Field label={tw("footerPreview")} hint={tw("footerPreviewHint")}>
          {footer ? (
            <SitePreview
              className={cn("h-[500px] overflow-hidden rounded-[22px] border border-(--s-line) bg-(--s-surface-2) max-[720px]:h-[560px]", fontClassName)}
              store={store}
              catalog={EMPTY_CATALOG}
              sections={[]}
              header={null}
              footer={footer}
              designSystem={designSystem}
              locale={defaultLocale}
              defaultLocale={defaultLocale}
              fontClassName={fontClassName}
            />
          ) : (
            <Note>{tw("noFooter")}</Note>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1">
          <FooterLink href={`/stores/${storeId}/website/social`} icon={Share2} title={tw("socialTitle")} body={tw("socialBody", { count: store.social?.length ?? 0 })} />
          <FooterLink href={`/stores/${storeId}/settings`} icon={Store} title={tw("contactTitle")} body={tw("contactBody")} />
        </div>
      </div>

      <Modal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === "new" ? t("new") : t("editTitle")}
        description={editing === "new" ? tw("newDescription") : t("sheetDescription")}
        width={560}
        className="max-h-[90dvh] overflow-y-auto"
      >
        {editing !== null && (
          <PageForm
            key={editing === "new" ? "new" : editing.id}
            storeId={storeId}
            pages={pages}
            page={editing}
            onCancel={() => setEditing(null)}
            onSaved={(saved) => {
              setPages((list) => (list.some((p) => p.id === saved.id) ? list.map((p) => (p.id === saved.id ? saved : p)) : [...list, saved]));
              setEditing(null);
              router.refresh();
            }}
          />
        )}
      </Modal>

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
    </>
  );
}

function SectionHead({ icon, title, action }: { icon: typeof File; title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-2.5">
        <IconTile icon={icon} tone="solid" />
        <h2 className="text-lg font-bold text-(--s-ink)">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function EditorLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <SellerButton asChild variant="mini" size="xs">
      <Link href={href}>
        <Pencil aria-hidden />
        {children}
      </Link>
    </SellerButton>
  );
}

function FooterLink({ href, icon, title, body }: { href: string; icon: typeof File; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[20px] border border-(--s-line) bg-(--s-glass) px-4 py-3.5 text-inherit no-underline shadow-(--s-shadow-card) transition-shadow duration-200 hover:shadow-(--s-shadow-hover)"
    >
      <IconTile icon={icon} />
      <span className="min-w-0 flex-1">
        <b className="block text-sm font-bold text-(--s-ink)">{title}</b>
        <small className="block text-pretty text-xs text-(--s-subtle)">{body}</small>
      </span>
    </Link>
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
  const tw = useTranslations("sellerWebsite.pages");
  const isNew = page === "new";
  const isHome = !isNew && page.isHome;
  // The product page keeps its address and stays out of the menu (the server refuses changes).
  const isProduct = !isNew && page.kind === "product";
  const fixedSlug = isHome || isProduct;
  const [form, setForm] = useState<FormState>(isNew ? EMPTY_FORM : toForm(page));
  const [preset, setPreset] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [slugError, setSlugError] = useState<SlugProblem | null>(null);
  const [saving, startSaving] = useTransition();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const hasName = Boolean(form.nameAr.trim() || form.nameEn.trim());

  const showError = (error: EditorErrorKey) => {
    if (SLUG_ERRORS.includes(error)) setSlugError(error as SlugProblem);
    else toast.error(te(`errors.${error}` as "errors.generic"));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasName) return;
    const slug = form.slug.trim().toLowerCase();
    if (!fixedSlug) {
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
          ...(isNew ? {} : { name, ...(fixedSlug ? {} : { slug }) }),
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
          slug: fixedSlug ? (page as WebsitePageRow).slug : slug,
          isHome,
          ...(isProduct && { kind: "product" as const }),
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

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {isNew && (
        <Field label={tw("presets")}>
          <Chips>
            <Chip
              pressed={preset === null}
              onClick={() => {
                setPreset(null);
                setForm(EMPTY_FORM);
                setSlugEdited(false);
                setSlugError(null);
              }}
            >
              <File aria-hidden />
              {tw("blank")}
            </Chip>
            {PAGE_PRESETS.map((item) => (
              <Chip
                key={item.id}
                pressed={preset === item.id}
                onClick={() => {
                  setPreset(item.id);
                  setForm((f) => ({ ...f, nameAr: item.name.ar, nameEn: item.name.en, slug: item.slug }));
                  setSlugEdited(true);
                  setSlugError(null);
                }}
              >
                {tw(`presetNames.${item.id}`)}
              </Chip>
            ))}
          </Chips>
        </Field>
      )}

      <FieldRow>
        <Field label={t("nameAr")} htmlFor="page-name-ar">
          <TextInput id="page-name-ar" dir="rtl" value={form.nameAr} maxLength={80} onChange={(e) => set("nameAr", e.target.value)} />
        </Field>
        <Field label={t("nameEn")} htmlFor="page-name-en">
          <TextInput
            id="page-name-en"
            dir="ltr"
            value={form.nameEn}
            maxLength={80}
            onChange={(e) => {
              set("nameEn", e.target.value);
              if (!slugEdited) set("slug", slugFromName(e.target.value));
            }}
          />
        </Field>
      </FieldRow>
      {!hasName && <p className="-mt-2 text-xs text-(--s-faint)">{t("nameRequired")}</p>}

      <Field
        label={t("slug")}
        htmlFor="page-slug"
        note={isHome ? t("homeSlug") : isProduct ? t("productSlug") : t("slugHint")}
        error={!fixedSlug && slugError ? te(`errors.${slugError}`) : undefined}
      >
        <div dir="ltr">
          <InputGroup
            id="page-slug"
            start="/"
            value={isHome ? "" : form.slug}
            disabled={fixedSlug}
            maxLength={64}
            aria-invalid={Boolean(slugError)}
            className={cn(slugError && "border-destructive", fixedSlug && "opacity-60")}
            inputClassName="font-mono"
            onChange={(e) => {
              setSlugEdited(true);
              setSlugError(null);
              set("slug", e.target.value.toLowerCase());
            }}
          />
        </div>
      </Field>
      <CheckRow label={t("showInNav")} checked={isHome || form.showInNav} disabled={fixedSlug} onChange={(e) => set("showInNav", e.target.checked)} />

      <div className="flex flex-col gap-3.5 border-t border-(--s-line-soft) pt-4">
        <b className="text-[13.5px] font-bold text-(--s-ink)">{t("seo")}</b>
        <Field label={t("seoTitle")} htmlFor="page-seo-title">
          <TextInput id="page-seo-title" value={form.seoTitle} maxLength={120} onChange={(e) => set("seoTitle", e.target.value)} />
        </Field>
        <Field label={t("seoDescription")} htmlFor="page-seo-description">
          <TextArea id="page-seo-description" value={form.seoDescription} maxLength={320} onChange={(e) => set("seoDescription", e.target.value)} />
        </Field>
        <Field label={t("ogImage")} htmlFor="page-og-image" note={t("ogImageHint")}>
          <TextInput id="page-og-image" dir="ltr" type="url" inputMode="url" placeholder="https://" value={form.ogImage} maxLength={2048} onChange={(e) => set("ogImage", e.target.value)} />
        </Field>
        <CheckRow label={t("noindex")} description={t("noindexHint")} checked={form.noindex} onChange={(e) => set("noindex", e.target.checked)} />
      </div>

      <div className="flex gap-2 [&>*]:flex-1">
        <SellerButton variant="outline" onClick={onCancel}>
          {t("cancel")}
        </SellerButton>
        <SellerButton type="submit" variant="solid" disabled={saving || !hasName}>
          {saving && <LoaderCircle className="animate-spin" aria-hidden />}
          {isNew ? t("create") : t("save")}
        </SellerButton>
      </div>
    </form>
  );
}
