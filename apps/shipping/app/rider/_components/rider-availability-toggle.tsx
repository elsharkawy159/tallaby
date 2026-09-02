"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { cn } from "@workspace/ui/lib/utils";

import { setMyAvailability } from "../rider.server";

interface RiderAvailabilityToggleProps {
  isAvailable: boolean;
}

export function RiderAvailabilityToggle({
  isAvailable,
}: RiderAvailabilityToggleProps) {
  const t = useTranslations("rider");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = (available: boolean) => {
    if (available === isAvailable || isPending) return;

    startTransition(async () => {
      const result = await setMyAvailability(available);
      if (result.success) {
        toast.success(result.message ?? t("saved"));
        router.refresh();
      } else {
        toast.error(result.error ?? t("somethingWrong"));
      }
    });
  };

  return (
    <div
      role="group"
      aria-label={t("availabilityHint")}
      className="inline-flex rounded-full border border-border p-0.5"
    >
      <button
        type="button"
        disabled={isPending}
        aria-pressed={isAvailable}
        onClick={() => handleToggle(true)}
        className={cn(
          "rounded-full px-4.5 py-2.5 text-xs font-medium transition-colors disabled:opacity-50",
          isAvailable
            ? "bg-green-500 text-white"
            : "opacity-80 dark:bg-green-950 dark:text-green-300"
        )}
      >
        {t("online")}
      </button>
      <button
        type="button"
        disabled={isPending}
        aria-pressed={!isAvailable}
        onClick={() => handleToggle(false)}
        className={cn(
          "rounded-full px-4.5 py-2.5 text-xs font-medium transition-colors disabled:opacity-50",
          !isAvailable
            ? "bg-red-500 text-white"
            : "bg-transparent opacity-80 dark:bg-red-950 dark:text-red-300"
        )}
      >
        {t("offline")}
      </button>
    </div>
  );
}
