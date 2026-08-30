"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Switch } from "@workspace/ui/components/switch";

import { setRiderActive, setRiderAvailable } from "../riders.server";

export function RiderActiveToggle({
  riderId,
  isActive,
}: {
  riderId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      aria-label={isActive ? "Deactivate rider" : "Activate rider"}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          const result = await setRiderActive({ riderId, isActive: checked });
          if (result.success) {
            toast.success(result.message ?? "Saved");
            router.refresh();
          } else {
            toast.error(result.error ?? "Something went wrong");
          }
        });
      }}
    />
  );
}

export function RiderAvailableToggle({
  riderId,
  isAvailable,
}: {
  riderId: string;
  isAvailable: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isAvailable}
      disabled={isPending}
      aria-label={isAvailable ? "Mark unavailable" : "Mark available"}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          const result = await setRiderAvailable({ riderId, isAvailable: checked });
          if (result.success) {
            toast.success(result.message ?? "Saved");
            router.refresh();
          } else {
            toast.error(result.error ?? "Something went wrong");
          }
        });
      }}
    />
  );
}
