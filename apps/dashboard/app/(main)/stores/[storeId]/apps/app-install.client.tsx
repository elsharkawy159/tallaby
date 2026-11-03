"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";

import { isPaidAppPricing, type AppPricing } from "@workspace/lib/billing/app-pricing";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { installApp, uninstallApp } from "./apps.server";

/** The price line on an app's card (F-47). */
export function useAppPriceLabel() {
  const t = useTranslations("storeApps.price");
  const format = useFormatter();
  return (pricing: AppPricing): string => {
    if (!isPaidAppPricing(pricing)) return t("free");
    const price = format.number(pricing.usdCents / 100, { style: "currency", currency: "USD" });
    return pricing.model === "usage" ? t(`usage.${pricing.unit}`, { price }) : t(pricing.model, { price });
  };
}

/**
 * Confirms installing or removing an app that goes through the install engine
 * (not one the seller connects with its own panel). The server decides the
 * price and whether it can be charged.
 */
export function AppInstallDialog({
  storeId,
  target,
  onClose,
}: {
  storeId: string;
  /** `name` is already translated. Null closes the dialog. */
  target: { key: string; name: string; pricing: AppPricing; installed: boolean } | null;
  onClose: () => void;
}) {
  const t = useTranslations("storeApps");
  const format = useFormatter();
  const router = useRouter();
  const priceLabel = useAppPriceLabel();
  const [pending, startTransition] = useTransition();
  const paid = target ? isPaidAppPricing(target.pricing) : false;

  const confirm = () => {
    if (!target) return;
    startTransition(async () => {
      if (target.installed) {
        const result = await uninstallApp(storeId, target.key);
        if (!result.success) {
          toast.error(t(`errors.${result.error}`));
          return;
        }
        toast.success(
          result.data.endsAt
            ? t("appInstall.removedAt", { date: format.dateTime(new Date(result.data.endsAt), { day: "numeric", month: "short" }) })
            : t("removed"),
        );
      } else {
        const result = await installApp(storeId, target.key);
        if (!result.success) {
          toast.error(t(`errors.${result.error}`));
          return;
        }
        toast.success(t("appInstall.installed"));
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <ConfirmActionDialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title={
        target
          ? target.installed
            ? t("appInstall.removeTitle", { app: target.name })
            : t("appInstall.installTitle", { app: target.name })
          : ""
      }
      description={
        target
          ? target.installed
            ? t("appInstall.removeBody")
            : paid
              ? t("appInstall.paidBody", { price: priceLabel(target.pricing) })
              : t("appInstall.freeBody")
          : undefined
      }
      confirmLabel={target?.installed ? t("appInstall.remove") : t("appInstall.install")}
      destructive={target?.installed}
      pending={pending}
      onConfirm={confirm}
    />
  );
}
