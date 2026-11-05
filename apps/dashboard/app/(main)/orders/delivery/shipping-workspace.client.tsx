"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertTriangle,
  Banknote,
  Bike,
  CheckCircle2,
  MapPin,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  Search,
  Truck,
  UserPlus,
} from "lucide-react";
import { TableSection } from "@workspace/ui/components/table-section";
import { bulkUpdateShipmentStatus, setSellerRiderActive, setSellerRiderAvailable } from "@/actions/shipping";
import {
  Chip,
  Chips,
  EmptyState,
  IconButton,
  KpiCard,
  KpiGrid,
  PageHeader,
  PageTabs,
  SellerButton,
  SellerCard,
  StatusBadge,
  Tag,
  TextInput,
  Toggle,
  type BadgeTone,
} from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { formatDateTime, totalsByCurrency } from "@/lib/i18n/format";
import { Money, MoneyLines } from "@/components/money";
import type { ShippingStatus } from "@/lib/shipping/shipping-status";
import type { SellerRider, ShippingOrderRow } from "@/lib/shipping/shipping.types";
import { AssignRiderDialog } from "./assign-rider-dialog.client";
import { RiderFormDialog } from "./rider-form-dialog.client";
import { StatusActions } from "./status-actions.client";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { useTableSectionLabels } from "@/lib/i18n/table-labels";

type OrderTab = "all" | "ready" | "assigned" | "out_for_delivery" | "delivered" | "issues";

const TAB_FILTER: Record<OrderTab, (r: ShippingOrderRow) => boolean> = {
  all: () => true,
  ready: (r) => r.status === "pending",
  assigned: (r) => r.status === "assigned",
  out_for_delivery: (r) => r.status === "out_for_delivery",
  delivered: (r) => r.status === "delivered",
  issues: (r) => r.status === "failed" || r.status === "returned" || r.status === "cancelled",
};

const STATUS_TONE: Record<ShippingStatus, BadgeTone> = {
  pending: "warning",
  assigned: "info",
  out_for_delivery: "info",
  delivered: "success",
  failed: "danger",
  returned: "warning",
  cancelled: "muted",
};

/** Rows the phone list shows before "show more"; the wide table pages itself. */
const PHONE_PAGE = 30;

const isToday = (iso: string | null) =>
  iso ? new Date(iso).toDateString() === new Date().toDateString() : false;

