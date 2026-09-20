"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, Truck, UserPlus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { updateShipmentStatus } from "@/actions/shipping";
import {
  nextStatuses,
  SHIPPING_STATUS_LABEL,
  type ShippingStatus,
} from "@/lib/shipping/shipping-status";
import type { ShippingOrderRow } from "@/lib/shipping/shipping.types";

const ACTION_LABEL: Partial<Record<ShippingStatus, string>> = {
  pending: "Back to ready to ship",
  assigned: "Return to assigned",
  out_for_delivery: "Mark out for delivery",
  delivered: "Mark delivered",
  failed: "Mark failed attempt",
  returned: "Mark returned",
  cancelled: "Cancel shipment",
};

const DESTRUCTIVE: ShippingStatus[] = ["cancelled", "returned", "failed"];

interface Props {
  row: ShippingOrderRow;
  onAssign: (row: ShippingOrderRow) => void;
}

/** Per-row action menu: the moves the shipment status graph allows next. */
export function StatusActions({ row, onAssign }: Props) {
  const [failing, setFailing] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!row.editable) {
    return <span className="text-xs text-muted-foreground">Handled by Tallaby</span>;
  }

  const moves = row.shipmentId
    ? nextStatuses(row.status).filter((s) => s !== "assigned" && s !== "pending")
    : [];
  const canAssign = row.status === "pending" || row.status === "assigned" || row.status === "failed" || row.status === "out_for_delivery";
  const isFinal = row.status === "delivered" || row.status === "returned" || row.status === "cancelled";

  if (isFinal) return <span className="text-xs text-muted-foreground">—</span>;

  const apply = (status: ShippingStatus, failureReason?: string) => {
    startTransition(async () => {
      const res = await updateShipmentStatus({
        orderId: row.id,
        status,
        failureReason,
      });
      if (!res.success) {
        toast.error(res.error ?? "Could not update the shipment");
        return;
      }
      toast.success(`Marked ${SHIPPING_STATUS_LABEL[status].toLowerCase()}`);
      setFailing(false);
      setReason("");
    });
  };

  const primary =
    row.shipmentId && (row.status === "assigned" || row.status === "failed")
      ? ("out_for_delivery" as const)
      : null;

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        {row.status === "pending" ? (
          <Button size="sm" onClick={() => onAssign(row)}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Assign rider
          </Button>
        ) : primary ? (
          <Button size="sm" onClick={() => apply(primary)} disabled={isPending}>
            <Truck className="mr-1.5 h-3.5 w-3.5" />
            Out for delivery
          </Button>
        ) : null}

        {(moves.length > 0 || canAssign) && row.status !== "pending" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={isPending}>
                Update
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {moves.map((status) => (
                <DropdownMenuItem
                  key={status}
                  className={DESTRUCTIVE.includes(status) ? "text-destructive focus:text-destructive" : undefined}
                  onSelect={() => (status === "failed" ? setFailing(true) : apply(status))}
                >
                  {ACTION_LABEL[status] ?? SHIPPING_STATUS_LABEL[status]}
                </DropdownMenuItem>
              ))}
              {canAssign && moves.length > 0 && <DropdownMenuSeparator />}
              {canAssign && (
                <DropdownMenuItem onSelect={() => onAssign(row)}>
                  {row.riderId ? "Reassign rider" : "Assign rider"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={failing} onOpenChange={(o) => !o && !isPending && setFailing(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Failed delivery — #{row.orderNumber}</DialogTitle>
            <DialogDescription>
              The order stays open so you can retry with the same or another rider.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`fail-${row.id}`}>Reason</Label>
            <Textarea
              id={`fail-${row.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer unavailable, wrong address…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFailing(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending || !reason.trim()}
              onClick={() => apply("failed", reason.trim())}
            >
              {isPending ? "Saving…" : "Mark failed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
