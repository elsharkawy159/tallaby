"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Hand, LoaderCircle, MapPin, Plug, Settings2, Truck, Zap } from "lucide-react";

import {
  isStoreAppLive,
  storeAppHref,
  storeAppsInGroup,
  type BostaAutoShip,
  type StoreApp,
} from "@workspace/lib/integrations";
import type { BostaOverview, WassalhaOverview } from "@workspace/lib/integrations/server";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ChoiceCard, ChoiceGroup } from "@workspace/ui/components/choice-card";
import { SectionCard, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import { AppLogo } from "../apps/app-logo";
import { updateBostaSettings } from "../apps/bosta/bosta.server";

/** Bosta, Wassalha, then the carriers coming soon: the catalog's shipping group. */
const CARRIERS = storeAppsInGroup("shipping");

type CarrierState = "connected" | "error" | "incomplete" | "off" | "soon";

/**
 * Shipping › "Shipping companies" (BS-07, F-12): every carrier from the store
 * apps catalog, with its state and a link to its page. Bosta also gets the
 * "create shipments" choice (its `autoShip`, the same setting as Apps › Bosta).
 */
export function ShippingCompaniesCard({
  storeId,
  bosta,
  wassalha,
  readOnly,
}: {
  storeId: string;
  /** Null when Bosta is not connected (or the wizard was left before a pickup location). */
  bosta: BostaOverview | null;
  wassalha: WassalhaOverview | null;
  readOnly: boolean;
}) {
  const t = useTranslations("storeShipping.partner");
  const tApp = useTranslations("storeApps.providers");

  const stateOf = (app: StoreApp): CarrierState => {
    if (!isStoreAppLive(app)) return "soon";
    if (app.key === "bosta") {
      if (!bosta) return "off";
      if (bosta.summary.status === "error") return "error";
      return bosta.summary.credentialsSaved && bosta.settings.pickupLocationId ? "connected" : "incomplete";
    }
    if (app.key === "wassalha") {
      if (!wassalha) return "off";
      return wassalha.settings ? "connected" : "incomplete";
    }
    return "off";
  };

  return (
    <SectionCard id="shipping-companies" icon={Truck} title={t("title")} description={t("description")}>
      <ul className="-my-1 divide-y">
        {CARRIERS.map((app) => {
          const state = stateOf(app);
          const href = storeAppHref(storeId, app);
          return (
            <li key={app.key} className={cn("py-3.5 first:pt-1 last:pb-1", state === "soon" && "opacity-70")}>
              <div className="flex flex-wrap items-center gap-3">
                <AppLogo app={app.key} connected={state === "connected"} className="size-11 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {tApp(`${app.key}.name`)}
                    <StateTag state={state} />
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {app.key === "bosta" && state === "connected" && bosta?.settings.pickupLocationName ? (
                      <span className="flex min-w-0 items-center gap-1">
                        <MapPin className="size-3.5 shrink-0" aria-hidden />
                        <span dir="auto" className="truncate">
                          {bosta.settings.pickupLocationName}
                        </span>
                      </span>
                    ) : app.key === "wassalha" && state === "connected" ? (
                      t("wassalhaReady")
                    ) : (
                      t(`carrierBody.${app.key}`)
                    )}
                  </p>
                </div>
                {state !== "soon" && href && (
                  <Button asChild variant={state === "connected" ? "outline" : "default"} className={SMALL_BUTTON_CLASS} disabled={readOnly}>
                    <Link href={href}>
                      {state === "connected" || state === "error" ? (
                        <Settings2 className="size-4" aria-hidden />
                      ) : (
                        <Plug className="size-4" aria-hidden />
                      )}
                      {t(state === "connected" || state === "error" ? "manageCarrier" : state === "incomplete" ? "finishSetupCarrier" : "connectCarrier")}
                    </Link>
                  </Button>
                )}
              </div>
              {app.key === "bosta" && state === "connected" && bosta && (
                <BostaAutoShipChoice storeId={storeId} initial={bosta.settings.autoShip} readOnly={readOnly} />
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">{t("feesNote")}</p>
    </SectionCard>
  );
}

function StateTag({ state }: { state: CarrierState }) {
  const t = useTranslations("storeShipping.partner");
  if (state === "soon") {
    return (
      <Badge variant="outline" className="text-[10px] font-normal">
        {t("soon")}
      </Badge>
    );
  }
  if (state === "error") return <Badge variant="destructive">{t("error")}</Badge>;
  if (state !== "connected") return null;
  return (
    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-success-soft px-2 text-[11px] font-semibold text-success before:size-1.5 before:rounded-full before:bg-current">
      {t("connected")}
    </span>
  );
}

function BostaAutoShipChoice({ storeId, initial, readOnly }: { storeId: string; initial: BostaAutoShip; readOnly: boolean }) {
  const t = useTranslations("storeShipping.partner");
  const tErr = useTranslations("storeApps.errors");
  const router = useRouter();
  const [autoShip, setAutoShip] = useState<BostaAutoShip>(initial);
  const [isPending, startTransition] = useTransition();

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

  return (
    <fieldset className="mt-3.5 flex flex-col gap-2.5" disabled={readOnly || isPending}>
      <legend className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {t("autoShipTitle")}
        {isPending && <LoaderCircle className="size-4 animate-spin text-muted-foreground" aria-hidden />}
      </legend>
      <ChoiceGroup stack className="sm:grid-cols-2" value={autoShip} onValueChange={choose} aria-label={t("autoShipTitle")}>
        <ChoiceCard value="manual" indicator icon={<Hand aria-hidden />} title={t("manualTitle")} description={t("manualBody")} />
        <ChoiceCard value="on_confirm" indicator icon={<Zap aria-hidden />} title={t("autoTitle")} description={t("autoBody")} />
      </ChoiceGroup>
    </fieldset>
  );
}
