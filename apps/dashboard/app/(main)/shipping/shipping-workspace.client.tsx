"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  MapPin,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  Truck,
  UserPlus,
} from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Switch } from "@workspace/ui/components/switch";
import { TableSection } from "@workspace/ui/components/table-section";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { setSellerRiderActive, setSellerRiderAvailable } from "@/actions/shipping";
import { cn } from "@/lib/utils";
import { formatDateTime, formatMoney } from "@/lib/i18n/format";
import { SHIPPING_STATUS_BADGE } from "@/lib/shipping/shipping-status";
import type { SellerRider, ShippingOrderRow } from "@/lib/shipping/shipping.types";
import { AssignRiderDialog } from "./assign-rider-dialog.client";
import { RiderFormDialog } from "./rider-form-dialog.client";
import { StatusActions } from "./status-actions.client";

type OrderTab = "all" | "ready" | "assigned" | "out_for_delivery" | "delivered" | "issues";

const TAB_FILTER: Record<OrderTab, (r: ShippingOrderRow) => boolean> = {
  all: () => true,
  ready: (r) => r.status === "pending",
  assigned: (r) => r.status === "assigned",
  out_for_delivery: (r) => r.status === "out_for_delivery",
  delivered: (r) => r.status === "delivered",
  issues: (r) => r.status === "failed" || r.status === "returned" || r.status === "cancelled",
};