export function ShippingWorkspace({
  orders,
  riders,
  initialView = "orders",
}: {
  orders: ShippingOrderRow[];
  riders: SellerRider[];
  /** /orders/delivery opens the deliveries, /orders/riders the riders (P3-06). */
  initialView?: "orders" | "riders";
}) {
  const t = useTranslations("shipping");
  const tStatus = useTranslations("status.shipping");
  const locale = useLocale();
  const [view, setView] = useState<"orders" | "riders">(initialView);
  const [bulkPending, startBulk] = useTransition();

  const tableLabels = useTableSectionLabels();
  // Bulk "Mark delivered" asks first: it closes the orders and settles cash on delivery.
  const [deliverIds, setDeliverIds] = useState<string[]>([]);

  const runBulk = (orderIds: string[], status: "out_for_delivery" | "delivered", onDone?: () => void) =>
    startBulk(async () => {
      const res = await bulkUpdateShipmentStatus({ orderIds, status });
      if (res.success) {
        toast.success(res.message);
        onDone?.();
      } else toast.error(res.error);
    });
  const [tab, setTab] = useState<OrderTab>("all");
  const [assignIds, setAssignIds] = useState<string[]>([]);
  const [assignCurrent, setAssignCurrent] = useState<string | null>(null);
  const [riderDialog, setRiderDialog] = useState<{ open: boolean; rider: SellerRider | null }>({
    open: false,
    rider: null,
  });

  const stats = useMemo(() => {
    const active = orders.filter(
      (o) => o.status === "assigned" || o.status === "out_for_delivery"
    );
    return {
      ready: orders.filter((o) => o.status === "pending" && o.editable).length,
      inProgress: active.length,
      deliveredToday: orders.filter((o) => o.status === "delivered" && isToday(o.deliveredAt))
        .length,
      issues: orders.filter((o) => o.status === "failed").length,
      // Never one sum across currencies: EGP, then one line per other currency.
      cod: totalsByCurrency(active, (o) => ({ currency: o.currency, amount: o.codDue })),
    };
  }, [orders]);

  const counts = useMemo(() => {
    const map = {} as Record<OrderTab, number>;
    (Object.keys(TAB_FILTER) as OrderTab[]).forEach((k) => {
      map[k] = orders.filter(TAB_FILTER[k]).length;
    });
    return map;
  }, [orders]);

  const visibleOrders = useMemo(() => orders.filter(TAB_FILTER[tab]), [orders, tab]);

  const openAssign = (ids: string[], current: string | null = null) => {
    setAssignCurrent(current);
    setAssignIds(ids);
  };

  /** The moves for the chosen orders; the server re-checks every order and skips the ones that can't move. */
  const bulkButtons = (picked: ShippingOrderRow[]) => {
    const selected = picked.filter((r) => r.editable && r.status === "pending");
    const toOut = picked.filter((r) => r.editable && r.status === "assigned");
    const toDelivered = picked.filter((r) => r.editable && r.status === "out_for_delivery");
    if (selected.length === 0 && toOut.length === 0 && toDelivered.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {selected.length > 0 && (
          <SellerButton size="sm" onClick={() => openAssign(selected.map((r) => r.id))}>
            <UserPlus aria-hidden />
            {t("assignToOrders", { count: selected.length })}
          </SellerButton>
        )}
        {toOut.length > 0 && (
          <SellerButton variant="outline" size="sm" disabled={bulkPending} onClick={() => runBulk(toOut.map((r) => r.id), "out_for_delivery")}>
            {t("bulkOutForDelivery", { count: toOut.length })}
          </SellerButton>
        )}
        {toDelivered.length > 0 && (
          <SellerButton variant="outline" size="sm" disabled={bulkPending} onClick={() => setDeliverIds(toDelivered.map((r) => r.id))}>
            {t("bulkDelivered", { count: toDelivered.length })}
          </SellerButton>
        )}
      </div>
    );
  };

  const statusCell = (r: ShippingOrderRow) => (
    <div className="flex flex-col items-start gap-1">
      <StatusBadge tone={STATUS_TONE[r.status]}>{tStatus(r.status)}</StatusBadge>
      {r.status === "failed" && r.failureReason && (
        <div className="line-clamp-2 max-w-40 text-xs text-destructive" title={r.failureReason}>
          {r.failureReason}
        </div>
      )}
    </div>
  );

  const paymentCell = (r: ShippingOrderRow) =>
    r.codDue > 0 ? (
      <div className="flex flex-col items-start gap-1">
        <Tag tone="warning">{t("cod")}</Tag>
        <div className="font-montserrat text-[13px] font-semibold text-(--s-ink) tabular-nums">
          <Money value={r.codDue} locale={locale} unit={r} />
        </div>
      </div>
    ) : (
      <Tag tone="success">{r.paymentStatus === "collected" ? t("collected") : t("paid")}</Tag>
    );

  const columns = useMemo<ColumnDef<ShippingOrderRow, any>[]>(
    () => [
      {
        id: "order",
        header: t("columns.order"),
        size: 170,
        accessorFn: (r) =>
          `${r.orderNumber} ${r.customerName} ${r.customerPhone ?? ""} ${r.city ?? ""}`,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <div className="font-montserrat font-semibold text-(--s-ink)">#{row.original.orderNumber}</div>
            <div className="text-xs text-(--s-subtle)">
              {formatDateTime(row.original.createdAt, locale)}
            </div>
          </div>
        ),
      },
      {
        id: "customer",
        header: t("columns.customer"),
        size: 260,
        enableSorting: false,
        cell: ({ row }) => <CustomerBlock row={row.original} />,
      },
      {
        id: "items",
        header: t("columns.items"),
        size: 200,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-52 text-[13px] text-(--s-muted)" title={row.original.itemsSummary}>
            {row.original.itemsSummary}
          </span>
        ),
      },
      {
        id: "payment",
        header: t("columns.payment"),
        size: 130,
        accessorFn: (r) => r.codDue,
        cell: ({ row }) => paymentCell(row.original),
      },
      {
        id: "rider",
        header: t("columns.rider"),
        size: 150,
        accessorFn: (r) => r.riderName ?? "",
        cell: ({ row }) =>
          row.original.riderName ? (
            <span className="text-[13px] text-(--s-text)">{row.original.riderName}</span>
          ) : (
            <span className="text-xs text-(--s-subtle)">{t("unassigned")}</span>
          ),
      },
      {
        id: "status",
        header: t("columns.status"),
        size: 150,
        accessorFn: (r) => r.status,
        cell: ({ row }) => statusCell(row.original),
      },
      {
        id: "actions",
        header: "",
        size: 220,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <StatusActions
            row={row.original}
            onAssign={(r) => openAssign([r.id], r.riderId)}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the cell helpers only read t, tStatus and locale.
    [t, tStatus, locale]
  );

  const openNewRider = () => setRiderDialog({ open: true, rider: null });

  return (
    <>
      <PageHeader
        title={view === "orders" ? t("pageTitle") : t("ridersTitle")}
        description={t("subtitle")}
        actions={
          <SellerButton onClick={openNewRider}>
            <Plus aria-hidden />
            {t("addRider")}
          </SellerButton>
        }
      />

      <KpiGrid>
        <KpiCard
          label={t("stats.ready")}
          value={stats.ready}
          footer={stats.ready ? t("stats.readyHint") : t("stats.allCaughtUp")}
          icon={PackageCheck}
          tone="accent"
        />
        <KpiCard label={t("stats.inProgress")} value={stats.inProgress} footer={t("stats.inProgressHint")} icon={Truck} tone="info" />
        <KpiCard
          label={t("stats.deliveredToday")}
          value={stats.deliveredToday}
          footer={t("stats.failedAttempts", { count: stats.issues })}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label={t("stats.cashWithRiders")}
          value={
            stats.cod.length === 0 ? (
              <Money value={0} locale={locale} />
            ) : (
              <MoneyLines totals={stats.cod} locale={locale} />
            )
          }
          footer={t("stats.cashHint")}
          icon={Banknote}
          tone="neutral"
        />
      </KpiGrid>

      <PageTabs
        label={t("title")}
        value={view}
        onChange={(key) => setView(key as "orders" | "riders")}
        tabs={[
          { key: "orders", label: t("deliveries", { count: orders.length }), icon: Truck },
          { key: "riders", label: t("riders", { count: riders.length }), icon: Bike },
        ]}
      />

      {view === "orders" ? (
        <div className="flex min-w-0 flex-col gap-3.5">
          <Chips role="group" aria-label={t("columns.status")}>
            {(Object.keys(TAB_FILTER) as OrderTab[]).map((key) => (
              <Chip key={key} pressed={tab === key} onClick={() => setTab(key)}>
                {key === "issues" && counts.issues > 0 && <AlertTriangle className="text-(--tallaby-amber-700)" aria-hidden />}
                {t(`tabs.${key}`)}
                <span className="text-xs opacity-70 tabular-nums">{counts[key]}</span>
              </Chip>
            ))}
          </Chips>

          {orders.length === 0 ? (
            <SellerCard>
              <EmptyState
                icon={Truck}
                title={t("emptyDeliveries")}
                action={
                  <SellerButton asChild variant="outline" size="sm">
                    <Link href="/orders">{t("goToOrders")}</Link>
                  </SellerButton>
                }
              />
            </SellerCard>
          ) : (
            <>
              <div className="min-w-0 max-[720px]:hidden">
                <TableSection<ShippingOrderRow>
                  rows={visibleOrders}
                  columns={columns}
                  searchColumnId="order"
                  labels={tableLabels}
                  hideViewOptions
                  buttons={(table) => bulkButtons(table.getSelectedRowModel().rows.map((r) => r.original))}
                />
              </div>
              <PhoneOrderList
                key={tab}
                rows={visibleOrders}
                statusCell={statusCell}
                paymentCell={paymentCell}
                bulkButtons={bulkButtons}
                onAssign={(r) => openAssign([r.id], r.riderId)}
                searchPlaceholder={tableLabels.searchPlaceholder ?? t("columns.order")}
              />
            </>
          )}
        </div>
      ) : (
        <RidersPanel riders={riders} onAdd={openNewRider} onEdit={(rider) => setRiderDialog({ open: true, rider })} />
      )}

      <ConfirmActionDialog
        open={deliverIds.length > 0}
        onOpenChange={(open) => !open && setDeliverIds([])}
        title={t("bulkDeliveredConfirm.title", { count: deliverIds.length })}
        description={t("bulkDeliveredConfirm.description")}
        confirmLabel={t("bulkDelivered", { count: deliverIds.length })}
        pending={bulkPending}
        onConfirm={() => runBulk(deliverIds, "delivered", () => setDeliverIds([]))}
      />
      <AssignRiderDialog
        orderIds={assignIds}
        currentRiderId={assignCurrent}
        riders={riders}
        onClose={() => setAssignIds([])}
        onAddRider={openNewRider}
      />
      <RiderFormDialog
        open={riderDialog.open}
        rider={riderDialog.rider}
        onClose={() => setRiderDialog({ open: false, rider: null })}
      />
    </>
  );
}

