"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Card, CardContent } from "@workspace/ui/components/card";
import { Switch } from "@workspace/ui/components/switch";

import { setMyAvailability } from "../../rider.server";

export function AvailabilityToggle({ isAvailable }: { isAvailable: boolean }) {
  const t = useTranslations("rider");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="gap-0 py-3">
      <CardContent className="flex items-center justify-between px-4">
        <div>
          <p className="text-sm font-medium">
            {isAvailable ? t("onDuty") : t("offDuty")}
          </p>
          <p className="text-xs text-muted-foreground">{t("availabilityHint")}</p>
        </div>
        <Switch
          checked={isAvailable}
          disabled={isPending}
          onCheckedChange={(checked) => {
            startTransition(async () => {
              const result = await setMyAvailability(checked);
              if (result.success) {
                toast.success(result.message ?? t("saved"));
                router.refresh();
              } else {
                toast.error(result.error ?? t("somethingWrong"));
              }
            });
          }}
        />
      </CardContent>
    </Card>
  );
}
