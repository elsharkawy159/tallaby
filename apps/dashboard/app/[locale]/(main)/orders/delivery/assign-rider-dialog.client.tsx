"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Field, Modal, SellerButton, fieldClass } from "@/components/seller-ui";
import { assignRider } from "@/actions/shipping";
import type { SellerRider } from "@/lib/shipping/shipping.types";

interface Props {
  /** Order ids to assign; the dialog is open while this is non-empty. */
  orderIds: string[];
  /** Rider currently on the order (single-order reassignment). */
  currentRiderId?: string | null;
  riders: SellerRider[];
  onClose: () => void;
  onDone?: () => void;
  onAddRider: () => void;
}

export function AssignRiderDialog({
  orderIds,
  currentRiderId,
  riders,
  onClose,
  onDone,
  onAddRider,
}: Props) {
  const t = useTranslations("shipping.assign");
  const [riderId, setRiderId] = useState("");
  const [isPending, startTransition] = useTransition();
  const open = orderIds.length > 0;

  const assignable = riders.filter((r) => r.isActive);

  useEffect(() => {
    if (open) setRiderId(currentRiderId ?? "");
  }, [open, currentRiderId]);

  const submit = () => {
    startTransition(async () => {
      const res = await assignRider({ orderIds, riderId });
      if (!res.success) {
        toast.error(res.error ?? t("failed"));
        return;
      }
      toast.success(res.message ?? t("success"));
      onDone?.();
      onClose();
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && !isPending && onClose()}
      title={t("title", { count: orderIds.length })}
      description={t("description")}
      footer={
        <>
          <SellerButton variant="outline" onClick={onClose} disabled={isPending}>
            {t("cancel")}
          </SellerButton>
          <SellerButton variant="solid" onClick={submit} disabled={isPending || !riderId || assignable.length === 0}>
            {isPending ? t("assigning") : t("assign")}
          </SellerButton>
        </>
      }
    >
      {assignable.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-(--s-field-strong) p-5 text-center text-[13px] text-(--s-muted)">
          {t("noActiveRiders")}
          <SellerButton
            size="sm"
            onClick={() => {
              onClose();
              onAddRider();
            }}
          >
            {t("addFirstRider")}
          </SellerButton>
        </div>
      ) : (
        <Field label={t("rider")} htmlFor="assign-rider">
          <Select value={riderId} onValueChange={setRiderId}>
            <SelectTrigger id="assign-rider" className={fieldClass}>
              <SelectValue placeholder={t("choose")} />
            </SelectTrigger>
            <SelectContent>
              {assignable.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.fullName ?? r.email}
                  <span className="ms-2 text-xs text-(--s-subtle)">
                    {t("activeCount", { count: r.activeDeliveries })}
                    {!r.isAvailable ? ` · ${t("offDuty")}` : ""}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
    </Modal>
  );
}
