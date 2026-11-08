"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CircleCheck, ChevronLeft, ChevronRight, Eye, Info, LayoutTemplate, LoaderCircle, Lock, Pencil, RotateCcw, Search, Sparkles } from "lucide-react";
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
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Chip, EmptyState, Modal, Note, PageHeader, SellerButton, SellerCard, Tag } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { RemoteImage } from "@/components/media/remote-image";
import { TemplateLiveThumbnail, TemplatePreview } from "./template-preview.client";
import { applyTemplate, listTemplatesPage, undoTemplate } from "./templates.server";
import type { TemplateCardView, TemplatesPageView } from "./templates.dto";
import { parseTemplatesCategory, parseTemplatesPage, TEMPLATES_PAGE_SIZE } from "./templates.lib";

type Localized = { ar?: string; en?: string };

/**
 * Query key of one gallery page; `["store-templates", storeId]` matches every
 * page of the store. A `null` category is the store's default tab (its industry).
 */
const templatesKey = (storeId: string, page?: number, category?: string | null, q = "") =>
  page === undefined ? ["store-templates", storeId] : ["store-templates", storeId, page, { category, q }];

async function fetchTemplatesPage(storeId: string, page: number, category: string | null, q: string): Promise<TemplatesPageView> {
  const result = await listTemplatesPage(storeId, { page, ...(category !== null && { category }), ...(q && { q }) });
  if (!result.success) throw new Error(result.error);
  return result.data;
}

/**
 * Website › Templates gallery (PLAN.md §8.1, P4-05; Claude Design "Seller
 * Templates" v3 with the recommended card, 1c "Gallery tile" from Theme Card
 * Variants). Each tile shows the template's home page live; on a touch screen a
 * tap opens the preview, where "Use template" lives. Using a template only
 * changes the drafts: the live site changes on Publish. Templates load one page
 * at a time (`listTemplatesPage`, React Query); the page and category live in
 * the URL (`?page=2&category=fashion`), and the next page is prefetched.
 */
