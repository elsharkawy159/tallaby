"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, Loader2, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";

import { riderUpdateStatus } from "../rider.server";
import type { RiderStatus, ShippingStatus } from "@/lib/shipping-status";

interface DeliveryActionsProps {
  shipmentId: string;
  status: ShippingStatus;
}

export function DeliveryActions({ shipmentId, status }: DeliveryActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");

  const update = (next: RiderStatus, failureReason?: string) => {
    startTransition(async () => {
      const result = await riderUpdateStatus({
        shipmentId,
        status: next,
        failureReason,
      });

      if (result.success) {
        toast.success(result.message ?? "Updated");
        setShowReason(false);
        setReason("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  if (status === "assigned") {
    return (
      <Button
        className="h-12 w-full text-base"
        disabled={isPending}
        onClick={() => update("out_for_delivery")}
      >
        {isPending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Truck className="size-5" />
        )}
        Start Delivery
      </Button>
    );
  }

  if (status === "out_for_delivery") {
    return (
      <div className="space-y-3">
        <Button
          className="h-12 w-full bg-green-600 text-base text-white hover:bg-green-600/90"
          disabled={isPending}
          onClick={() => update("delivered")}
        >
          {isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <CheckCircle2 className="size-5" />
          )}
          Mark Delivered
        </Button>

        {showReason ? (
          <div className="space-y-2">
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="What went wrong? (optional)"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-11 flex-1"
                disabled={isPending}
                onClick={() => setShowReason(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="h-11 flex-1"
                disabled={isPending}
                onClick={() => update("failed", reason || undefined)}
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Confirm Failed
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="h-12 w-full text-base"
            disabled={isPending}
            onClick={() => setShowReason(true)}
          >
            <CircleAlert className="size-5" />
            Mark Failed
          </Button>
        )}
      </div>
    );
  }

  return null;
}
