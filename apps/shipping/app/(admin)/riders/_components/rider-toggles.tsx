"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("riders");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      aria-label={isActive ? t("deactivateAria") : t("activateAria")}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          const result = await setRiderActive({ riderId, isActive: checked });
          if (result.success) {
            toast.success(result.message ?? tCommon("saved"));
            router.refresh();
          } else {
            toast.error(result.error ?? tCommon("somethingWrong"));
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
  const t = useTranslations("riders");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isAvailable}
      disabled={isPending}
      aria-label={isAvailable ? t("markUnavailableAria") : t("markAvailableAria")}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          const result = await setRiderAvailable({ riderId, isAvailable: checked });
          if (result.success) {
            toast.success(result.message ?? tCommon("saved"));
            router.refresh();
          } else {
            toast.error(result.error ?? tCommon("somethingWrong"));
          }
        });
      }}
    />
  );
}
