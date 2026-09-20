"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
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
        toast.error(res.error ?? "Could not assign the rider");
        return;
      }
      toast.success(res.message ?? "Rider assigned");
      onDone?.();
      onClose();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Assign rider{orderIds.length > 1 ? ` to ${orderIds.length} orders` : ""}
          </DialogTitle>
          <DialogDescription>
            The rider is notified in the shipping app and can start delivering right away.
          </DialogDescription>
        </DialogHeader>

        {assignable.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            You have no active riders yet.
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onAddRider();
                }}
              >
                Add your first rider
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="assign-rider">Rider</Label>
            <Select value={riderId} onValueChange={setRiderId}>
              <SelectTrigger id="assign-rider" className="w-full">
                <SelectValue placeholder="Choose a rider" />
              </SelectTrigger>
              <SelectContent>
                {assignable.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.fullName ?? r.email}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {r.activeDeliveries} active
                      {!r.isAvailable ? " · off duty" : ""}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={isPending || !riderId || assignable.length === 0}
          >
            {isPending ? "Assigning…" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
