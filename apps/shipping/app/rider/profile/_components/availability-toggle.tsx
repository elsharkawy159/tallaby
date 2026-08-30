"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent } from "@workspace/ui/components/card";
import { Switch } from "@workspace/ui/components/switch";

import { setMyAvailability } from "../../rider.server";

export function AvailabilityToggle({ isAvailable }: { isAvailable: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="gap-0 py-3">
      <CardContent className="flex items-center justify-between px-4">
        <div>
          <p className="text-sm font-medium">
            {isAvailable ? "On duty" : "Off duty"}
          </p>
          <p className="text-xs text-muted-foreground">
            Turn off when you&apos;re not taking new deliveries.
          </p>
        </div>
        <Switch
          checked={isAvailable}
          disabled={isPending}
          onCheckedChange={(checked) => {
            startTransition(async () => {
              const result = await setMyAvailability(checked);
              if (result.success) {
                toast.success(result.message ?? "Saved");
                router.refresh();
              } else {
                toast.error(result.error ?? "Something went wrong");
              }
            });
          }}
        />
      </CardContent>
    </Card>
  );
}