function CustomerBlock({ row: r }: { row: ShippingOrderRow }) {
  const t = useTranslations("shipping");
  return (
    <div className="flex min-w-0 flex-col gap-0.5 text-[13px]">
      <div className="font-semibold text-(--s-text)">{r.customerName}</div>
      {r.customerPhone && (
        <a
          href={`tel:${r.customerPhone}`}
          dir="ltr"
          className="flex w-fit items-center gap-1 font-montserrat text-xs text-(--s-subtle) hover:text-(--s-ink) max-[600px]:min-h-10"
        >
          <Phone className="size-3" aria-hidden />
          {r.customerPhone}
        </a>
      )}
      <div className="flex items-start gap-1 text-xs text-(--s-subtle)">
        <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />
        <span className="line-clamp-2">{[r.addressLine, r.city].filter(Boolean).join(", ") || t("noAddress")}</span>
      </div>
    </div>
  );
}

/**
 * The deliveries on a phone: a card per order with no sideways scroll, the same
 * search and bulk moves as the wide table. Hidden by CSS above 720px.
 */
function PhoneOrderList({
  rows,
  statusCell,
  paymentCell,
  bulkButtons,
  onAssign,
  searchPlaceholder,
}: {
  rows: ShippingOrderRow[];
  statusCell: (r: ShippingOrderRow) => React.ReactNode;
  paymentCell: (r: ShippingOrderRow) => React.ReactNode;
  bulkButtons: (picked: ShippingOrderRow[]) => React.ReactNode;
  onAssign: (r: ShippingOrderRow) => void;
  searchPlaceholder: string;
}) {
  const t = useTranslations("shipping");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [shown, setShown] = useState(PHONE_PAGE);

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? rows.filter((r) => `${r.orderNumber} ${r.customerName} ${r.customerPhone ?? ""} ${r.city ?? ""}`.toLowerCase().includes(needle))
    : rows;
  const toggle = (id: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="hidden min-w-0 flex-col gap-2.5 max-[720px]:flex">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-(--s-subtle)" aria-hidden />
        <TextInput
          type="search"
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
          className="ps-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {bulkButtons(rows.filter((r) => picked.has(r.id)))}
      {matches.slice(0, shown).map((r) => (
        <SellerCard key={r.id} className="flex flex-col gap-2.5 p-3.5">
          <div className="flex items-start justify-between gap-2.5">
            <label className="flex min-w-0 cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                className="size-5 shrink-0 accent-(--s-primary)"
                aria-label={`#${r.orderNumber}`}
                checked={picked.has(r.id)}
                onChange={() => toggle(r.id)}
              />
              <span className="min-w-0">
                <b className="block font-montserrat text-sm font-semibold text-(--s-ink)">#{r.orderNumber}</b>
                <small className="block text-xs text-(--s-subtle)">{formatDateTime(r.createdAt, locale)}</small>
              </span>
            </label>
            {statusCell(r)}
          </div>
          <CustomerBlock row={r} />
          <p className="line-clamp-2 text-xs text-(--s-muted)">{r.itemsSummary}</p>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-(--s-line-soft) pt-2.5">
            <div className="min-w-0">
              {paymentCell(r)}
              <small className="mt-1 block text-xs text-(--s-subtle)">{r.riderName ?? t("unassigned")}</small>
            </div>
            <StatusActions row={r} onAssign={onAssign} />
          </div>
        </SellerCard>
      ))}
      {matches.length > shown && (
        <SellerButton variant="mini" size="sm" className="self-center" onClick={() => setShown((n) => n + PHONE_PAGE)}>
          {t("showMore")}
        </SellerButton>
      )}
    </div>
  );
}

