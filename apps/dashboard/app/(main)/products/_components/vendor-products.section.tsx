"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  PackagePlus,
  PencilLine,
  PlusIcon,
  Search,
  SearchX,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { EmptyState, PageHeader, SellerButton } from "@/components/seller-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { restoreProductsAction, trashProductsAction } from "../trash/trash.server";
import { BulkEditDialog, BulkEditUndoBar, type BulkEditUndo } from "../bulk-edit/bulk-edit.client";
import { ShareCatalogDialog } from "../../marketing/catalog/catalog-share.client";
import { formatNumber } from "@/lib/i18n/format";
import { ImportExportButton } from "./import-export-button.client";
import { ProductCard, ProductPhoneRow } from "./product-card.client";
import { VendorProductsTable } from "./vendor-products-table.client";
import { bulkSetPublishedAction, listFilteredProductIdsAction } from "./products-list.server";
import type { ProductsCategoryOption } from "./products-list.query";
import {
  PRODUCTS_PAGE_SIZES,
  PRODUCTS_PAGE_SIZE_COOKIE,
  PRODUCTS_SORTS,
  PRODUCTS_TABS,
  pageList,
  productsListHref,
  type ProductsListFilters,
  type ProductsSort,
  type ProductsTab,
  type ProductsViewMode,
} from "./products-view.lib";
import { useProductStoreId } from "./product-store.client";

export type VendorProduct = {
  id: string;
  title: string;
  slug?: string | null;
  /** The product page on the seller's own store (custom domain, else subdomain). */
  storeUrl?: string | null;
  sku?: string | null;
  description?: string | null;
  images?: string[] | null;
  status: "draft" | "pending" | "active" | "rejected";
  condition?: string | null;
  isFeatured?: boolean | null;
  quantity?: number | null;
  /** False: unlimited stock (0138, F-51). */
  trackStock?: boolean | null;
  basePrice?: string | number | null;
  salePrice?: string | number | null;
  brand?: { name: string } | null;
  category?: { name: string | null } | null;
  averageRating?: number | null;
  reviewCount?: number | null;
};

const noViewUpdates = () => () => {};
function readSavedView(): ProductsViewMode | null {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    return saved === "grid" || saved === "table" ? saved : null;
  } catch {
    return null;
  }
}

const VIEW_STORAGE_KEY = "tl-prod-view";
const SEARCH_DEBOUNCE_MS = 300;
const ALL_CATEGORIES = "__all__";

const tabCountStyles: Partial<Record<ProductsTab, string>> = {
  lowStock: "bg-accent-soft text-accent-ink",
  outOfStock: "bg-destructive-soft text-destructive",
};

const PILL_SELECT =
  "h-[42px] w-auto min-w-0 rounded-full border-[1.5px] border-(--s-field) bg-(--s-surface) px-3.5 text-[13px] font-semibold text-(--s-body) shadow-none max-[720px]:flex-1";
const PAGE_BUTTON =
  "grid h-10 min-w-10 cursor-pointer place-items-center rounded-xl border border-(--s-field) bg-(--s-surface) px-2.5 font-montserrat text-[13px] font-bold tabular-nums text-(--s-body) transition-colors duration-150 hover:border-(--s-outline-hover) disabled:cursor-not-allowed disabled:opacity-40";
