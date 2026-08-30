"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";

import type { ActionResult } from "@/lib/action-result";
import {
  assignProvider,
  assignRider,
  updateShipmentStatus,
} from "../../orders.server";
import {
  getStatusLabel,
  isTerminal,
  nextStatuses,
  type ShippingStatus,
} from "@/lib/shipping-status";
import type { ProviderOption, RiderOption } from "../../orders.types";

/** Radix Select cannot hold an empty string value. */
const NONE = "none";

interface ShippingActionsProps {
  orderId: string;
  status: ShippingStatus;
  providerId: string | null;
  riderId: string | null;
  providers: ProviderOption[];
  riders: RiderOption[];
}

export function ShippingActions({
  orderId,
  status,
  providerId,
  riderId,
  providers,
  riders,
}: ShippingActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nextStatus, setNextStatus] = useState<string>(NONE);
  const [failureReason, setFailureReason] = useState("");

  const closed = isTerminal(status);
  const available = nextStatuses(status);

  const run = (action: () => Promise<ActionResult>) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(result.message ?? "Saved");
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="provider">Shipping provider</Label>
        <Select
          disabled={isPending || closed}
          value={providerId ?? NONE}
          onValueChange={(value) =>
            run(() =>
              assignProvider({
                orderId,
                providerId: value === NONE ? null : value,
              })
            )
          }
        >
          <SelectTrigger id="provider" className="w-full">
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No provider</SelectItem>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rider">Rider</Label>
        <Select
          disabled={isPending || closed}
          value={riderId ?? NONE}
          onValueChange={(value) =>
            run(() =>
              assignRider({ orderId, riderId: value === NONE ? null : value })
            )
          }
        >
          <SelectTrigger id="rider" className="w-full">
            <SelectValue placeholder="Select a rider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Unassigned</SelectItem>
            {riders
              .filter((rider) => !rider.isSuspended)
              .map((rider) => (
                <SelectItem key={rider.id} value={rider.id}>
                  {rider.fullName ?? rider.email ?? "Unnamed rider"}
                  {rider.isAvailable === false && " (off duty)"}
                  {rider.activeDeliveries > 0 &&
                    ` · ${rider.activeDeliveries} active`}
                  {rider.codHeld > 0 && ` · EGP ${rider.codHeld.toFixed(0)} COD held`}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {riders.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No rider accounts exist yet.
          </p>
        )}
        {riderId &&
          (() => {
            const selected = riders.find((rider) => rider.id === riderId);
            if (!selected) return null;
            return (
              <p className="text-xs text-muted-foreground">
                {selected.phone ?? "No phone on file"} · {selected.todayDeliveries}{" "}
                today · {selected.activeDeliveries} active
                {selected.codHeld > 0 &&
                  ` · EGP ${selected.codHeld.toFixed(0)} COD currently held`}
              </p>
            );
          })()}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Shipping status</Label>
        {closed ? (
          <p className="text-sm text-muted-foreground">
            This delivery is {getStatusLabel(status).toLowerCase()} and can no
            longer be changed.
          </p>
        ) : (
          <>
            <Select
              disabled={isPending}
              value={nextStatus}
              onValueChange={setNextStatus}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Move to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE} disabled>
                  Move to...
                </SelectItem>
                {available.map((value) => (
                  <SelectItem key={value} value={value}>
                    {getStatusLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {nextStatus === "failed" && (
              <Textarea
                value={failureReason}
                onChange={(event) => setFailureReason(event.target.value)}
                placeholder="What went wrong? (optional)"
                rows={2}
              />
            )}

            <Button
              className="w-full"
              disabled={isPending || nextStatus === NONE}
              onClick={() =>
                run(async () => {
                  const result = await updateShipmentStatus({
                    orderId,
                    status: nextStatus,
                    failureReason: failureReason || undefined,
                  });
                  if (result.success) {
                    setNextStatus(NONE);
                    setFailureReason("");
                  }
                  return result;
                })
              }
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Update status
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
