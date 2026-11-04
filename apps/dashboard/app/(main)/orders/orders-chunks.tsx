"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CircleAlert, LayoutGrid, List, PackageSearch, Search, Store } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { TableSection } from "@workspace/ui/components/table-section";
import { cn, getPublicUrl } from "@/lib/utils";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/i18n/format";
import { useTableSectionLabels } from "@/lib/i18n/table-labels";
import { BostaBulkBar } from "./bosta-bulk.client";
import { BostaChip, ShipWithBostaButton } from "./bosta-ship.client";
import { OrderActions } from "./order-actions.client";
import { OrdersBulkBar } from "./orders-bulk.client";
import { OrderCard } from "./order-card.client";
import { ListPager } from "./list-pager.client";
import { OrderDetailsDialog } from "./order-details-dialog.client";
import { OrderRiskBadges } from "./order-risk.client";
import { OrderStageBadge } from "./order-stage-badge";
import { loadOrderRowAction, selectFilteredOrdersAction } from "./orders-list.server";
import {
  ORDERS_PAGE_SIZES,
  ORDERS_PAGE_SIZE_COOKIE,
  ORDERS_SORTS,
  ORDERS_TABS,
  ordersListHref,
  type OrdersListFilters,
  type OrdersSort,
  type OrdersTab,
  type OrdersViewMode,
} from "./orders-view.lib";
import { ExportOrdersButton } from "./export-orders-button.client";
import type { OrderSummary, SellerOrderRow } from "./orders.types";
import { PrintOrdersButton } from "./print-orders-button.client";
import { WassalhaExportButton } from "./wassalha-export.client";

const VIEW_STORAGE_KEY = "tl-orders-view";

function ItemsCell({ order }: { order: SellerOrderRow }) {
  const t = useTranslations("orders.table");
  const [first] = order.lines;
  const thumbs = order.lines.filter((l) => l.image).slice(0, 3);
  return (
    <div className="flex items-center gap-3">
      <div className="flex shrink-0 -space-x-3 rtl:space-x-reverse">
        {thumbs.length ? (
          thumbs.map((line) => (
            <Image
              key={line.id}
              src={getPublicUrl(line.image!, "products")}
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-md border-2 border-background object-cover"
            />
          ))
        ) : (
          <div className="size-10 rounded-md border bg-muted" />
        )}
      </div>
      <div className="min-w-0">
        <div className="max-w-48 truncate font-medium">{first?.productName}</div>
        <div className="text-xs text-muted-foreground">
          {order.lines.length > 1
            ? t("moreItems", { count: order.itemCount })
            : (first?.variantName ?? t("qty", { count: order.itemCount }))}
        </div>
      </div>
    </div>
  );
}

function OrdersTable({
  orders,
  rowIndexOffset,
  onOpen,
  selection,
  onSelectionChange,
}: {
  orders: SellerOrderRow[];
  rowIndexOffset: number;
  onOpen: (id: string) => void;
  selection: RowSelectionState;
  onSelectionChange: (selection: RowSelectionState) => void;
}) {
  const t = useTranslations("orders");
  const tTable = useTranslations("orders.table");
  const tPayment = useTranslations("orders.details.paymentMethods");
  const tableLabels = useTableSectionLabels();
  const locale = useLocale();

  const columns = useMemo<ColumnDef<SellerOrderRow, any>[]>(
    () => [
      {
        id: "order",
        header: tTable("order"),
        size: 150,
        accessorFn: (row) => row.orderNumber,
        cell: ({ row }) => (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onOpen(row.original.id)}
              className="rounded-sm font-medium text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              #{row.original.orderNumber}
            </button>
            <div className="text-xs text-muted-foreground">
              {formatDateTime(row.original.createdAt, locale)}
            </div>
          </div>
        ),
      },
      {
        id: "customer",
        header: tTable("customer"),
        size: 170,
        meta: { hideOnMobile: true },
        accessorFn: (row) => row.customerName,
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate">{row.original.customerName || t("guest")}</div>
            <OrderRiskBadges order={row.original} className="mt-0.5" />
            {row.original.address?.area && (
              <div className="truncate text-xs text-muted-foreground">{row.original.address.area}</div>
            )}
          </div>
        ),
      },
      {
        id: "items",
        header: tTable("items"),
        size: 280,
        cell: ({ row }) => <ItemsCell order={row.original} />,
      },
      {
        id: "total",
        header: tTable("total"),
        size: 120,
        accessorFn: (row) => Number(row.totalAmount),
        cell: ({ row }) => (
          <div>
            <div className="font-medium tabular-nums" dir="ltr">
              {formatMoney(row.original.totalAmount, locale)}
            </div>
            {row.original.paymentMethod && tPayment.has(row.original.paymentMethod) && (
              <div className="text-xs text-muted-foreground">{tPayment(row.original.paymentMethod)}</div>
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: tTable("status"),
        size: 140,
        accessorFn: (row) => row.flow.stage,
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-1">
            <OrderStageBadge stage={row.original.flow.stage} />
            <BostaChip order={row.original} />
          </div>
        ),
      },
      {
        id: "next",
        header: tTable("next"),
        size: 210,
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <OrderActions order={row.original} compact />
            <ShipWithBostaButton order={row.original} />
          </div>
        ),
      },
    ],
    [t, tTable, tPayment, locale, onOpen],
  );

  return (
    <TableSection<SellerOrderRow>
      rows={orders}
      columns={columns}
      hideSearch
      externalPaging={{ rowIndexOffset }}
      labels={{ ...tableLabels, noResults: t("empty.tab") }}
      rowSelection={selection}
      onRowSelectionChange={onSelectionChange}
    />
  );
}

