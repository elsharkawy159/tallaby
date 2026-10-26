"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { TableSection } from "@workspace/ui/components/table-section";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { cn, getPublicUrl } from "@/lib/utils";
import { formatDateTime, formatMoney } from "@/lib/i18n/format";
import { useTableSectionLabels } from "@/lib/i18n/table-labels";
import type { SellerOrderStage } from "./order-flow.lib";
import { OrderActions } from "./order-actions.client";
import { OrderDetailsDialog } from "./order-details-dialog.client";
import { OrderStageBadge } from "./order-stage-badge";
import type { SellerOrderRow } from "./orders.types";

type ChannelFilter = "all" | "marketplace" | string;

/** Work queues, in the order a seller works through them. */
type StageTab = "all" | "new" | "to_ship" | "out_for_delivery" | "delivered" | "closed";

const TAB_STAGES: Record<Exclude<StageTab, "all">, SellerOrderStage[]> = {
  new: ["new", "awaiting_payment"],
  to_ship: ["to_ship"],
  out_for_delivery: ["out_for_delivery", "failed"],
  delivered: ["delivered"],
  closed: ["cancelled", "returned", "refund"],
};

const TABS: StageTab[] = ["all", "new", "to_ship", "out_for_delivery", "delivered", "closed"];

const inTab = (tab: StageTab, row: SellerOrderRow) =>
  tab === "all" || TAB_STAGES[tab].includes(row.flow.stage);

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
  const tTable = useTranslations("orders.table");
  const tChannel = useTranslations("orders.channel");
  const tPayment = useTranslations("orders.details.paymentMethods");
  const tableLabels = useTableSectionLabels();
  const locale = useLocale();
  const dir = locale === "en" ? "ltr" : "rtl";

  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [openOrderId, setOpenOrderId] = useState<string | null>(initialOrderId);

  // Open the work queue that needs the seller first.
  const [tab, setTab] = useState<StageTab>(() =>
    rows.some((r) => r.flow.stage === "new") ? "new" : "all",
  );

  const channelRows = useMemo(
    () =>
      channel === "all"
        ? rows
        : channel === "marketplace"
          ? rows.filter((r) => r.storeId === null)
          : rows.filter((r) => r.storeId === channel),
    [rows, channel],
  );
  const counts = useMemo(
    () => Object.fromEntries(TABS.map((tb) => [tb, channelRows.filter((r) => inTab(tb, r)).length])),
    [channelRows],
  ) as Record<StageTab, number>;
  const visibleRows = useMemo(() => channelRows.filter((r) => inTab(tab, r)), [channelRows, tab]);

  // The panel reads the live row, so it updates in place after an action.
  const openOrder = rows.find((r) => r.id === openOrderId) ?? null;

  const channels: { value: ChannelFilter; label: string }[] = [
    { value: "all", label: tChannel("all") },
    { value: "marketplace", label: tChannel("marketplace") },
    ...stores.map((s) => ({ value: s.id, label: s.name })),
  ];

  const columns = useMemo<ColumnDef<SellerOrderRow, any>[]>(
    () => [
      {
        id: "order",
        header: tTable("order"),
        size: 150,
        // Search matches the order number, the customer's name or phone.
        accessorFn: (row) => `${row.orderNumber} ${row.customerName} ${row.customerPhone ?? ""}`,
        cell: ({ row }) => (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setOpenOrderId(row.original.id)}
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
    [t, tTable, tPayment, locale],
  );

  return (
    <div className="space-y-4">
      {/* No page title: the header breadcrumb names the page. */}
      <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

      <Tabs value={tab} onValueChange={(v) => setTab(v as StageTab)} dir={dir}>
        <TabsList className="h-auto w-full justify-start overflow-x-auto sm:w-auto">
          {TABS.map((tb) => (
            <TabsTrigger key={tb} value={tb} className="gap-1.5">
              {t(`tabs.${tb}`)}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  tb === "new" && counts.new > 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {counts[tb]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {stores.length > 0 && (
        <div role="radiogroup" aria-label={tChannel("label")} className="flex flex-wrap gap-1.5">
          {channels.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={channel === c.value}
              onClick={() => setChannel(c.value)}
              className={
                channel === c.value
                  ? "rounded-full border border-primary bg-primary-soft px-3 py-1 text-xs font-medium text-primary-ink"
                  : "rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">{t("empty.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("empty.description")}</p>
        </div>
      ) : (
        <TableSection<SellerOrderRow>
          rows={visibleRows}
          columns={columns}
          searchColumnId="order"
          labels={{ ...tableLabels, noResults: t("empty.tab") }}
        />
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
      <div className="h-9 w-full max-w-xl rounded-md bg-muted" />
      <div className="h-72 rounded-md border bg-muted" />
    </div>
  );
}
