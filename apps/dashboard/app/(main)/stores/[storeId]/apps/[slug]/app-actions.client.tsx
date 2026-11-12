"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Clock, Download, LoaderCircle, Plug, Settings2, Trash2, Wallet } from "lucide-react";

import type { AppId } from "@workspace/apps";
import { getStoreApp, storeAppPricing } from "@workspace/lib/integrations";
import { SellerButton } from "@/components/seller-ui";
import { AppInstallDialog, useAppPriceLabel } from "../app-install.client";
import { requestApp } from "../apps.server";
import type { AppPrimaryAction } from "../app-center.lib";

/** The app's price line (US cents shown in EGP at the live rate, F-47). */
export function AppPrice({ appId }: { appId: AppId }) {
  const priceLabel = useAppPriceLabel();
  return <>{priceLabel(storeAppPricing(getStoreApp(appId)!))}</>;
}

/**
 * The app page's main action (ROADMAP.md F-93). The server decides what is
 * allowed: install and remove go through the install engine's actions, which
 * re-check the store and charge from the catalog price; request is F-62.
 */
export function AppActions({
  storeId,
  appId,
  name,
  action,
  canRemove,
  readOnly,
  settingsHref,
  connectFirst,
}: {
  storeId: string;
  appId: AppId;
  /** Already translated. */
  name: string;
  action: AppPrimaryAction;
  canRemove: boolean;
  readOnly: boolean;
  settingsHref: string | null;
  /** A connect-type app that isn't connected yet: the settings button reads "Connect". */
  connectFirst: boolean;
}) {
  const t = useTranslations("appCenter.action");
  const tApps = useTranslations("storeApps");
  const router = useRouter();
  const [dialog, setDialog] = useState<"install" | "remove" | null>(null);
  const [pending, startTransition] = useTransition();
  const pricing = storeAppPricing(getStoreApp(appId)!);
  const isImport = appId === "shopify_import";

  const request = () =>
    startTransition(async () => {
      const result = await requestApp(storeId, appId);
      if (!result.success) {
        toast.error(tApps(`errors.${result.error}`));
        return;
      }
      toast.success(tApps("appRequest.sent"));
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-2">
      {action === "settings" && settingsHref && (
        <SellerButton asChild className="w-full">
          <Link href={settingsHref}>
            {connectFirst ? isImport ? <Download aria-hidden /> : <Plug aria-hidden /> : <Settings2 aria-hidden />}
            {connectFirst ? (isImport ? tApps("import") : t("connect")) : t("settings")}
          </Link>
        </SellerButton>
      )}
      {action === "install" && (
        <SellerButton className="w-full" disabled={readOnly || pending} onClick={() => setDialog("install")}>
          <Download aria-hidden />
          {t("install")}
        </SellerButton>
      )}
      {action === "remove" && (
        <SellerButton variant="outline" className="w-full" disabled={readOnly || pending} onClick={() => setDialog("remove")}>
          <Trash2 aria-hidden />
          {t("remove")}
        </SellerButton>
      )}
      {action === "request" && (
        <SellerButton variant="solid" className="w-full" disabled={readOnly || pending} onClick={request}>
          {pending && <LoaderCircle className="animate-spin" aria-hidden />}
          {t("request")}
        </SellerButton>
      )}
      {action === "requested" && (
        <SellerButton variant="outline" className="w-full" disabled>
          <Clock aria-hidden />
          {t("requested")}
        </SellerButton>
      )}
      {action === "none" && (
        <SellerButton variant="outline" className="w-full whitespace-normal" disabled>
          {pricing.model !== "free" ? <Wallet aria-hidden /> : <Clock aria-hidden />}
          {pricing.model !== "free" ? t("paidLocked") : t("comingSoon")}
        </SellerButton>
      )}
      {action === "settings" && canRemove && (
        <SellerButton variant="mini" size="sm" className="w-full text-destructive [&_svg]:text-destructive" disabled={readOnly || pending} onClick={() => setDialog("remove")}>
          <Trash2 aria-hidden />
          {t("remove")}
        </SellerButton>
      )}

      <AppInstallDialog
        storeId={storeId}
        target={dialog ? { key: appId, name, pricing, installed: dialog === "remove" } : null}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