const BULK_BUTTON =
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-[#c6d8dc] transition-colors duration-150 hover:bg-white/10 hover:text-white disabled:opacity-50 max-[600px]:h-10 [&_svg]:size-[15px]";

export function VendorProductsSection({
  products,
  total,
  counts,
  categories,
  filters,
  pages,
}: {
  /** One page of the filtered list. */
  products: VendorProduct[];
  /** How many products match the filters, across all pages. */
  total: number;
  counts: Record<ProductsTab, number>;
  categories: ProductsCategoryOption[];
  filters: ProductsListFilters;
  pages: number;
}) {
  const t = useTranslations("products.list");
  const productStoreId = useProductStoreId();
  const locale = useLocale();
  const router = useRouter();

  // The saved view is read after hydration, so the server and first client render agree.
  const [chosenView, setView] = useState<ProductsViewMode | null>(null);
  const savedView = useSyncExternalStore(noViewUpdates, readSavedView, () => null);
  const view = chosenView ?? savedView ?? "grid";
  // The typed search; the URL follows it after a short pause.
  const [query, setQuery] = useState(filters.q);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [deleting, setDeleting] = useState<VendorProduct | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  // Bulk edit (F-24b): the dialog, and the Undo of the last edit (10 minutes).
  const [bulkEditing, setBulkEditing] = useState(false);
  const [bulkUndo, setBulkUndo] = useState<BulkEditUndo | null>(null);
  // Shareable catalog of the picked products (F-11c).
  const [sharing, setSharing] = useState(false);
  const clearBulkUndo = useCallback(() => setBulkUndo(null), []);
  const [isPending, startTransition] = useTransition();
  // A filter or page change: the current rows stay on screen until the next arrive.
  const [isNavigating, startNavigation] = useTransition();

  const navigate = useCallback(
    (over: Partial<ProductsListFilters>, options?: { replace?: boolean }) => {
      const href = productsListHref({ ...filters, ...over });
      startNavigation(() => {
        if (options?.replace) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
      });
    },
    [filters, router],
  );

  // Filters change what is on screen, so a selection made before would be hidden.
  const applyFilter = (over: Partial<ProductsListFilters>) => {
    setSelected(new Set());
    navigate({ ...over, page: 1 });
  };

  // Typing searches after a short pause. Back and forward restore the box.
  const [lastPushedQuery, setLastPushedQuery] = useState(filters.q);
  const [seenQuery, setSeenQuery] = useState(filters.q);
  if (filters.q !== seenQuery) {
    setSeenQuery(filters.q);
    if (filters.q !== lastPushedQuery) {
      setLastPushedQuery(filters.q);
      setQuery(filters.q);
    }
  }
  useEffect(() => {
    const next = query.trim();
    if (next === lastPushedQuery) return;
    const timer = setTimeout(() => {
      setLastPushedQuery(next);
      setSelected(new Set());
      navigate({ q: next, page: 1 }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, lastPushedQuery, navigate]);

  const changeView = (next: ProductsViewMode) => {
    setView(next);
    setSelected(new Set());
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {}
  };

  const clearFilters = () => {
    setQuery("");
    setLastPushedQuery("");
    applyFilter({ tab: "all", q: "", category: "" });
  };

  const toggleSelected = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const goToPage = (next: number) => {
    navigate({ page: next });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changePageSize = (size: number) => {
    // Remembered for next time, so the sidebar link keeps the seller's choice.
    document.cookie = `${PRODUCTS_PAGE_SIZE_COOKIE}=${size}; path=/; max-age=31536000; samesite=lax`;
    navigate({ size, page: 1 });
  };

  const selectAllFiltered = () => {
    startTransition(async () => {
      const res = await listFilteredProductIdsAction(filters);
      if (res.success) setSelected(new Set(res.ids));
      else toast.error(t("selectAllFailed"));
    });
  };

  const bulkPublish = (published: boolean) => {
    startTransition(async () => {
      const res = await bulkSetPublishedAction(productStoreId, [...selected], published);
      if (!res.success) {
        toast.error(t("bulkPublishFailed", { count: selected.size }));
        return;
      }
      if (res.failed > 0) toast.error(t("bulkPublishFailed", { count: res.failed }));
      if (res.done > 0) toast.success(t(published ? "bulkPublished" : "bulkDrafted", { count: res.done }));
      setSelected(new Set());
      router.refresh();
    });
  };

  // Delete moves products to Trash (F-35); the toast offers Undo.
  const undoTrash = (ids: string[]) => ({
    label: t("undo"),
    onClick: async () => {
      const res = await restoreProductsAction(productStoreId, ids);
      if (res.success) toast.success(t("restored", { count: res.count }));
      else toast.error(t("restoreFailed"));
      router.refresh();
    },
  });

  const confirmDelete = () => {
    if (bulkDeleting) {
      const ids = [...selected];
      startTransition(async () => {
        const res = await trashProductsAction(productStoreId, ids);
        const done = res.success ? res.count : 0;
        const failed = ids.length - done;
        if (failed > 0) toast.error(t("bulkDeleteFailed", { count: failed }));
        if (res.success && done > 0)
          toast.success(t("bulkDeleted", { count: done }), { action: undoTrash(res.ids) });
        setBulkDeleting(false);
        setSelected(new Set());
        router.refresh();
      });
      return;
    }
    if (!deleting) return;
    startTransition(async () => {
      const res = await trashProductsAction(productStoreId, [deleting.id]);
      if (!res.success || res.count === 0) {
        toast.error(t("deleteFailed"));
        return;
      }
      toast.success(t("deleted", { title: deleting.title }), { action: undoTrash(res.ids) });
      setDeleting(null);
      router.refresh();
    });
  };

  const currentPage = filters.page;
  const rangeFrom = total ? (currentPage - 1) * filters.size + 1 : 0;
  const rangeTo = Math.min(currentPage * filters.size, total);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            {t("pageTitle")}
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 font-montserrat text-sm font-bold tabular-nums text-primary-ink">
              {formatNumber(counts.all, locale)}
            </span>
          </span>
        }
        description={t("pageSubtitle")}
        actions={
          <>
            <ImportExportButton filters={filters} total={total} />
            <SellerButton asChild>
              <Link href="/products/add" data-sui-button="amber">
                <PlusIcon aria-hidden="true" />
                {t("addNew")}
              </Link>
            </SellerButton>
          </>
        }
      />

      {/* Status tabs */}
      <div
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]"
        role="tablist"
        aria-label={t("columns.status")}
      >
        {PRODUCTS_TABS.map((key) => {
          const on = filters.tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => applyFilter({ tab: key })}
              className={cn(
                "inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-(--s-field) bg-(--s-surface) px-4 text-[13.5px] font-semibold text-(--s-body) transition-colors duration-150 hover:border-(--s-outline-hover)",
                on && "border-(--s-solid) bg-(--s-solid) text-(--s-solid-fg) hover:border-(--s-solid)",
              )}
            >
              {t(`tabs.${key}`)}
              <em
                className={cn(
                  "grid h-5 min-w-[22px] place-items-center rounded-full bg-(--s-fill) px-1.5 font-montserrat text-[11px] font-bold not-italic tabular-nums text-(--s-muted)",
                  counts[key] > 0 && tabCountStyles[key],
                  on && "bg-white/20 text-(--s-solid-fg)",
                )}
              >
                {formatNumber(counts[key], locale)}
              </em>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-[42px] min-w-0 flex-[1_1_260px] items-center gap-2 rounded-full border-[1.5px] border-(--s-field) bg-(--s-surface) px-3.5 text-(--s-subtle) transition-colors duration-150 focus-within:border-(--s-primary) max-[720px]:basis-full min-[721px]:max-w-[420px]">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="min-w-0 flex-1 bg-transparent text-[13.5px] text-(--s-text) outline-none placeholder:text-(--s-placeholder)"
          />
        </label>
        <Select
          value={filters.category || ALL_CATEGORIES}
          onValueChange={(value) => applyFilter({ category: value === ALL_CATEGORIES ? "" : value })}
        >
          <SelectTrigger className={PILL_SELECT} aria-label={t("category")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>{t("allCategories")}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.sort}
          onValueChange={(value) => navigate({ sort: value as ProductsSort, page: 1 })}
        >
          <SelectTrigger className={PILL_SELECT} aria-label={t("sortLabel")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUCTS_SORTS.map((key) => (
              <SelectItem key={key} value={key}>
                {t(`sort.${key}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div
          className="ms-auto inline-flex rounded-full border border-(--s-field) bg-(--s-surface) p-[3px] max-[720px]:ms-0"
          role="group"
          aria-label={t("viewLabel")}
        >
          {(
            [
              ["grid", LayoutGrid, t("gridView")],
              ["table", List, t("tableView")],
            ] as const
          ).map(([mode, Icon, label]) => (
            <button
              key={mode}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={view === mode}
              onClick={() => changeView(mode)}
              className={cn(
                "grid h-[34px] w-9 cursor-pointer place-items-center rounded-full text-(--s-subtle) transition-colors duration-150 hover:text-(--s-ink) max-[600px]:h-10 max-[600px]:w-10",
                view === mode && "bg-primary-soft text-primary-ink hover:text-primary-ink",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {bulkUndo && <BulkEditUndoBar undo={bulkUndo} onClear={clearBulkUndo} />}

      {/* Products */}
      {products.length === 0 ? (
        counts.all === 0 ? (
          <EmptyState
            icon={PackagePlus}
            title={t("noProductsTitle")}
            description={t("noProductsDescription")}
            action={
              <SellerButton asChild size="sm">
                <Link href="/products/add">
                  <PlusIcon aria-hidden="true" />
                  {t("addNew")}
                </Link>
              </SellerButton>
            }
          />
        ) : (
          <EmptyState
            icon={SearchX}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={
              <SellerButton variant="outline" size="sm" onClick={clearFilters}>
                {t("clearFilters")}
              </SellerButton>
            }
          />
        )
      ) : (
        <>
          {view === "table" ? (
            <>
              <div className="max-[720px]:hidden">
                <VendorProductsTable
                  products={products}
                  rowIndexOffset={rangeFrom - 1}
                  onDelete={setDeleting}
                  selectedIds={selected}
                  onSelectedIdsChange={setSelected}
                />
              </div>
              {/* A phone gets rows, never a table to scroll sideways. */}
              <ul className="flex flex-col overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-surface) min-[721px]:hidden">
                {products.map((product) => (
                  <ProductPhoneRow
                    key={product.id}
                    product={product}
                    selected={selected.has(product.id)}
                    onSelectedChange={(on) => toggleSelected(product.id, on)}
                    onDelete={setDeleting}
                  />
                ))}
              </ul>
            </>
          ) : (
            <div
              aria-busy={isNavigating}
              className={cn(
                "grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3.5 transition-opacity max-[720px]:grid-cols-2 max-[720px]:gap-2.5",
                isNavigating && "opacity-60",
              )}
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={selected.has(product.id)}
                  selecting={selected.size > 0}
                  onSelectedChange={(on) => toggleSelected(product.id, on)}
                  onDelete={setDeleting}
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-(--s-muted)">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-montserrat tabular-nums">
                {t("range", {
                  from: formatNumber(rangeFrom, locale),
                  to: formatNumber(rangeTo, locale),
                  total: formatNumber(total, locale),
                })}
              </span>
              <div className="flex items-center gap-2">
                <span>{t("perPage")}</span>
                <Select value={String(filters.size)} onValueChange={(value) => changePageSize(Number(value))}>
                  <SelectTrigger className="h-10 w-20 rounded-full border-(--s-field) bg-(--s-surface)" aria-label={t("perPage")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTS_PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {formatNumber(size, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {pages > 1 && (
              <nav className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className={PAGE_BUTTON}
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  aria-label={t("previousPage")}
                >
                  <ChevronRight className="size-4 ltr:rotate-180" />
                </button>
                {pageList(currentPage, pages).map((p, i) =>
                  p === "gap" ? (
                    <span key={`gap-${i}`} className="grid h-10 min-w-6 place-items-center">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={cn(
                        PAGE_BUTTON,
                        p === currentPage && "border-(--s-solid) bg-(--s-solid) text-(--s-solid-fg) hover:border-(--s-solid)",
                      )}
                      onClick={() => goToPage(p)}
                      aria-label={t("pageN", { page: p })}
                      aria-current={p === currentPage ? "page" : undefined}
                    >
                      {formatNumber(p, locale)}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  className={PAGE_BUTTON}
                  disabled={currentPage === pages}
                  onClick={() => goToPage(currentPage + 1)}
                  aria-label={t("nextPage")}
                >
                  <ChevronLeft className="size-4 ltr:rotate-180" />
                </button>
              </nav>
            )}
          </div>
        </>
      )}

      {/* Bulk actions float over both views, like the design's selection bar. */}
      {selected.size > 0 && (
        <div
          data-save-bar
          data-open
          className="fixed bottom-5 left-1/2 z-40 flex max-w-[calc(100vw-20px)] -translate-x-1/2 items-center gap-1 overflow-x-auto whitespace-nowrap rounded-full bg-(--tallaby-teal-900) p-2 text-white shadow-(--s-shadow-bar) [scrollbar-width:none] max-[720px]:inset-x-2.5 max-[720px]:max-w-none max-[720px]:translate-x-0"
        >
          <span className="px-3 text-[13.5px] font-bold">{t("selected", { count: selected.size })}</span>
          {selected.size < total && (
            <button type="button" className={BULK_BUTTON} disabled={isPending} onClick={selectAllFiltered}>
              <CheckCheck aria-hidden />
              {t("selectAllFiltered", { count: total })}
            </button>
          )}
          {(
            [
              [PencilLine, t("bulkEdit"), () => setBulkEditing(true)],
              [Share2, t("shareCatalog"), () => setSharing(true)],
              [Eye, t("bulkPublish"), () => bulkPublish(true)],
              [EyeOff, t("bulkDraft"), () => bulkPublish(false)],
            ] as const
          ).map(([Icon, label, onClick]) => (
            <button key={label} type="button" className={BULK_BUTTON} disabled={isPending} onClick={onClick}>
              <Icon aria-hidden />
              {label}
            </button>
          ))}
          <button type="button" className={cn(BULK_BUTTON, "text-[#fca5a5]")} disabled={isPending} onClick={() => setBulkDeleting(true)}>
            <Trash2 aria-hidden />
            {t("delete")}
          </button>
          <button type="button" className={BULK_BUTTON} onClick={() => setSelected(new Set())} aria-label={t("clearSelection")}>
            <X aria-hidden />
          </button>
        </div>
      )}

      <ConfirmActionDialog
        open={deleting !== null || bulkDeleting}
        onOpenChange={(open) => {
          if (open) return;
          setDeleting(null);
          setBulkDeleting(false);
        }}
        title={
          bulkDeleting
            ? t("bulkDeleteTitle", { count: selected.size })
            : t("deleteTitle", { title: deleting?.title ?? "" })
        }
        description={t("deleteDescription")}
        confirmLabel={t("delete")}
        destructive
        pending={isPending}
        onConfirm={confirmDelete}
      />

      <ShareCatalogDialog open={sharing} onOpenChange={setSharing} productIds={[...selected]} />

      <BulkEditDialog
        open={bulkEditing}
        onOpenChange={setBulkEditing}
        ids={[...selected]}
        onApplied={(undo) => {
          setBulkUndo(undo);
          setSelected(new Set());
          router.refresh();
        }}
      />
    </div>
  );
}