/** Filters on the page, with the tab already picked. */
type ResolvedFilters = OrdersListFilters & { tab: OrdersTab };

const SEARCH_DEBOUNCE_MS = 300;

export function VendorOrdersTable({
  rows,
  total,
  pages,
  counts,
  overview,
  filters,
  printIds,
  shipQueue,
  initialOrderId = null,
  linkedOrder = null,
  stores = [],
}: {
  /** One page of the filtered list. */
  rows: SellerOrderRow[];
  /** Orders matching the filters and tab, across all pages. */
  total: number;
  pages: number;
  counts: Record<OrdersTab, number>;
  /** All the seller's orders, whatever the filters. */
  overview: { orders: number; attention: number };
  filters: ResolvedFilters;
  /** The first print job of the filtered list. */
  printIds: string[];
  /** One store's waiting orders under the filters, for its Bosta and Wassalha actions. */
  shipQueue: { orders: OrderSummary[]; bosta: boolean; wassalha: boolean };
  initialOrderId?: string | null;
  /** The `?order=` order when it isn't on this page. */
  linkedOrder?: SellerOrderRow | null;
  /** The seller's stores, for the sales-channel filter (P3-06). */
  stores?: { id: string; name: string }[];
}) {
  const t = useTranslations("orders");
  const tChannel = useTranslations("orders.channel");
  const tList = useTranslations("products.list");
  const locale = useLocale();
  const router = useRouter();

  const [view, setView] = useState<OrdersViewMode>("grid");
  // The typed search; the URL follows it after a short pause.
  const [query, setQuery] = useState(filters.q);
  const [openOrderId, setOpenOrderId] = useState<string | null>(initialOrderId);
  // The open order when it isn't in `rows`: it moved to another tab after an action.
  const [detached, setDetached] = useState<SellerOrderRow | null>(null);
  // Bulk selection by order id (F-04c); can span pages the browser never loaded.
  const [selection, setSelection] = useState<ReadonlyMap<string, OrderSummary>>(() => new Map());
  const [isNavigating, startNavigation] = useTransition();
  const [isSelecting, startSelecting] = useTransition();

  // Read the saved view after mount so the server and first client render agree.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY);
      if (saved === "grid" || saved === "table") setView(saved);
    } catch {}
  }, []);

  const changeView = (next: OrdersViewMode) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {}
  };

  const navigate = useCallback(
    (over: Partial<OrdersListFilters>, options?: { replace?: boolean }) => {
      const href = ordersListHref({ ...filters, ...over });
      startNavigation(() => {
        if (options?.replace) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
      });
    },
    [filters, router],
  );

  // Filters change what is listed, so a selection made before would be hidden.
  const applyFilter = (over: Partial<OrdersListFilters>) => {
    setSelection(new Map());
    navigate({ ...over, page: 1 });
  };

  // Typing searches after a short pause. Back and forward restore the box.
  const lastPushedQuery = useRef(filters.q);
  useEffect(() => {
    if (filters.q !== lastPushedQuery.current) {
      lastPushedQuery.current = filters.q;
      setQuery(filters.q);
    }
  }, [filters.q]);
  useEffect(() => {
    const next = query.trim();
    if (next === lastPushedQuery.current) return;
    const timer = setTimeout(() => {
      lastPushedQuery.current = next;
      setSelection(new Map());
      navigate({ q: next, page: 1 }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, navigate]);

  const goToPage = (next: number) => {
    navigate({ page: next });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changePageSize = (size: number) => {
    // Remembered for next time, so the sidebar link keeps the seller's choice.
    document.cookie = `${ORDERS_PAGE_SIZE_COOKIE}=${size}; path=/; max-age=31536000; samesite=lax`;
    navigate({ size, page: 1 });
  };

  const rowById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  // Orders on this page read their live row, so bulk counts follow a single-order move.
  const selected = useMemo(() => [...selection.values()].map((o) => rowById.get(o.id) ?? o), [selection, rowById]);
  const allSelected = total > 0 && selected.length >= total;
  const toggleOne = (order: SellerOrderRow, on: boolean) =>
    setSelection((prev) => {
      const next = new Map(prev);
      if (on) next.set(order.id, order);
      else next.delete(order.id);
      return next;
    });
  const toggleAll = (on: boolean) => {
    if (!on) {
      setSelection(new Map());
      return;
    }
    startSelecting(async () => {
      const res = await selectFilteredOrdersAction(filters);
      if (!res.success) {
        toast.error(t("bulk.selectAllFailed"));
        return;
      }
      setSelection(new Map(res.orders.map((o) => [o.id, o])));
      if (res.capped) toast.warning(t("bulk.selectCapped", { count: res.orders.length }));
    });
  };
  const tableSelection = useMemo<RowSelectionState>(
    () => Object.fromEntries([...selection.keys()].map((id) => [id, true])),
    [selection],
  );
  const onTableSelection = (next: RowSelectionState) =>
    setSelection(
      new Map(
        Object.keys(next).flatMap((id) => {
          const order = next[id] ? (selection.get(id) ?? rowById.get(id)) : null;
          return order ? [[id, order] as const] : [];
        }),
      ),
    );

  const openById = useCallback(
    (id: string) => {
      setDetached(rowById.get(id) ?? null);
      setOpenOrderId(id);
    },
    [rowById],
  );

  // Another `?order=` while the page is mounted (header search) opens that one.
  useEffect(() => {
    if (initialOrderId) setOpenOrderId(initialOrderId);
  }, [initialOrderId]);

  // The panel reads the live row, so it updates in place after an action. When
  // the action moved the order off this page, it is read on its own.
  const liveRow = openOrderId
    ? (rowById.get(openOrderId) ?? (linkedOrder?.id === openOrderId ? linkedOrder : null))
    : null;
  useEffect(() => {
    if (!openOrderId || liveRow) return;
    let live = true;
    loadOrderRowAction(openOrderId).then((row) => {
      if (live && row) setDetached(row);
    });
    return () => {
      live = false;
    };
  }, [openOrderId, liveRow, rows]);
  const openOrder = liveRow ?? (detached?.id === openOrderId ? detached : null);

  const storeChannel = filters.channel !== "all" && filters.channel !== "marketplace";

  return (
    <div className="space-y-4">
      {/* No page title: the header breadcrumb names the page. */}
      <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

      <div
        className="-mb-px flex min-w-0 max-w-full gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--border)] [scrollbar-width:none]"
        role="tablist"
        aria-label={t("table.status")}
      >
        {ORDERS_TABS.map((key) => {
          const on = filters.tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => applyFilter({ tab: key })}
              className={cn(
                "flex h-10.5 cursor-pointer items-center gap-2 whitespace-nowrap px-3.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                on && "font-semibold text-primary-ink shadow-[inset_0_-2px_0_var(--primary)]",
              )}
            >
              {t(`tabs.${key}`)}
              <span
                className={cn(
                  "inline-grid h-5 min-w-[22px] place-items-center rounded-full border bg-muted px-1.5 text-[11px] font-bold text-muted-foreground tabular-nums",
                  on && "border-transparent bg-primary-soft text-primary-ink",
                  key === "new" && counts.new > 0 && "border-transparent bg-primary text-primary-foreground",
                )}
              >
                {formatNumber(counts[key], locale)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1 basis-full sm:max-w-95 sm:basis-auto">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="h-10 rounded-[10px] bg-card ps-9"
          />
        </div>
        {stores.length > 0 && (
          <Select value={filters.channel} onValueChange={(value) => applyFilter({ channel: value })}>
            <SelectTrigger className="rounded-[10px] bg-card" aria-label={tChannel("label")}>
              <Store className="size-4 text-muted-foreground" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tChannel("all")}</SelectItem>
              <SelectItem value="marketplace">{tChannel("marketplace")}</SelectItem>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={filters.sort} onValueChange={(value) => navigate({ sort: value as OrdersSort, page: 1 })}>
          <SelectTrigger className="rounded-[10px] bg-card" aria-label={t("sort.label")}>
            <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDERS_SORTS.map((key) => (
              <SelectItem key={key} value={key}>
                {t(`sort.${key}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(overview.attention > 0 || filters.attention) && (
          <button
            type="button"
            aria-pressed={filters.attention}
            onClick={() => applyFilter({ attention: !filters.attention })}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-[10px] border bg-card px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
              filters.attention && "border-destructive/40 bg-destructive/10 text-destructive hover:text-destructive",
            )}
          >
            <CircleAlert className="size-4" aria-hidden="true" />
            {t("bosta.attentionFilter", { count: overview.attention })}
          </button>
        )}
        <Button asChild className="ms-auto h-10">
          <Link href={storeChannel ? `/orders/new?store=${filters.channel}` : "/orders/new"}>{t("createOrder")}</Link>
        </Button>
        <ExportOrdersButton filters={filters} count={total} className="h-10" />
        {storeChannel && shipQueue.wassalha && (
          <WassalhaExportButton storeId={filters.channel} orders={shipQueue.orders} showCount className="h-10" />
        )}
        <PrintOrdersButton orderIds={printIds} total={total} showCount className="h-10" />
        <div
          className={cn(
            "inline-flex gap-0.5 rounded-[11px] border bg-card p-[3px]",
            total === 0 && "ms-auto",
          )}
          role="group"
          aria-label={tList("viewLabel")}
        >
          {(
            [
              ["grid", LayoutGrid, tList("gridView")],
              ["table", List, tList("tableView")],
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
                view === mode && "bg-primary-soft text-primary-ink hover:text-primary-ink",
              )}
            >
              <Icon className="size-[17px]" />
            </button>
          ))}
        </div>
      </div>

      {storeChannel && shipQueue.bosta && <BostaBulkBar storeId={filters.channel} orders={shipQueue.orders} />}

      <OrdersBulkBar orders={selected} onClear={() => setSelection(new Map())} />

      {total === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-input bg-card px-5 py-14 text-center text-[13px] text-muted-foreground">
          <span className="mb-1 grid size-12 place-items-center rounded-xl bg-primary-soft text-primary-ink">
            <PackageSearch className="size-5" aria-hidden="true" />
          </span>
          {overview.orders === 0 ? (
            <>
              <b className="text-[15px] text-foreground">{t("empty.title")}</b>
              <span>{t("empty.description")}</span>
            </>
          ) : (
            <b className="text-[15px] text-foreground">{t("empty.tab")}</b>
          )}
        </div>
      ) : (
        <>
          <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
            <Checkbox
              checked={allSelected ? true : selected.length > 0 ? "indeterminate" : false}
              disabled={isSelecting}
              onCheckedChange={(value) => toggleAll(value === true)}
            />
            {t("bulk.selectAll", { count: total })}
          </label>
          {view === "table" ? (
            <OrdersTable
              orders={rows}
              rowIndexOffset={(filters.page - 1) * filters.size}
              onOpen={openById}
              selection={tableSelection}
              onSelectionChange={onTableSelection}
            />
          ) : (
            <div
              aria-busy={isNavigating}
              className={cn(
                "grid gap-3 transition-opacity sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] sm:gap-4",
                isNavigating && "opacity-60",
              )}
            >
              {rows.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onOpen={() => openById(order.id)}
                  selected={selection.has(order.id)}
                  onSelectedChange={(on) => toggleOne(order, on)}
                />
              ))}
            </div>
          )}

          <ListPager
            page={filters.page}
            pages={pages}
            size={filters.size}
            sizes={ORDERS_PAGE_SIZES}
            total={total}
            onPage={goToPage}
            onSize={changePageSize}
          />
        </>
      )}

      <OrderDetailsDialog
        order={openOrder}
        onClose={() => {
          setOpenOrderId(null);
          // Drop the deep-link param so a refresh doesn't reopen the dialog.
          if (initialOrderId) window.history.replaceState(null, "", ordersListHref(filters));
        }}
      />
    </div>
  );
}

export function VendorOrdersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-80 max-w-full rounded-md bg-muted" />
      <div className="h-10.5 w-full max-w-xl rounded-md bg-muted" />
      <div className="grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] sm:gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-64 rounded-2xl border bg-muted" />
        ))}
      </div>
    </div>
  );
}
