"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
import { nextStatuses, type ShippingStatus } from "@/lib/shipping/shipping-status";
import type { ShippingOrderRow } from "@/lib/shipping/shipping.types";

const DESTRUCTIVE: ShippingStatus[] = ["cancelled", "returned", "failed"];

interface Props {
  row: ShippingOrderRow;
  onAssign: (row: ShippingOrderRow) => void;
}

/** Per-row action menu: the moves the shipment status graph allows next. */
export function StatusActions({ row, onAssign }: Props) {
  const t = useTranslations("shipping.actions");
  const [failing, setFailing] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!row.editable) {
    return <span className="text-xs text-muted-foreground">{t("handledByTallaby")}</span>;
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
        toast.error(res.error ?? t("updateFailed"));
        return;
      }
      toast.success(t(`marked.${status}`));
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
            <UserPlus className="me-1.5 h-3.5 w-3.5" />
            {t("assignRider")}
          </Button>
        ) : primary ? (
          <Button size="sm" onClick={() => apply(primary)} disabled={isPending}>
            <Truck className="me-1.5 h-3.5 w-3.5" />
            {t("outForDelivery")}
          </Button>
        ) : null}

        {(moves.length > 0 || canAssign) && row.status !== "pending" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={isPending}>
                {t("update")}
                <ChevronDown className="ms-1 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {moves.map((status) => (
                <DropdownMenuItem
                  key={status}
                  className={DESTRUCTIVE.includes(status) ? "text-destructive focus:text-destructive" : undefined}
                  onSelect={() => (status === "failed" ? setFailing(true) : apply(status))}
                >
                  {t(`move.${status}`)}
                </DropdownMenuItem>
              ))}
              {canAssign && moves.length > 0 && <DropdownMenuSeparator />}
              {canAssign && (
                <DropdownMenuItem onSelect={() => onAssign(row)}>
                  {row.riderId ? t("reassignRider") : t("assignRider")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={failing} onOpenChange={(o) => !o && !isPending && setFailing(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("failedTitle", { number: row.orderNumber })}</DialogTitle>
            <DialogDescription>{t("failedDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`fail-${row.id}`}>{t("reason")}</Label>
            <Textarea
              id={`fail-${row.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFailing(false)} disabled={isPending}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={isPending || !reason.trim()}
              onClick={() => apply("failed", reason.trim())}
            >
              {isPending ? t("saving") : t("markFailed")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
