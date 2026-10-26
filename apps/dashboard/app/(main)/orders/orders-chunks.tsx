"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, LayoutGrid, List, PackageSearch, Search, Store } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
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
import { pageList } from "../products/_components/products-view.lib";
import { OrderActions } from "./order-actions.client";
import { OrderCard } from "./order-card.client";
import { OrderDetailsDialog } from "./order-details-dialog.client";
import { OrderStageBadge } from "./order-stage-badge";
import {
  ORDERS_TABS,
  countByTab,
  initialTab,
  matchesChannel,
  matchesQuery,
  matchesTab,
  type OrdersChannel,
  type OrdersTab,
  type OrdersViewMode,
} from "./orders-view.lib";
import type { SellerOrderRow } from "./orders.types";

const VIEW_STORAGE_KEY = "tl-orders-view";
const GRID_PAGE_SIZE = 24;

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

function OrdersTable({ orders, onOpen }: { orders: SellerOrderRow[]; onOpen: (id: string) => void }) {
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
        cell: ({ row }) => <OrderStageBadge stage={row.original.flow.stage} />,
      },
      {
        id: "next",
        header: tTable("next"),
        size: 210,
        cell: ({ row }) => <OrderActions order={row.original} compact />,
      },
    ],
    [t, tTable, tPayment, locale, onOpen],
  );

  return (
    <TableSection<SellerOrderRow>
      rows={orders}
      columns={columns}
      hideSearch
      labels={{ ...tableLabels, noResults: t("empty.tab") }}
    />
  );
}

export function VendorOrdersTable({
  rows,
  initialOrderId = null,
  stores = [],
}: {
  rows: SellerOrderRow[];
  initialOrderId?: string | null;
  /** The seller's stores, for the sales-channel filter (P3-06). */
  stores?: { id: string; name: string }[];
}) {
  const t = useTranslations("orders");
  const tChannel = useTranslations("orders.channel");
  const tList = useTranslations("products.list");
  const locale = useLocale();

  const [view, setView] = useState<OrdersViewMode>("grid");
  const [tab, setTab] = useState<OrdersTab>(() => initialTab(rows));
  const [channel, setChannel] = useState<OrdersChannel>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [openOrderId, setOpenOrderId] = useState<string | null>(initialOrderId);

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

  const scoped = useMemo(
    () => rows.filter((r) => matchesChannel(r, channel) && matchesQuery(r, query)),
    [rows, channel, query],
  );
  const counts = useMemo(() => countByTab(scoped), [scoped]);
  const visible = useMemo(() => scoped.filter((r) => matchesTab(r, tab)), [scoped, tab]);

  const pages = Math.max(1, Math.ceil(visible.length / GRID_PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const pageItems = visible.slice((currentPage - 1) * GRID_PAGE_SIZE, currentPage * GRID_PAGE_SIZE);
  const rangeFrom = visible.length ? (currentPage - 1) * GRID_PAGE_SIZE + 1 : 0;
  const rangeTo = Math.min(currentPage * GRID_PAGE_SIZE, visible.length);
  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // The panel reads the live row, so it updates in place after an action.
  const openOrder = rows.find((r) => r.id === openOrderId) ?? null;

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
          const on = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setTab(key);
                setPage(1);
              }}
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
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="h-10 rounded-[10px] bg-card ps-9"
          />
        </div>
        {stores.length > 0 && (
          <Select
            value={channel}
            onValueChange={(value) => {
              setChannel(value);
              setPage(1);
            }}
          >
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
        <div
          className="ms-auto inline-flex gap-0.5 rounded-[11px] border bg-card p-[3px]"
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

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-input bg-card px-5 py-14 text-center text-[13px] text-muted-foreground">
          <span className="mb-1 grid size-12 place-items-center rounded-xl bg-primary-soft text-primary-ink">
            <PackageSearch className="size-5" aria-hidden="true" />
          </span>
          {rows.length === 0 ? (
            <>
              <b className="text-[15px] text-foreground">{t("empty.title")}</b>
              <span>{t("empty.description")}</span>
            </>
          ) : (
            <b className="text-[15px] text-foreground">{t("empty.tab")}</b>
          )}
        </div>
      ) : view === "table" ? (
        <OrdersTable orders={visible} onOpen={setOpenOrderId} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] sm:gap-4">
            {pageItems.map((order) => (
              <OrderCard key={order.id} order={order} onOpen={() => setOpenOrderId(order.id)} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted-foreground">
            <span className="tabular-nums">
              {tList("range", {
                from: formatNumber(rangeFrom, locale),
                to: formatNumber(rangeTo, locale),
                total: formatNumber(visible.length, locale),
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
                  aria-label={tList("previousPage")}
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
                      aria-label={tList("pageN", { page: p })}
                      aria-current={p === currentPage ? "page" : undefined}
                    >
                      {formatNumber(p, locale)}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-[9px]"
                  disabled={currentPage === pages}
                  onClick={() => goToPage(currentPage + 1)}
                  aria-label={tList("nextPage")}
                >
                  <ChevronLeft className="size-4 ltr:rotate-180" />
                </Button>
              </nav>
            )}
          </div>
        </>
      )}

      <OrderDetailsDialog
        order={openOrder}
        onClose={() => {
          setOpenOrderId(null);
          // Drop the deep-link param so a refresh doesn't reopen the dialog.
          if (initialOrderId) window.history.replaceState(null, "", "/orders");
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
