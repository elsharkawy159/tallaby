"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpDown,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  LayoutGrid,
  Layers,
  List,
  PackageSearch,
  PencilLine,
  PlusIcon,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { setProductPublished } from "@/actions/products";
import { restoreProductsAction, trashProductsAction } from "../trash/trash.server";
import { BulkEditDialog, BulkEditUndoBar, type BulkEditUndo } from "../bulk-edit/bulk-edit.client";
import { ShareCatalogDialog } from "../../marketing/catalog/catalog-share.client";
import { formatNumber } from "@/lib/i18n/format";
import { ImportExportButton } from "./import-export-button.client";
import { ProductCard } from "./product-card.client";
import { VendorProductsTable } from "./vendor-products-table.client";
import {
  PRODUCTS_SORTS,
  PRODUCTS_TABS,
  categoryOptions,
  countByTab,
  filterProducts,
  pageList,
  type ProductsSort,
  type ProductsTab,
  type ProductsViewMode,
} from "./products-view.lib";

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
  basePrice?: string | number | null;
  salePrice?: string | number | null;
  brand?: { name: string } | null;
  category?: { name: string | null } | null;
  averageRating?: number | null;
  reviewCount?: number | null;
};

const VIEW_STORAGE_KEY = "tl-prod-view";
const GRID_PAGE_SIZE = 24;
const ALL_CATEGORIES = "__all__";

const tabCountStyles: Partial<Record<ProductsTab, string>> = {
  lowStock: "bg-accent-soft text-accent-ink border-transparent",
  outOfStock: "bg-destructive-soft text-destructive border-transparent",
};