export function TemplateGallery({
  storeId,
  readOnly,
  fontClassName,
  children,
}: {
  storeId: string;
  readOnly: boolean;
  /** Class names defining the store font variables (store-fonts.ts). */
  fontClassName: string;
  /** Rendered under the title (the offline note). */
  children?: React.ReactNode;
}) {
  const t = useTranslations("websiteTemplates");
  const tw = useTranslations("sellerWebsite.templates");
  const locale = useLocale() === "en" ? "en" : "ar";
  const format = useFormatter();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const page = parseTemplatesPage(searchParams.get("page"));
  // No `?category=`: the server picks the store's industry tab (owner request 2026-10-28).
  const categoryParam = searchParams.get("category");
  const requestedCategory = categoryParam === null ? null : parseTemplatesCategory(categoryParam);
  const listRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [confirming, setConfirming] = useState<TemplateCardView | null>(null);
  const [previewing, setPreviewing] = useState<TemplateCardView | null>(null);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [isPending, startTransition] = useTransition();

  // The search runs on the server, over every template, a moment after typing stops.
  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useQuery({
    queryKey: templatesKey(storeId, page, requestedCategory, q),
    queryFn: () => fetchTemplatesPage(storeId, page, requestedCategory, q),
    placeholderData: keepPreviousData,
    // One retry, then the error state with its own retry button.
    retry: 1,
  });
  const data = query.data;
  // The tab shown: the one asked for in the URL, else the default the server served.
  const category = data?.category ?? requestedCategory ?? "all";
  const currentKey = data?.currentKey ?? "";
  const lastInstall = data?.lastInstall ?? null;
  const categories = data?.categories ?? [];
  const shown = data?.items ?? [];
  // The requested page while it loads (placeholder data), else the page the server served (clamped).
  const currentPage = query.isPlaceholderData ? page : (data?.page ?? page);
  const pageCount = data?.pageCount ?? 1;
  // Placeholder data (the previous page) is shown dimmed while the new page loads.
  const switching = query.isPlaceholderData && query.isFetching;

  // Prefetch the next page once this one is in (not while showing the previous page's data).
  useEffect(() => {
    if (!data || query.isPlaceholderData || data.page >= data.pageCount) return;
    const next = data.page + 1;
    void queryClient.prefetchQuery({
      queryKey: templatesKey(storeId, next, requestedCategory, q),
      queryFn: () => fetchTemplatesPage(storeId, next, requestedCategory, q),
    });
  }, [data, query.isPlaceholderData, queryClient, storeId, requestedCategory, q]);

  /**
   * Writes the filters to the URL (client-side only: no server round trip, the
   * back button works). The category is always written, `all` too, since no
   * `?category=` means the store's industry tab.
   */
  const setFilters = (next: { page: number; category: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.page > 1) params.set("page", String(next.page));
    else params.delete("page");
    params.set("category", next.category);
    const qs = params.toString();
    window.history.pushState(null, "", qs ? `${pathname}?${qs}` : pathname);
  };

  // The server clamps the page (a template change can shrink the list): keep the URL in step.
  useEffect(() => {
    if (data && !query.isPlaceholderData && data.page !== page) {
      // Seed the clamped page's key so the URL change doesn't fetch it again.
      queryClient.setQueryData(templatesKey(storeId, data.page, requestedCategory, q), data);
      const params = new URLSearchParams(searchParams.toString());
      if (data.page > 1) params.set("page", String(data.page));
      else params.delete("page");
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    }
  }, [data, query.isPlaceholderData, page, pathname, searchParams, queryClient, storeId, requestedCategory, q]);

  const goToPage = (next: number) => {
    setFilters({ page: next, category });
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onSearch = (value: string) => {
    setSearch(value);
    if (page > 1) setFilters({ page: 1, category });
  };

  const text = (value: Localized) => value[locale] || value.ar || value.en || "";
  const nameOf = (key: string, name: Localized | null) => (name ? text(name) : "") || key;
  const categoryName = (value: string) => (value === "all" ? t("categories.all") : t.has(`categories.${value}`) ? t(`categories.${value}`) : value);

  /** After apply/undo: every cached page of this store is stale (current badge, last install). */
  const refreshGallery = () => {
    void queryClient.invalidateQueries({ queryKey: templatesKey(storeId) });
    router.refresh();
  };

  const onApply = (template: TemplateCardView) =>
    startTransition(async () => {
      const result = await applyTemplate(storeId, template.key);
      setConfirming(null);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      // A never-published store goes live when its template is chosen (owner, 2026-11-07).
      toast.success(t(result.data.published ? "appliedPublished" : "applied", { name: text(template.name) }));
      void queryClient.invalidateQueries({ queryKey: templatesKey(storeId) });
      // Website › Overview shows the live link (or the publish button for later changes).
      router.push(`/stores/${storeId}/website`);
    });

  const onUndo = () =>
    startTransition(async () => {
      const result = await undoTemplate(storeId);
      setConfirmUndo(false);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("undone"));
      refreshGallery();
    });

  const showCurrent = Boolean(currentKey);
  const installOfCurrent = lastInstall?.templateKey === currentKey ? lastInstall : null;

  return (
    <>
      <PageHeader
        className="sui-rise"
        title={t("title")}
        description={t("description")}
        actions={
          data &&
          !showCurrent && (
            <SellerButton asChild variant="outline">
              <Link href={`/stores/${storeId}/editor`}>
                <Pencil aria-hidden />
                {t("openEditor")}
              </Link>
            </SellerButton>
          )
        }
      />
      {children}
      {readOnly && <Note>{t("readOnly")}</Note>}

      {showCurrent && (
        <SellerCard
          aria-label={tw("currentLabel")}
          className="sui-rise grid grid-cols-[220px_minmax(0,1fr)_auto] items-center gap-[22px] rounded-[26px] p-4 [animation-delay:.05s] max-[900px]:grid-cols-1 max-[900px]:gap-3.5"
        >
          <div className="h-[140px] overflow-hidden rounded-2xl border border-(--s-line) max-[900px]:h-40">
            <TemplateLiveThumbnail storeId={storeId} templateKey={currentKey} fontClassName={fontClassName} fallback={<ThumbnailFallback />} />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <small className="flex items-center gap-1.5 text-[12.5px] text-(--s-subtle)">
              <CircleCheck className="size-3.5" aria-hidden />
              {tw("currentLabel")}
            </small>
            <h2 className="flex flex-wrap items-center gap-2.5 text-xl font-bold text-(--s-ink)">
              {nameOf(currentKey, data?.currentName ?? null)}
              <Tag tone="success">{tw("applied")}</Tag>
            </h2>
            {installOfCurrent && (
              <p className="text-[13px] text-(--s-muted)">
                {t("lastApplied", {
                  name: nameOf(installOfCurrent.templateKey, installOfCurrent.name),
                  date: format.dateTime(new Date(installOfCurrent.installedAt), { dateStyle: "medium", timeStyle: "short" }),
                })}
              </p>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-2 max-[900px]:flex-row max-[900px]:flex-wrap max-[900px]:[&>*]:flex-1">
            <SellerButton asChild variant="solid">
              <Link href={`/stores/${storeId}/editor`}>
                <Pencil aria-hidden />
                {t("openEditor")}
              </Link>
            </SellerButton>
            {lastInstall?.canUndo && (
              <SellerButton variant="outline" disabled={readOnly || isPending} onClick={() => setConfirmUndo(true)}>
                <RotateCcw aria-hidden />
                {t("undo")}
              </SellerButton>
            )}
          </div>
        </SellerCard>
      )}

      {/* An undo left over when no template is current (the placeholder drafts came back). */}
      {!showCurrent && lastInstall?.canUndo && (
        <Note>
          <span className="flex flex-wrap items-center justify-between gap-2">
            {t("lastApplied", {
              name: nameOf(lastInstall.templateKey, lastInstall.name),
              date: format.dateTime(new Date(lastInstall.installedAt), { dateStyle: "medium", timeStyle: "short" }),
            })}
            <SellerButton variant="mini" size="xs" disabled={readOnly || isPending} onClick={() => setConfirmUndo(true)}>
              <RotateCcw aria-hidden />
              {t("undo")}
            </SellerButton>
          </span>
        </Note>
      )}

      <div className="sui-rise flex flex-wrap items-center gap-3 [animation-delay:.1s]">
        <div
          role="group"
          aria-label={t("categories.label")}
          className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] max-[900px]:basis-full [&::-webkit-scrollbar]:hidden"
        >
          {!data && query.isPending
            ? Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-9 w-20 shrink-0 rounded-full" />)
            : categories.length > 1 &&
              ["all", ...categories].map((value) => (
                <Chip
                  key={value}
                  className="shrink-0"
                  pressed={category === value}
                  onClick={() => {
                    setSearch("");
                    setQ("");
                    setFilters({ page: 1, category: value });
                  }}
                >
                  {categoryName(value)}
                </Chip>
              ))}
        </div>
        <label className="flex h-10 w-[220px] items-center gap-2 rounded-full border-[1.5px] border-(--s-field) bg-(--s-surface) px-3.5 text-(--s-subtle) focus-within:border-(--s-primary) max-[900px]:w-full">
          <Search className="size-4 shrink-0" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={tw("search")}
            aria-label={tw("search")}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-(--s-text) outline-none placeholder:text-(--s-placeholder)"
          />
        </label>
      </div>

      {!data && query.isPending && <TemplateGridSkeleton label={t("loading")} />}

      {!data && query.isError && (
        <SellerCard>
          <EmptyState
            icon={LayoutTemplate}
            title={t("loadFailed")}
            action={
              <SellerButton variant="mini" size="sm" onClick={() => void query.refetch()}>
                <RotateCcw aria-hidden />
                {t("retry")}
              </SellerButton>
            }
          />
        </SellerCard>
      )}

      {!data ? null : shown.length === 0 ? (
        <SellerCard>
          <EmptyState
            icon={LayoutTemplate}
            title={q ? tw("noMatches") : t("empty")}
            action={
              <SellerButton
                variant="mini"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setQ("");
                  setFilters({ page: 1, category: "all" });
                }}
              >
                {tw("showAll")}
              </SellerButton>
            }
          />
        </SellerCard>
      ) : (
        <div ref={listRef} className="flex scroll-mt-24 flex-col gap-4" aria-busy={switching}>
          <ul className={cn("grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-x-4 gap-y-6 transition-opacity", switching && "pointer-events-none opacity-60")}>
            {shown.map((template) => {
              const current = template.key === currentKey;
              const name = text(template.name);
              return (
                <li key={template.key} className="group flex min-w-0 flex-col gap-3">
                  {/* Gallery tile: the preview fills the tile; Use / Preview buttons sit below it, always visible (owner, 2026-11-07). */}
                  <div className={cn("relative overflow-hidden rounded-2xl border border-(--s-line) bg-(--s-surface) shadow-(--s-shadow-card) transition-shadow duration-200 group-hover:shadow-(--s-shadow-hover)", current && "outline-2 outline-offset-2 outline-(--s-primary)")}>
                    <button type="button" className="block w-full cursor-pointer text-start" onClick={() => setPreviewing(template)} aria-label={t("preview.open", { name })}>
                      {template.thumbnailUrl ? (
                        <span className="relative block aspect-[380/398] w-full">
                          <RemoteImage src={template.thumbnailUrl} alt="" fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw" className="object-cover object-top" />
                        </span>
                      ) : (
                        <TemplateLiveThumbnail storeId={storeId} templateKey={template.key} fontClassName={fontClassName} fallback={<ThumbnailFallback />} tall />
                      )}
                    </button>
                    {(current || template.isPremium) && (
                      <span className="pointer-events-none absolute start-2.5 top-2.5 z-[2] flex gap-1.5">
                        {current && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-(--s-solid) px-2.5 py-1 text-[11.5px] font-bold text-(--s-solid-fg)">
                            <Check className="size-3.5" aria-hidden />
                            {t("current")}
                          </span>
                        )}
                        {template.isPremium && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-(--s-surface) px-2.5 py-1 text-[11.5px] font-bold text-(--s-muted)">
                            <Lock className="size-3" aria-hidden />
                            {t("soon")}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-3 px-0.5">
                    <div className="min-w-0">
                      <h3 className="flex flex-wrap items-center gap-1.5 text-[15.5px] font-bold text-(--s-ink)">
                        <span className="min-w-0 truncate">{name}</span>
                        {template.isDefault && !current && <Tag>{t("default")}</Tag>}
                      </h3>
                      <p className="text-[12.5px] text-(--s-subtle)">
                        {categoryName(template.category)} · {t("pagesCount", { count: template.pages.length })}
                      </p>
                    </div>
                    <Swatches colors={template.palette} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <SellerButton
                      size="sm"
                      className="whitespace-normal"
                      disabled={readOnly || isPending || template.isPremium}
                      onClick={() => setConfirming(template)}
                    >
                      {current ? <RotateCcw aria-hidden /> : <Sparkles aria-hidden />}
                      {current ? tw("reapplyShort") : t("use")}
                    </SellerButton>
                    <SellerButton size="sm" variant="outline" onClick={() => setPreviewing(template)}>
                      <Eye aria-hidden />
                      {t("preview.action")}
                    </SellerButton>
                  </div>
                </li>
              );
            })}
          </ul>
          {pageCount > 1 && (
            <nav className="flex items-center justify-center gap-3" aria-label={t("pagination.label")}>
              <SellerButton variant="mini" size="sm" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                <ChevronLeft className="rtl:rotate-180" aria-hidden />
                {t("pagination.previous")}
              </SellerButton>
              <span className="text-[13px] text-(--s-muted)" aria-live="polite">
                {switching && <LoaderCircle className="me-1.5 inline size-3.5 animate-spin" aria-hidden />}
                {t("pagination.page", { page: currentPage, pageCount })}
              </span>
              <SellerButton variant="mini" size="sm" disabled={currentPage >= pageCount} onClick={() => goToPage(currentPage + 1)}>
                {t("pagination.next")}
                <ChevronRight className="rtl:rotate-180" aria-hidden />
              </SellerButton>
            </nav>
          )}
        </div>
      )}

      <p className="text-xs text-(--s-faint)">{t("moreSoon")}</p>

      <TemplatePreview
        storeId={storeId}
        template={previewing}
        current={previewing?.key === currentKey}
        disabled={readOnly || isPending || Boolean(previewing?.isPremium)}
        uiLocale={locale}
        fontClassName={fontClassName}
        categoryName={previewing ? categoryName(previewing.category) : ""}
        onUse={(template) => {
          setPreviewing(null);
          setConfirming(template);
        }}
        onOpenChange={(open) => !open && setPreviewing(null)}
      />

      <Modal
        open={confirming !== null}
        onOpenChange={(open) => !open && !isPending && setConfirming(null)}
        title={t("confirm.title", { name: text(confirming?.name ?? {}) })}
        description={t("confirm.description")}
        footer={
          <>
            <SellerButton variant="outline" disabled={isPending} onClick={() => setConfirming(null)}>
              {t("cancel")}
            </SellerButton>
            <SellerButton disabled={isPending} onClick={() => confirming && onApply(confirming)}>
              {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
              {t("confirm.action")}
            </SellerButton>
          </>
        }
      >
        {confirming && (
          <div className="h-[200px] overflow-hidden rounded-2xl border border-(--s-line)">
            {confirming.thumbnailUrl ? (
              <span className="relative block h-full w-full">
                <RemoteImage src={confirming.thumbnailUrl} alt="" fill sizes="460px" className="object-cover object-top" />
              </span>
            ) : (
              <TemplateLiveThumbnail storeId={storeId} templateKey={confirming.key} fontClassName={fontClassName} fallback={<ThumbnailFallback />} />
            )}
          </div>
        )}
        <ul className="flex flex-col gap-1.5 text-[13px] text-(--s-muted)">
          {[t("confirm.keeps"), t("confirm.untouched"), ...((confirming?.formKinds.length ?? 0) > 0 ? [t("confirm.forms")] : [])].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Check className="mt-1 size-3.5 shrink-0 text-success" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
        <Note icon={Info}>{t("confirm.draft")}</Note>
      </Modal>

      <AlertDialog open={confirmUndo} onOpenChange={(open) => !open && !isPending && setConfirmUndo(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("undoConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("undoConfirm.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                onUndo();
              }}
            >
              {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
              {t("undoConfirm.action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Colour swatches overlapping each other (`.sws`). */
export function Swatches({ colors }: { colors: readonly string[] }) {
  if (colors.length === 0) return null;
  return (
    <span aria-hidden className="flex shrink-0 pt-1.5">
      {colors.slice(0, 4).map((color, index) => (
        <i key={`${color}-${index}`} className={cn("size-[18px] rounded-full border-2 border-(--s-surface) shadow-[0_0_0_1px_var(--s-field)]", index > 0 && "-ms-1.5")} style={{ background: color }} />
      ))}
    </span>
  );
}

function ThumbnailFallback() {
  return (
    <span className="grid aspect-[380/398] w-full place-items-center bg-(--s-fill) text-(--s-subtle)">
      <LayoutTemplate className="size-6" aria-hidden />
    </span>
  );
}

/** Placeholder tiles while the first page loads: same grid and proportions as the real ones. */
function TemplateGridSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label}>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-x-4 gap-y-6" aria-hidden>
        {Array.from({ length: TEMPLATES_PAGE_SIZE }, (_, index) => (
          <li key={index} className="flex flex-col gap-3">
            <Skeleton className="aspect-[380/398] w-full rounded-2xl" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5 w-1/2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
