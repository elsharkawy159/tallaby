"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
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
    <Dialog open={open} onOpenChange={(o) => !o && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title", { count: orderIds.length })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {assignable.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t("noActiveRiders")}
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onAddRider();
                }}
              >
                {t("addFirstRider")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="assign-rider">{t("rider")}</Label>
            <Select value={riderId} onValueChange={setRiderId}>
              <SelectTrigger id="assign-rider" className="w-full">
                <SelectValue placeholder={t("choose")} />
              </SelectTrigger>
              <SelectContent>
                {assignable.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.fullName ?? r.email}
                    <span className="ms-2 text-xs text-muted-foreground">
                      {t("activeCount", { count: r.activeDeliveries })}
                      {!r.isAvailable ? ` · ${t("offDuty")}` : ""}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button
            onClick={submit}
            disabled={isPending || !riderId || assignable.length === 0}
          >
            {isPending ? t("assigning") : t("assign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
