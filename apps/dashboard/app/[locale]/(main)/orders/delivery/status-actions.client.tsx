"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ChevronDown, Truck, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Field, Modal, SellerButton, TextArea } from "@/components/seller-ui";
import { updateShipmentStatus } from "@/actions/shipping";
import { nextStatuses, type ShippingStatus } from "@/lib/shipping/shipping-status";
import type { ShippingOrderRow } from "@/lib/shipping/shipping.types";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";

const DESTRUCTIVE: ShippingStatus[] = ["cancelled", "returned", "failed"];
/** Final moves that can't be taken back ask first; "failed" has its own reason dialog. */
type ConfirmedMove = "cancelled" | "returned";
const isConfirmedMove = (status: ShippingStatus): status is ConfirmedMove =>
  status === "cancelled" || status === "returned";

interface Props {
  row: ShippingOrderRow;
  onAssign: (row: ShippingOrderRow) => void;
}

/** Per-row action menu: the moves the shipment status graph allows next. */
export function StatusActions({ row, onAssign }: Props) {
  const t = useTranslations("shipping.actions");
  const [failing, setFailing] = useState(false);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState<ConfirmedMove | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!row.editable) {
    return <span className="text-xs text-(--s-subtle)">{t("handledByTallaby")}</span>;
  }

  const moves = row.shipmentId
    ? nextStatuses(row.status).filter((s) => s !== "assigned" && s !== "pending")
    : [];
  const canAssign = row.status === "pending" || row.status === "assigned" || row.status === "failed" || row.status === "out_for_delivery";
  const isFinal = row.status === "delivered" || row.status === "returned" || row.status === "cancelled";

  if (isFinal) return <span className="text-xs text-(--s-subtle)">—</span>;

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
      setConfirming(null);
      setReason("");
    });
  };

  const primary =
    row.shipmentId && (row.status === "assigned" || row.status === "failed")
      ? ("out_for_delivery" as const)
      : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {row.status === "pending" ? (
          <SellerButton variant="solid" size="xs" onClick={() => onAssign(row)}>
            <UserPlus aria-hidden />
            {t("assignRider")}
          </SellerButton>
        ) : primary ? (
          <SellerButton variant="solid" size="xs" onClick={() => apply(primary)} disabled={isPending}>
            <Truck aria-hidden />
            {t("outForDelivery")}
          </SellerButton>
        ) : null}

        {(moves.length > 0 || canAssign) && row.status !== "pending" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SellerButton variant="mini" size="xs" disabled={isPending}>
                {t("update")}
                <ChevronDown aria-hidden />
              </SellerButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {moves.map((status) => (
                <DropdownMenuItem
                  key={status}
                  className={DESTRUCTIVE.includes(status) ? "text-destructive focus:text-destructive" : undefined}
                  onSelect={() =>
                    status === "failed"
                      ? setFailing(true)
                      : isConfirmedMove(status)
                        ? setConfirming(status)
                        : apply(status)
                  }
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

      <ConfirmActionDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={confirming ? t(`confirm.${confirming}Title`, { number: row.orderNumber }) : ""}
        description={t("confirm.description")}
        confirmLabel={confirming ? t(`move.${confirming}`) : ""}
        cancelLabel={t("confirm.keep")}
        destructive
        pending={isPending}
        onConfirm={() => confirming && apply(confirming)}
      />

      <Modal
        open={failing}
        onOpenChange={(o) => !o && !isPending && setFailing(false)}
        title={t("failedTitle", { number: row.orderNumber })}
        description={t("failedDescription")}
        footer={
          <>
            <SellerButton variant="outline" onClick={() => setFailing(false)} disabled={isPending}>
              {t("cancel")}
            </SellerButton>
            <SellerButton variant="danger" disabled={isPending || !reason.trim()} onClick={() => apply("failed", reason.trim())}>
              {isPending ? t("saving") : t("markFailed")}
            </SellerButton>
          </>
        }
      >
        <Field label={t("reason")} htmlFor={`fail-${row.id}`}>
          <TextArea
            id={`fail-${row.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reasonPlaceholder")}
            rows={3}
          />
        </Field>
      </Modal>
    </>
  );
}
