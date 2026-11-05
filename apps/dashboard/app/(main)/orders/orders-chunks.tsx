"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { CircleAlert, LayoutGrid, List, PackageSearch, Plus } from "lucide-react";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { TableSection } from "@workspace/ui/components/table-section";
import { Chip, EmptyState, PageHeader, SellerButton, SellerCard } from "@/components/seller-ui";
import { cn, getPublicUrl } from "@/lib/utils";
import { formatDateTime, formatNumber } from "@/lib/i18n/format";
import { Money } from "@/components/money";
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
import { PILL_SELECT, PhoneText, SearchPill } from "./orders-ui";
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
import { WassalhaTrackingUpload } from "./wassalha-tracking.client";

const VIEW_STORAGE_KEY = "tl-orders-view";

const noViewUpdates = () => () => {};
function readSavedView(): OrdersViewMode | null {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    return saved === "grid" || saved === "table" ? saved : null;
  } catch {
    return null;
  }
}

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
              className="size-10 rounded-xl border-2 border-(--s-surface) object-cover"
            />
          ))
        ) : (
          <div className="size-10 rounded-xl border border-(--s-line) bg-(--s-fill)" />
        )}
      </div>
      <div className="min-w-0">
        <div className="max-w-48 truncate font-semibold text-(--s-text)">{first?.productName}</div>
        <div className="text-xs text-(--s-subtle)">
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
              className="cursor-pointer rounded-sm font-montserrat font-bold text-(--s-link) hover:underline"
            >
              #{row.original.orderNumber}
            </button>
            <div className="text-xs text-(--s-subtle)">
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
            <div className="truncate font-semibold text-(--s-text)">{row.original.customerName || t("guest")}</div>
            {row.original.customerPhone && (
              <div className="text-xs text-(--s-subtle)">
                <PhoneText phone={row.original.customerPhone} />
              </div>
            )}
            <OrderRiskBadges order={row.original} className="mt-0.5" />
            {row.original.address?.area && (
              <div className="truncate text-xs text-(--s-subtle)">{row.original.address.area}</div>
            )}
          </div>
        ),
      },
      {
        id: "items",
        header: tTable("items"),
        size: 230,
        cell: ({ row }) => <ItemsCell order={row.original} />,
      },
      {
        id: "total",
        header: tTable("total"),
        size: 120,
        accessorFn: (row) => Number(row.totalAmount),
        cell: ({ row }) => (
          <div>
            <div className="font-montserrat font-bold text-(--s-ink) tabular-nums" dir="ltr">
              <Money value={row.original.totalAmount} locale={locale} unit={row.original} />
            </div>
            {row.original.paymentMethod && tPayment.has(row.original.paymentMethod) && (
              <div className="text-xs text-(--s-subtle)">{tPayment(row.original.paymentMethod)}</div>
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
        size: 230,
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <OrderActions order={row.original} compact className="flex-nowrap" />
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

  // The saved view is read after hydration, so the server and first client render agree.
  const [chosenView, setView] = useState<OrdersViewMode | null>(null);
  const savedView = useSyncExternalStore(noViewUpdates, readSavedView, () => null);
  const view = chosenView ?? savedView ?? "grid";
  // The typed search; the URL follows it after a short pause.
  const [query, setQuery] = useState(filters.q);
  const [openOrderId, setOpenOrderId] = useState<string | null>(initialOrderId);
  // The open order when it isn't in `rows`: it moved to another tab after an action.
  const [detached, setDetached] = useState<SellerOrderRow | null>(null);
  // Bulk selection by order id (F-04c); can span pages the browser never loaded.
  const [selection, setSelection] = useState<ReadonlyMap<string, OrderSummary>>(() => new Map());
  const [isNavigating, startNavigation] = useTransition();
  const [isSelecting, startSelecting] = useTransition();

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
      setSelection(new Map());
      navigate({ q: next, page: 1 }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, lastPushedQuery, navigate]);

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
  const [seenInitialOrderId, setSeenInitialOrderId] = useState(initialOrderId);
  if (initialOrderId !== seenInitialOrderId) {
    setSeenInitialOrderId(initialOrderId);
    if (initialOrderId) setOpenOrderId(initialOrderId);
  }

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
    <>
      <PageHeader
        title={t("pageTitle")}
        description={t("subtitle")}
        actions={
          <>
            <ExportOrdersButton filters={filters} count={total} />
            {storeChannel && shipQueue.wassalha && <WassalhaExportButton storeId={filters.channel} orders={shipQueue.orders} showCount />}
            {storeChannel && shipQueue.wassalha && <WassalhaTrackingUpload storeId={filters.channel} />}
            <PrintOrdersButton orderIds={printIds} total={total} showCount />
            <SellerButton asChild>
              <Link href={storeChannel ? `/orders/new?store=${filters.channel}` : "/orders/new"}>
                <Plus aria-hidden />
                {t("createOrder")}
              </Link>
            </SellerButton>
          </>
        }
      />

      {/* Status tabs */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]" role="tablist" aria-label={t("table.status")}>
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
                "inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-(--s-field) bg-(--s-surface) px-4 text-[13.5px] font-semibold text-(--s-body) transition-colors duration-150 hover:border-(--s-outline-hover)",
                on && "border-(--s-solid) bg-(--s-solid) text-(--s-solid-fg) hover:border-(--s-solid)",
              )}
            >
              {t(`tabs.${key}`)}
              <em
                className={cn(
                  "grid h-5 min-w-[22px] place-items-center rounded-full bg-(--s-fill) px-1.5 font-montserrat text-[11px] font-bold not-italic tabular-nums text-(--s-muted)",
                  key === "new" && counts.new > 0 && "bg-accent text-accent-foreground",
                  on && key !== "new" && "bg-white/20 text-(--s-solid-fg)",
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
        <SearchPill value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchLabel")} />
        {stores.length > 0 && (
          <Select value={filters.channel} onValueChange={(value) => applyFilter({ channel: value })}>
            <SelectTrigger className={PILL_SELECT} aria-label={tChannel("label")}>
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
          <SelectTrigger className={PILL_SELECT} aria-label={t("sort.label")}>
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
          <Chip
            pressed={filters.attention}
            onClick={() => applyFilter({ attention: !filters.attention })}
            className="h-[42px] border-destructive/40 text-destructive hover:border-destructive aria-pressed:border-destructive aria-pressed:bg-destructive aria-pressed:text-white max-[600px]:h-[42px]"
          >
            <CircleAlert aria-hidden />
            {t("bosta.attentionFilter", { count: overview.attention })}
          </Chip>
        )}
        {/* A phone always shows cards, so the switch only appears where a table fits. */}
        <div className="ms-auto inline-flex rounded-full border border-(--s-field) bg-(--s-surface) p-[3px] max-[720px]:hidden" role="group" aria-label={tList("viewLabel")}>
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
                "grid h-[34px] w-9 cursor-pointer place-items-center rounded-full text-(--s-subtle) transition-colors duration-150 hover:text-(--s-ink)",
                view === mode && "bg-primary-soft text-primary-ink hover:text-primary-ink",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {storeChannel && shipQueue.bosta && <BostaBulkBar storeId={filters.channel} orders={shipQueue.orders} />}

      {total === 0 ? (
        <SellerCard>
          <EmptyState
            icon={PackageSearch}
            title={overview.orders === 0 ? t("empty.title") : t("empty.tab")}
            description={overview.orders === 0 ? t("empty.description") : undefined}
          />
        </SellerCard>
      ) : (
        <div className={cn("flex min-w-0 flex-col gap-3.5", selection.size > 0 && "pb-28 max-[720px]:pb-44")}>
          <label className="flex min-h-10 w-fit cursor-pointer items-center gap-2 text-[13px] font-medium text-(--s-muted)">
            <Checkbox
              checked={allSelected ? true : selected.length > 0 ? "indeterminate" : false}
              disabled={isSelecting}
              onCheckedChange={(value) => toggleAll(value === true)}
              className="size-5"
            />
            {t("bulk.selectAll", { count: total })}
          </label>
          {view === "table" && (
            <div aria-busy={isNavigating} className={cn("min-w-0 transition-opacity max-[720px]:hidden", isNavigating && "opacity-60")}>
              <OrdersTable
                orders={rows}
                rowIndexOffset={(filters.page - 1) * filters.size}
                onOpen={openById}
                selection={tableSelection}
                onSelectionChange={onTableSelection}
              />
            </div>
          )}
          <div
            aria-busy={isNavigating}
            className={cn(
              "grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3.5 transition-opacity max-[600px]:gap-2.5",
              view === "table" && "min-[721px]:hidden",
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

          <ListPager
            page={filters.page}
            pages={pages}
            size={filters.size}
            sizes={ORDERS_PAGE_SIZES}
            total={total}
            onPage={goToPage}
            onSize={changePageSize}
          />
        </div>
      )}

      <OrdersBulkBar orders={selected} onClear={() => setSelection(new Map())} />

      <OrderDetailsDialog
        order={openOrder}
        onClose={() => {
          setOpenOrderId(null);
          // Drop the deep-link param so a refresh does not reopen the dialog.
          if (initialOrderId) window.history.replaceState(null, "", ordersListHref(filters));
        }}
      />
    </>
  );
}