export function VendorProductsSection({
  products,
}: {
  products: VendorProduct[];
  total?: number;
}) {
  const t = useTranslations("products.list");
  const locale = useLocale();
  const router = useRouter();

  const [view, setView] = useState<ProductsViewMode>("grid");
  const [tab, setTab] = useState<ProductsTab>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<ProductsSort>("newest");
  const [page, setPage] = useState(1);
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

  // Read the saved view after mount so the server and first client render agree.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY);
      if (saved === "grid" || saved === "table") setView(saved);
    } catch {}
  }, []);

  const changeView = (next: ProductsViewMode) => {
    setView(next);
    setSelected(new Set());
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {}
  };

  const counts = useMemo(() => countByTab(products), [products]);
  const categories = useMemo(() => categoryOptions(products, locale), [products, locale]);
  const filtered = useMemo(
    () => filterProducts(products, { tab, query, category, sort, locale }),
    [products, tab, query, category, sort, locale]
  );

  const pages = Math.max(1, Math.ceil(filtered.length / GRID_PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const pageItems = filtered.slice(
    (currentPage - 1) * GRID_PAGE_SIZE,
    currentPage * GRID_PAGE_SIZE
  );

  // Filters change what is on screen, so a selection made before would be hidden.
  const resetPaging = () => {
    setPage(1);
    setSelected(new Set());
  };

  const clearFilters = () => {
    setTab("all");
    setQuery("");
    setCategory("");
    resetPaging();
  };

  const toggleSelected = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const bulkPublish = (published: boolean) => {
    const targets = products.filter(
      (p) =>
        selected.has(p.id) &&
        p.status !== "rejected" &&
        (p.status === "active") !== published
    );
    if (targets.length === 0) {
      setSelected(new Set());
      return;
    }
    startTransition(async () => {
      const results = await Promise.all(
        targets.map((p) => setProductPublished(p.id, published))
      );
      const failed = results.filter((r) => !r.success).length;
      const done = targets.length - failed;
      if (failed > 0) toast.error(t("bulkPublishFailed", { count: failed }));
      if (done > 0)
        toast.success(t(published ? "bulkPublished" : "bulkDrafted", { count: done }));
      setSelected(new Set());
      router.refresh();
    });
  };

  // Delete moves products to Trash (F-35); the toast offers Undo.
  const undoTrash = (ids: string[]) => ({
    label: t("undo"),
    onClick: async () => {
      const res = await restoreProductsAction(ids);
      if (res.success) toast.success(t("restored", { count: res.count }));
      else toast.error(t("restoreFailed"));
      router.refresh();
    },
  });

  const confirmDelete = () => {
    if (bulkDeleting) {
      const ids = [...selected];
      startTransition(async () => {
        const res = await trashProductsAction(ids);
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
      const res = await trashProductsAction([deleting.id]);
      if (!res.success || res.count === 0) {
        toast.error(t("deleteFailed"));
        return;
      }
      toast.success(t("deleted", { title: deleting.title }), { action: undoTrash(res.ids) });
      setDeleting(null);
      router.refresh();
    });
  };

  const rangeFrom = filtered.length ? (currentPage - 1) * GRID_PAGE_SIZE + 1 : 0;
  const rangeTo = Math.min(currentPage * GRID_PAGE_SIZE, filtered.length);

  return (
    <div className="flex flex-col gap-4">
      {/* Status tabs + page actions */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div
          className="-mb-px flex min-w-0 max-w-full gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--border)] [scrollbar-width:none]"
          role="tablist"
          aria-label={t("columns.status")}
        >
          {PRODUCTS_TABS.map((key) => {
            const on = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setTab(key);
                  resetPaging();
                }}
                className={cn(
                  "flex h-10.5 cursor-pointer items-center gap-2 whitespace-nowrap px-3.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  on && "font-semibold text-primary-ink shadow-[inset_0_-2px_0_var(--primary)]"
                )}
              >
                {t(`tabs.${key}`)}
                <span
                  className={cn(
                    "inline-grid h-5 min-w-[22px] place-items-center rounded-full border bg-muted px-1.5 text-[11px] font-bold text-muted-foreground tabular-nums",
                    on && "border-transparent bg-primary-soft text-primary-ink",
                    counts[key] > 0 && tabCountStyles[key]
                  )}
                >
                  {formatNumber(counts[key], locale)}
                </span>
              </button>
            );
          })}
        </div>
        {/* On mobile the page actions come first, above the tabs. */}
        <div className="flex flex-wrap items-center gap-2.5 pb-1 max-sm:order-first max-sm:w-full max-sm:pb-0">
          <ImportExportButton products={filtered} />
          <Button asChild>
            <Link href="/products/add">
              <PlusIcon size={16} aria-hidden="true" />
              {t("addNew")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1 basis-full sm:basis-auto sm:max-w-95">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPaging();
            }}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="h-10 rounded-[10px] bg-card ps-9"
          />
        </div>
        <Select
          value={category || ALL_CATEGORIES}
          onValueChange={(value) => {
            setCategory(value === ALL_CATEGORIES ? "" : value);
            resetPaging();
          }}
        >
          <SelectTrigger
            className="rounded-[10px] bg-card"
            aria-label={t("category")}
          >
            <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>{t("allCategories")}</SelectItem>
            {categories.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value as ProductsSort);
            setPage(1);
          }}
        >
          <SelectTrigger
            className="rounded-[10px] bg-card"
            aria-label={t("sortLabel")}
          >
            <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
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
          className="ms-auto inline-flex gap-0.5 rounded-[11px] border bg-card p-[3px]"
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
                "grid h-8 w-9 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground",
                view === mode && "bg-primary-soft text-primary-ink hover:text-primary-ink"
              )}
            >
              <Icon className="size-[17px]" />
            </button>
          ))}
        </div>
      </div>

      {bulkUndo && <BulkEditUndoBar undo={bulkUndo} onClear={clearBulkUndo} />}

      {/* Bulk actions (both views; the table keeps its own Delete button) */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl bg-primary py-2 ps-3.5 pe-2 text-[13px] text-primary-foreground">
          <span>{t("selected", { count: selected.size })}</span>
          {selected.size < filtered.length && (
            <Button
              size="sm"
              onClick={() => setSelected(new Set(filtered.map((p) => p.id)))}
              className="h-8 rounded-[9px] bg-white/12 text-white hover:bg-white/22"
            >
              <CheckCheck className="size-4" />
              {t("selectAllFiltered", { count: filtered.length })}
            </Button>
          )}
          <span className="flex-1" />
          {(
            [
              [PencilLine, t("bulkEdit"), () => setBulkEditing(true)],
              [Share2, t("shareCatalog"), () => setSharing(true)],
              [Eye, t("bulkPublish"), () => bulkPublish(true)],
              [EyeOff, t("bulkDraft"), () => bulkPublish(false)],
              ...(view === "grid" ? ([[Trash2, t("delete"), () => setBulkDeleting(true)]] as const) : []),
            ] as const
          ).map(([Icon, label, onClick]) => (
            <Button
              key={label}
              size="sm"
              disabled={isPending}
              onClick={onClick}
              className="h-8 rounded-[9px] bg-white/12 text-white hover:bg-white/22"
            >
              <Icon className="size-4" />
              {label}
            </Button>
          ))}
          <Button
            size="sm"
            onClick={() => setSelected(new Set())}
            aria-label={t("clearSelection")}
            className="size-8 rounded-[9px] bg-white/12 p-0 text-white hover:bg-white/22"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Products */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-input bg-card px-5 py-14 text-center text-[13px] text-muted-foreground">
          <span className="mb-1 grid size-12 place-items-center rounded-xl bg-primary-soft text-primary-ink">
            <PackageSearch className="size-5" aria-hidden="true" />
          </span>
          {products.length === 0 ? (
            <>
              <b className="text-[15px] text-foreground">{t("noProductsTitle")}</b>
              <span>{t("noProductsDescription")}</span>
              <Button asChild size="sm" className="mt-2">
                <Link href="/products/add">
                  <PlusIcon size={16} aria-hidden="true" />
                  {t("addNew")}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <b className="text-[15px] text-foreground">{t("emptyTitle")}</b>
              <span>{t("emptyDescription")}</span>
              <Button variant="outline" size="sm" className="mt-2" onClick={clearFilters}>
                {t("clearFilters")}
              </Button>
            </>
          )}
        </div>
      ) : view === "table" ? (
        <VendorProductsTable
          products={filtered}
          onDelete={setDeleting}
          selectedIds={selected}
          onSelectedIdsChange={setSelected}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-4">
            {pageItems.map((product) => (
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

          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted-foreground">
            <span className="tabular-nums">
              {t("range", {
                from: formatNumber(rangeFrom, locale),
                to: formatNumber(rangeTo, locale),
                total: formatNumber(filtered.length, locale),
              })}
            </span>
            {pages > 1 && (
              <nav className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-[9px]"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  aria-label={t("previousPage")}
                >
                  <ChevronRight className="size-4 ltr:rotate-180" />
                </Button>
                {pageList(currentPage, pages).map((p, i) =>
                  p === "gap" ? (
                    <span key={`gap-${i}`} className="grid h-9 min-w-6 place-items-center">
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "outline"}
                      size="icon"
                      className="size-9 rounded-[9px] text-[13px] tabular-nums"
                      onClick={() => goToPage(p)}
                      aria-label={t("pageN", { page: p })}
                      aria-current={p === currentPage ? "page" : undefined}
                    >
                      {formatNumber(p, locale)}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-[9px]"
                  disabled={currentPage === pages}
                  onClick={() => goToPage(currentPage + 1)}
                  aria-label={t("nextPage")}
                >
                  <ChevronLeft className="size-4 ltr:rotate-180" />
                </Button>
              </nav>
            )}
          </div>
        </>
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
