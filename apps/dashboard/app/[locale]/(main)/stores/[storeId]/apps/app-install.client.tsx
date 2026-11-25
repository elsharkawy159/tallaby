"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { isPaidAppPricing, type AppPricing } from "@workspace/lib/billing/app-pricing";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { useEgpRate } from "@/components/egp-rate.client";
import { formatUsdPrice } from "@/lib/i18n/format";
import { installApp, uninstallApp } from "./apps.server";

/** Where a seller tops up the store wallet: /wallet opens its top-up panel. */
export const WALLET_TOP_UP_HREF = "/wallet?topup=1";

/** The price line on an app's card (F-47). */
export function useAppPriceLabel() {
  const t = useTranslations("storeApps.price");
  const locale = useLocale();
  const egpRate = useEgpRate();
  /** `freeWithPro`: the app is free with Pro and the seller is on Pro (F-110). */
  return (pricing: AppPricing, freeWithPro = false): string => {
    if (freeWithPro) return t("freeWithPro");
    if (!isPaidAppPricing(pricing)) return t("free");
    // In EGP at the live rate (owner, 2026-11-09); the app is still charged in USD.
    const price = formatUsdPrice(pricing.usdCents, locale, egpRate);
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
  target: { key: string; name: string; pricing: AppPricing; installed: boolean; freeWithPro?: boolean } | null;
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
          // The wallet can't pay: the same "Top up wallet" way out as the app page (F-110).
          toast.error(
            t(`errors.${result.error}`),
            result.error === "insufficientBalance"
              ? { action: { label: t("appInstall.topUp"), onClick: () => router.push(WALLET_TOP_UP_HREF) } }
              : undefined,
          );
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
            ? target.pricing.model === "monthly"
              ? t("appInstall.removeBody")
              : t("appInstall.removeBodyNow")
            : target.freeWithPro
              ? t("appInstall.freeWithProBody", { price: priceLabel(target.pricing) })
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