const isToday = (iso: string | null) =>
  iso ? new Date(iso).toDateString() === new Date().toDateString() : false;

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className={cn("rounded-full p-3", tone)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ShippingWorkspace({
  orders,
  riders,
}: {
  orders: ShippingOrderRow[];
  riders: SellerRider[];
}) {
  const t = useTranslations("shipping");
  const tStatus = useTranslations("status.shipping");
  const locale = useLocale();
  const [view, setView] = useState<"orders" | "riders">("orders");
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
      cod: active.reduce((sum, o) => sum + o.codDue, 0),
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

  const columns = useMemo<ColumnDef<ShippingOrderRow, any>[]>(
    () => [
      {
        id: "order",
        header: t("columns.order"),
        size: 170,
        accessorFn: (r) =>
          `${r.orderNumber} ${r.customerName} ${r.customerPhone ?? ""} ${r.city ?? ""}`,
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-medium">#{row.original.orderNumber}</div>
            <div className="text-xs text-muted-foreground">
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
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="min-w-0 space-y-0.5 text-sm">
              <div className="font-medium">{r.customerName}</div>
              {r.customerPhone && (
                <a
                  href={`tel:${r.customerPhone}`}
                  dir="ltr"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-3 w-3" />
                  {r.customerPhone}
                </a>
              )}
              <div className="flex items-start gap-1 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                <span className="line-clamp-2">
                  {[r.addressLine, r.city].filter(Boolean).join(", ") || t("noAddress")}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "items",
        header: t("columns.items"),
        size: 200,
        enableSorting: false,
        cell: ({ row }) => (
          <span
            className="line-clamp-2 max-w-52 text-sm text-muted-foreground"
            title={row.original.itemsSummary}
          >
            {row.original.itemsSummary}
          </span>
        ),
      },
      {
        id: "payment",
        header: t("columns.payment"),
        size: 130,
        accessorFn: (r) => r.codDue,
        cell: ({ row }) => {
          const r = row.original;
          return r.codDue > 0 ? (
            <div>
              <Badge variant="outline" className="border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                {t("cod")}
              </Badge>
              <div className="mt-1 text-sm font-medium tabular-nums">
                {formatMoney(r.codDue, locale)}
              </div>
            </div>
          ) : (
            <Badge variant="outline" className="border-green-200 dark:border-green-900/60 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300">
              {r.paymentStatus === "collected" ? t("collected") : t("paid")}
            </Badge>
          );
        },
      },
      {
        id: "rider",
        header: t("columns.rider"),
        size: 150,
        accessorFn: (r) => r.riderName ?? "",
        cell: ({ row }) =>
          row.original.riderName ? (
            <span className="text-sm">{row.original.riderName}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{t("unassigned")}</span>
          ),
      },
      {
        id: "status",
        header: t("columns.status"),
        size: 150,
        accessorFn: (r) => r.status,
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge variant="outline" className={SHIPPING_STATUS_BADGE[row.original.status]}>
              {tStatus(row.original.status)}
            </Badge>
            {row.original.status === "failed" && row.original.failureReason && (
              <div
                className="line-clamp-2 max-w-40 text-xs text-destructive"
                title={row.original.failureReason}
              >
                {row.original.failureReason}
              </div>
            )}
          </div>
        ),
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
    [t, tStatus, locale]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setRiderDialog({ open: true, rider: null })}>
          <Plus className="me-2 h-4 w-4" />
          {t("addRider")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("stats.ready")}
          value={stats.ready}
          hint={stats.ready ? t("stats.readyHint") : t("stats.allCaughtUp")}
          icon={PackageCheck}
          tone="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
        />
        <StatCard
          label={t("stats.inProgress")}
          value={stats.inProgress}
          hint={t("stats.inProgressHint")}
          icon={Truck}
          tone="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
        />
        <StatCard
          label={t("stats.deliveredToday")}
          value={stats.deliveredToday}
          hint={t("stats.failedAttempts", { count: stats.issues })}
          icon={CheckCircle2}
          tone="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
        />
        <StatCard
          label={t("stats.cashWithRiders")}
          value={formatMoney(stats.cod, locale)}
          hint={t("stats.cashHint")}
          icon={Banknote}
          tone="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
        />
      </div>

      {/* View switch */}
      <Tabs value={view} onValueChange={(v) => setView(v as "orders" | "riders")}>
        <TabsList>
          <TabsTrigger value="orders">{t("deliveries", { count: orders.length })}</TabsTrigger>
          <TabsTrigger value="riders">{t("riders", { count: riders.length })}</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "orders" ? (
        <div className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as OrderTab)}>
            <TabsList className="h-auto flex-wrap justify-start">
              {(Object.keys(TAB_FILTER) as OrderTab[]).map((key) => (
                <TabsTrigger key={key} value={key}>
                  {key === "issues" && counts.issues > 0 && (
                    <AlertTriangle className="me-1 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  )}
                  {t(`tabs.${key}`)}
                  <span className="ms-1.5 text-xs tabular-nums text-muted-foreground">
                    {counts[key]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <TableSection<ShippingOrderRow>
            rows={visibleOrders}
            columns={columns}
            searchColumnId="order"
            hideViewOptions
            buttons={(table) => {
              const selected = table
                .getSelectedRowModel()
                .rows.map((r) => r.original)
                .filter((r) => r.editable && r.status === "pending");
              if (selected.length === 0) return null;
              return (
                <Button
                  onClick={() => openAssign(selected.map((r) => r.id))}
                  className="bg-[#E9520E] hover:bg-[#D4460C]"
                >
                  <UserPlus className="me-2 h-4 w-4" />
                  {t("assignToOrders", { count: selected.length })}
                </Button>
              );
            }}
          />

          {orders.length === 0 && (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {t("emptyDeliveries")}
            </p>
          )}
        </div>
      ) : (
        <RidersPanel
          riders={riders}
          onAdd={() => setRiderDialog({ open: true, rider: null })}
          onEdit={(rider) => setRiderDialog({ open: true, rider })}
        />
      )}

      <AssignRiderDialog
        orderIds={assignIds}
        currentRiderId={assignCurrent}
        riders={riders}
        onClose={() => setAssignIds([])}
        onAddRider={() => setRiderDialog({ open: true, rider: null })}
      />
      <RiderFormDialog
        open={riderDialog.open}
        rider={riderDialog.rider}
        onClose={() => setRiderDialog({ open: false, rider: null })}
      />
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
      <div className="rounded-lg border border-dashed p-10 text-center">
        <Truck className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 font-semibold">{t("noRiders")}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {t("noRidersDescription")}
        </p>
        <Button className="mt-4" onClick={onAdd}>
          <Plus className="me-2 h-4 w-4" />
          {t("addFirstRider")}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {riders.map((rider) => (
        <Card key={rider.id} className={cn(!rider.isActive && "opacity-70")}>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-semibold">{rider.fullName ?? t("unnamedRider")}</div>
                <div className="truncate text-sm text-muted-foreground">{rider.email}</div>
                {rider.phone && (
                  <a
                    href={`tel:${rider.phone}`}
                    dir="ltr"
                    className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {rider.phone}
                  </a>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("editRiderLabel", { name: rider.fullName ?? "" })}
                onClick={() => onEdit(rider)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-md bg-muted/60 p-2">
                <div className="text-lg font-bold tabular-nums">{rider.activeDeliveries}</div>
                <div className="text-xs text-muted-foreground">{t("riderStats.active")}</div>
              </div>
              <div className="rounded-md bg-muted/60 p-2">
                <div className="text-lg font-bold tabular-nums">{rider.deliveredTotal}</div>
                <div className="text-xs text-muted-foreground">{t("riderStats.delivered")}</div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-3 text-sm">
              <label className="flex items-center justify-between">
                <span>{t("activeAccount")}</span>
                <Switch
                  checked={rider.isActive}
                  disabled={isPending}
                  onCheckedChange={(v) => toggle(setSellerRiderActive, rider.id, v)}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>{t("onDuty")}</span>
                <Switch
                  checked={rider.isAvailable}
                  disabled={isPending || !rider.isActive}
                  onCheckedChange={(v) => toggle(setSellerRiderAvailable, rider.id, v)}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