function RidersPanel({
  riders,
  onAdd,
  onEdit,
}: {
  riders: SellerRider[];
  onAdd: () => void;
  onEdit: (rider: SellerRider) => void;
}) {
  const t = useTranslations("shipping");
  const [isPending, startTransition] = useTransition();

  const toggle = (
    action: typeof setSellerRiderActive,
    riderId: string,
    value: boolean
  ) =>
    startTransition(async () => {
      const res = await action({ riderId, value });
      if (!res.success) toast.error(res.error ?? t("toast.riderUpdateFailed"));
      else toast.success(res.message ?? t("toast.saved"));
    });

  if (riders.length === 0) {
    return (
      <SellerCard>
        <EmptyState
          icon={Bike}
          title={t("noRiders")}
          description={t("noRidersDescription")}
          action={
            <SellerButton variant="solid" onClick={onAdd}>
              <Plus aria-hidden />
              {t("addFirstRider")}
            </SellerButton>
          }
        />
      </SellerCard>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3.5 max-[1180px]:grid-cols-2 max-[720px]:grid-cols-1">
      {riders.map((rider) => (
        <SellerCard key={rider.id} className={cn("flex flex-col gap-3.5 p-[18px]", !rider.isActive && "opacity-70")}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-(--s-ink)">{rider.fullName ?? t("unnamedRider")}</div>
              <div className="truncate text-xs text-(--s-subtle)">{rider.email}</div>
              {rider.phone && (
                <a
                  href={`tel:${rider.phone}`}
                  dir="ltr"
                  className="mt-0.5 flex w-fit items-center gap-1 font-montserrat text-xs text-(--s-subtle) max-[600px]:mt-0 max-[600px]:min-h-10 hover:text-(--s-ink)"
                >
                  <Phone className="size-3" aria-hidden />
                  {rider.phone}
                </a>
              )}
            </div>
            <IconButton aria-label={t("editRiderLabel", { name: rider.fullName ?? "" })} onClick={() => onEdit(rider)}>
              <Pencil aria-hidden />
            </IconButton>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="rounded-xl bg-(--s-tint) p-2">
              <div className="font-montserrat text-lg font-bold text-(--s-ink) tabular-nums">{rider.activeDeliveries}</div>
              <div className="text-xs text-(--s-subtle)">{t("riderStats.active")}</div>
            </div>
            <div className="rounded-xl bg-(--s-tint) p-2">
              <div className="font-montserrat text-lg font-bold text-(--s-ink) tabular-nums">{rider.deliveredTotal}</div>
              <div className="text-xs text-(--s-subtle)">{t("riderStats.delivered")}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 border-t border-(--s-line-soft) pt-3">
            <Toggle
              className="w-full flex-row-reverse justify-between text-(--s-text)"
              label={t("activeAccount")}
              checked={rider.isActive}
              disabled={isPending}
              onCheckedChange={(v) => toggle(setSellerRiderActive, rider.id, v)}
            />
            <Toggle
              className="w-full flex-row-reverse justify-between text-(--s-text)"
              label={t("onDuty")}
              checked={rider.isAvailable}
              disabled={isPending || !rider.isActive}
              onCheckedChange={(v) => toggle(setSellerRiderAvailable, rider.id, v)}
            />
          </div>
        </SellerCard>
      ))}
    </div>
  );
}
