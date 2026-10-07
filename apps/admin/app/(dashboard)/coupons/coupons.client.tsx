"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CalendarClock, Plus, Receipt, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
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
import { StatsCard } from "@/components/cards/stats-card";
import { deleteCoupon, setCouponActive } from "@/actions/coupons";
import { DataTable } from "../_components/data-table/data-table";
import { COUPONS_DEFAULT_SORT } from "./coupons.params";
import { COUPON_FILTERS, getCouponsColumns } from "./_components/table-columns";
import { CouponFormDialog } from "./_components/coupon-form-dialog";
import type { AdminCoupon, CouponStats } from "./coupons.types";

interface CouponsContentProps {
  coupons: AdminCoupon[];
  totalCount: number;
  stats: CouponStats;
}

export function CouponsContent({ coupons, totalCount, stats }: CouponsContentProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [deleting, setDeleting] = useState<AdminCoupon | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    startRefresh(() => router.refresh());
  }, [router]);

  const withBusy = useCallback(
    async (couponId: string, task: () => Promise<void>) => {
      setBusyIds((prev) => new Set(prev).add(couponId));
      try {
        await task();
      } finally {
        setBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(couponId);
          return next;
        });
      }
    },
    []
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleToggleActive = useCallback(
    (coupon: AdminCoupon) =>
      withBusy(coupon.id, async () => {
        const result = await setCouponActive(coupon.id, !coupon.isActive);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success(coupon.isActive ? "Coupon deactivated" : "Coupon activated");
        refresh();
      }),
    [refresh, withBusy]
  );

  const handleDelete = async () => {
    if (!deleting) return;
    const coupon = deleting;
    setDeleting(null);
    await withBusy(coupon.id, async () => {
      const result = await deleteCoupon(coupon.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Deleted ${coupon.code}`);
      refresh();
    });
  };

  const columns = useMemo(
    () =>
      getCouponsColumns({
        onEdit: (coupon) => {
          setEditing(coupon);
          setFormOpen(true);
        },
        onToggleActive: handleToggleActive,
        onDelete: setDeleting,
        isBusy: (couponId) => busyIds.has(couponId),
      }),
    [busyIds, handleToggleActive]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Platform-wide coupons apply to every product on Tallaby.
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Create coupon
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active"
          value={stats.active.toLocaleString()}
          subtitle="Redeemable right now"
          icon={<TicketPercent className="size-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Scheduled"
          value={stats.scheduled.toLocaleString()}
          subtitle="Start in the future"
          icon={<CalendarClock className="size-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Expired"
          value={stats.expired.toLocaleString()}
          subtitle="Past their end date"
          icon={<AlertCircle className="size-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Redemptions"
          value={stats.redemptions.toLocaleString()}
          subtitle="Total uses"
          icon={<Receipt className="size-4 text-muted-foreground" />}
        />
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        getRowId={(coupon) => coupon.id}
        filterableColumns={COUPON_FILTERS}
        emptyMessage="No coupons yet. Create one to offer a discount on every product."
        isLoading={isRefreshing}
        serverSide={{
          rowCount: totalCount,
          defaultSort: COUPONS_DEFAULT_SORT,
          searchPlaceholder: "Search code or name…",
        }}
      />

      <CouponFormDialog
        coupon={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => {
          setFormOpen(false);
          refresh();
        }}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Customers will no longer be able to use this code. This can&apos;t be
              undone. Coupons already used on orders can only be deactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
