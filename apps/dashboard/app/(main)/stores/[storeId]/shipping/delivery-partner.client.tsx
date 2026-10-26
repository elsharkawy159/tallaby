"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Hand, LoaderCircle, MapPin, Plug, Settings2, Truck, Zap } from "lucide-react";

import type { BostaAutoShip } from "@workspace/lib/integrations";
import type { BostaOverview } from "@workspace/lib/integrations/server";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ChoiceCard, ChoiceGroup } from "@workspace/ui/components/choice-card";
import { SectionCard, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { APP_BRANDS } from "../apps/apps-brand.lib";
import { updateBostaSettings } from "../apps/bosta/bosta.server";

/**
 * Shipping › "Delivery partner" (BS-07): connect Bosta, or choose when its
 * shipments are created. The choice is the Bosta integration's `autoShip`,
 * the same setting as in Apps › Bosta; manual is the default.
 */
export function DeliveryPartnerCard({
  storeId,
  bosta,
  readOnly,
}: {
  storeId: string;
  /** Null when Bosta is not connected (or the wizard was left before a pickup location). */
  bosta: BostaOverview | null;
  readOnly: boolean;
}) {
  const t = useTranslations("storeShipping.partner");
  const tErr = useTranslations("storeApps.errors");
  const router = useRouter();
  const [autoShip, setAutoShip] = useState<BostaAutoShip>(bosta?.settings.autoShip ?? "manual");
  const [isPending, startTransition] = useTransition();
  const appHref = `/stores/${storeId}/apps/bosta`;
  const connected = Boolean(bosta?.summary.credentialsSaved && bosta.settings.pickupLocationId);

  const choose = (value: string) => {
    const next: BostaAutoShip = value === "on_confirm" ? "on_confirm" : "manual";
    const previous = autoShip;
    setAutoShip(next);
    startTransition(async () => {
      const result = await updateBostaSettings(storeId, { autoShip: next });
      if (!result.success) {
        setAutoShip(previous);
        toast.error(tErr(result.error));
        return;
      }
      toast.success(next === "on_confirm" ? t("savedAuto") : t("savedManual"));
      router.refresh();
    });
  };

  const brand = APP_BRANDS.bosta;
  const logo = (
    <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: brand.bg }}>
      <svg viewBox="0 0 24 24" aria-hidden className="size-[52%]" style={{ fill: brand.fg }}>
        <path d={brand.icon.path} />
      </svg>
    </span>
  );

  return (
    <SectionCard id="delivery-partner" icon={Truck} title={t("title")} description={t("description")}>
      {!connected ? (
        <div className="flex flex-col gap-4 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center">
          {logo}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("connectTitle")}</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{t("connectBody")}</p>
          </div>
          <Button asChild className={SMALL_BUTTON_CLASS} disabled={readOnly}>
            <Link href={appHref}>
              <Plug className="size-4" aria-hidden />
              {bosta ? t("finishSetup") : t("connect")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {logo}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{t("bosta")}</p>
                {bosta?.summary.status === "error" ? (
                  <Badge variant="destructive">{t("error")}</Badge>
                ) : (
                  <span className="inline-flex h-5 items-center gap-1 rounded-full bg-success-soft px-2 text-[11px] font-semibold text-success before:size-1.5 before:rounded-full before:bg-current">
                    {t("connected")}
                  </span>
                )}
              </div>
              <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[13px] text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span dir="auto" className="truncate">
                  {bosta?.settings.pickupLocationName}
                </span>
              </p>
            </div>
            <Button asChild variant="outline" className={SMALL_BUTTON_CLASS}>
              <Link href={appHref}>
                <Settings2 className="size-4" aria-hidden />
                {t("manage")}
              </Link>
            </Button>
          </div>

          <fieldset className="flex flex-col gap-2.5" disabled={readOnly || isPending}>
            <legend className="mb-2 flex items-center gap-2 text-sm font-semibold">
              {t("autoShipTitle")}
              {isPending && <LoaderCircle className="size-4 animate-spin text-muted-foreground" aria-hidden />}
            </legend>
            <ChoiceGroup stack className="sm:grid-cols-2" value={autoShip} onValueChange={choose} aria-label={t("autoShipTitle")}>
              <ChoiceCard value="manual" indicator icon={<Hand aria-hidden />} title={t("manualTitle")} description={t("manualBody")} />
              <ChoiceCard value="on_confirm" indicator icon={<Zap aria-hidden />} title={t("autoTitle")} description={t("autoBody")} />
            </ChoiceGroup>
          </fieldset>
          <p className="text-xs text-muted-foreground">{t("feesNote")}</p>
        </div>
      )}
    </SectionCard>
  );
}
