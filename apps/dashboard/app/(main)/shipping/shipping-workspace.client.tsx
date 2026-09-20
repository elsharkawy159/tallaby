"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
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
import { formatCurrency } from "@workspace/lib";
import { setSellerRiderActive, setSellerRiderAvailable } from "@/actions/shipping";
import { cn } from "@/lib/utils";
import {
  SHIPPING_STATUS_BADGE,
  SHIPPING_STATUS_LABEL,
} from "@/lib/shipping/shipping-status";
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

const TAB_LABEL: Record<OrderTab, string> = {
  all: "All",
  ready: "Ready to ship",
  assigned: "Assigned",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  issues: "Needs attention",
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
        header: "Order",
        size: 170,
        accessorFn: (r) =>
          `${r.orderNumber} ${r.customerName} ${r.customerPhone ?? ""} ${r.city ?? ""}`,
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-medium">#{row.original.orderNumber}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(row.original.createdAt).toLocaleString()}
            </div>
          </div>
        ),
      },
      {
        id: "customer",
        header: "Customer & address",
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
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-3 w-3" />
                  {r.customerPhone}
                </a>
              )}
              <div className="flex items-start gap-1 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                <span className="line-clamp-2">
                  {[r.addressLine, r.city].filter(Boolean).join(", ") || "No address"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "items",
        header: "Items",
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
        header: "Payment",
        size: 130,
        accessorFn: (r) => r.codDue,
        cell: ({ row }) => {
          const r = row.original;
          return r.codDue > 0 ? (
            <div>
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                COD
              </Badge>
              <div className="mt-1 text-sm font-medium tabular-nums">
                {formatCurrency(r.codDue)}
              </div>
            </div>
          ) : (
            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
              {r.paymentStatus === "collected" ? "Collected" : "Paid"}
            </Badge>
          );
        },
      },
      {
        id: "rider",
        header: "Rider",
        size: 150,
        accessorFn: (r) => r.riderName ?? "",
        cell: ({ row }) =>
          row.original.riderName ? (
            <span className="text-sm">{row.original.riderName}</span>
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          ),
      },
      {
        id: "status",
        header: "Status",
        size: 150,
        accessorFn: (r) => r.status,
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge variant="outline" className={SHIPPING_STATUS_BADGE[row.original.status]}>
              {SHIPPING_STATUS_LABEL[row.original.status]}
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
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shipping & Logistics</h1>
          <p className="mt-1 text-gray-600">
            Assign your riders, track every delivery and keep customers' orders moving.
          </p>
        </div>
        <Button onClick={() => setRiderDialog({ open: true, rider: null })}>
          <Plus className="mr-2 h-4 w-4" />
          Add rider
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ready to ship"
          value={stats.ready}
          hint={stats.ready ? "Waiting for a rider" : "All caught up"}
          icon={PackageCheck}
          tone="bg-yellow-100 text-yellow-700"
        />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          hint="Assigned or on the road"
          icon={Truck}
          tone="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Delivered today"
          value={stats.deliveredToday}
          hint={stats.issues ? `${stats.issues} failed attempt${stats.issues > 1 ? "s" : ""}` : "No failed attempts"}
          icon={CheckCircle2}
          tone="bg-green-100 text-green-700"
        />
        <StatCard
          label="Cash with riders"
          value={formatCurrency(stats.cod)}
          hint="COD on open deliveries"
          icon={Banknote}
          tone="bg-purple-100 text-purple-700"
        />
      </div>

      {/* View switch */}
      <Tabs value={view} onValueChange={(v) => setView(v as "orders" | "riders")}>
        <TabsList>
          <TabsTrigger value="orders">Deliveries ({orders.length})</TabsTrigger>
          <TabsTrigger value="riders">Riders ({riders.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "orders" ? (
        <div className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as OrderTab)}>
            <TabsList className="h-auto flex-wrap justify-start">
              {(Object.keys(TAB_LABEL) as OrderTab[]).map((key) => (
                <TabsTrigger key={key} value={key}>
                  {key === "issues" && counts.issues > 0 && (
                    <AlertTriangle className="mr-1 h-3.5 w-3.5 text-amber-600" />
                  )}
                  {TAB_LABEL[key]}
                  <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
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
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign rider to {selected.length} order{selected.length > 1 ? "s" : ""}
                </Button>
              );
            }}
          />

          {orders.length === 0 && (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No deliveries yet. Confirmed orders that you fulfill yourself will appear here.
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
  const [isPending, startTransition] = useTransition();

  const toggle = (
    action: typeof setSellerRiderActive,
    riderId: string,
    value: boolean
  ) =>
    startTransition(async () => {
      const res = await action({ riderId, value });
      if (!res.success) toast.error(res.error ?? "Could not update the rider");
      else toast.success(res.message ?? "Saved");
    });

  if (riders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <Truck className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 font-semibold">No riders yet</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Add the couriers who deliver your orders. You can then assign orders to them and follow
          each delivery.
        </p>
        <Button className="mt-4" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add your first rider
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
                <div className="truncate font-semibold">{rider.fullName ?? "Unnamed rider"}</div>
                <div className="truncate text-sm text-muted-foreground">{rider.email}</div>
                {rider.phone && (
                  <a
                    href={`tel:${rider.phone}`}
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
                aria-label={`Edit ${rider.fullName ?? "rider"}`}
                onClick={() => onEdit(rider)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-md bg-muted/60 p-2">
                <div className="text-lg font-bold tabular-nums">{rider.activeDeliveries}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div className="rounded-md bg-muted/60 p-2">
                <div className="text-lg font-bold tabular-nums">{rider.deliveredTotal}</div>
                <div className="text-xs text-muted-foreground">Delivered</div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-3 text-sm">
              <label className="flex items-center justify-between">
                <span>Active account</span>
                <Switch
                  checked={rider.isActive}
                  disabled={isPending}
                  onCheckedChange={(v) => toggle(setSellerRiderActive, rider.id, v)}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>On duty</span>
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
