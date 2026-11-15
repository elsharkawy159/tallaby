"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bike, CircleCheck, LoaderCircle, MapPin, Plug, Settings2 } from "lucide-react";

import {
  isStoreAppLive,
  storeAppSettingsHref,
  storeAppsInGroup,
  type BostaAutoShip,
  type StoreApp,
} from "@workspace/lib/integrations";
import type { BostaOverview, WassalhaOverview } from "@workspace/lib/integrations/server";
import { IconTile, Note, OptionCard, OptionCards, SellerButton, StatusBadge } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { AppLogo } from "../apps/app-logo";
import { updateBostaSettings } from "../apps/_settings/bosta/bosta.server";
import { StepCard } from "./shipping-ui";

/** Bosta, Wassalha, then the carriers coming soon: the catalog's shipping group. */
const CARRIERS = storeAppsInGroup("shipping");

type CarrierState = "connected" | "error" | "incomplete" | "off" | "soon";

const CARD =
  "flex min-w-0 flex-wrap items-center gap-3 rounded-[18px] border-[1.5px] border-(--s-line) bg-(--s-surface) p-3.5 transition-colors duration-150";

/**
 * Shipping › "Who delivers your orders?" (BS-07, F-12): every carrier from the store
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

  const live = CARRIERS.filter((app) => stateOf(app) !== "soon");
  const soon = CARRIERS.filter((app) => stateOf(app) === "soon");
  const bostaApp = CARRIERS.find((app) => app.key === "bosta");

  return (
    <StepCard id="shipping-companies" step={2} done title={t("whoTitle")} description={t("whoDescription")} className="[animation-delay:.1s]">
      <div className="grid grid-cols-2 gap-2.5 max-[720px]:grid-cols-1">
        {live.map((app) => {
          const state = stateOf(app);
          const href = storeAppSettingsHref(storeId, app);
          const managed = state === "connected" || state === "error";
          return (
            <div key={app.key} className={cn(CARD, state === "connected" && "border-success/30 bg-success-soft/40")}>
              <AppLogo app={app.key} connected={state === "connected"} className="size-11 rounded-[14px]" />
              <div className="min-w-0 flex-1 basis-40">
                <b className="flex flex-wrap items-center gap-2 text-sm font-bold text-(--s-ink)">
                  {tApp(`${app.key}.name`)}
                  {state === "connected" && <StatusBadge tone="success">{t("connected")}</StatusBadge>}
                  {state === "error" && <StatusBadge tone="danger">{t("error")}</StatusBadge>}
                </b>
                <small className="block text-xs leading-[1.6] text-(--s-subtle)">
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
                </small>
              </div>
              {href && (
                <SellerButton asChild variant={managed ? "mini" : "amber"} size="xs">
                  <Link href={href}>
                    {managed ? <Settings2 aria-hidden /> : <Plug aria-hidden />}
                    {t(managed ? "manageCarrier" : state === "incomplete" ? "finishSetupCarrier" : "connectCarrier")}
                  </Link>
                </SellerButton>
              )}
            </div>
          );
        })}

        {/* The seller's own delivery is always on: Tallaby doesn't deliver orders. */}
        <div className={cn(CARD, "border-success/30 bg-success-soft/40")}>
          <IconTile icon={Bike} tone="solid" className="size-11 rounded-[14px] [&_svg]:size-5" />
          <div className="min-w-0 flex-1 basis-40">
            <b className="block text-sm font-bold text-(--s-ink)">{t("selfTitle")}</b>
            <small className="block text-xs leading-[1.6] text-(--s-subtle)">
              <Link href="/orders/delivery" className="text-(--s-link) underline-offset-2 hover:underline max-[600px]:inline-flex max-[600px]:min-h-10 max-[600px]:items-center">
                {t("selfBody")}
              </Link>
            </small>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-success">
            <CircleCheck className="size-3.5" aria-hidden />
            {t("selfActive")}
          </span>
        </div>

        {soon.length > 0 && (
          <div className="col-span-full flex flex-wrap items-center gap-2.5 px-0.5 py-1 text-[12.5px] text-(--s-subtle)">
            {t("soon")}
            {soon.map((app) => (
              <span
                key={app.key}
                className="inline-flex h-[34px] items-center gap-2 rounded-full border border-(--s-line) bg-(--s-surface) pe-3 ps-1.5 font-semibold text-(--s-muted)"
              >
                <AppLogo app={app.key} connected={false} className="size-6 rounded-lg" />
                {tApp(`${app.key}.name`)}
              </span>
            ))}
          </div>
        )}
      </div>

      {bosta && bostaApp && stateOf(bostaApp) === "connected" && (
        <BostaAutoShipChoice storeId={storeId} initial={bosta.settings.autoShip} readOnly={readOnly} />
      )}

      <Note>{t("feesNote")}</Note>
    </StepCard>
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
    <fieldset className="flex min-w-0 flex-col gap-2.5" disabled={readOnly || isPending}>
      <legend className="mb-2.5 flex items-center gap-2 text-[13.5px] font-bold text-(--s-text)">
        {t("autoShipTitle")}
        {isPending && <LoaderCircle className="size-4 animate-spin text-(--s-subtle)" aria-hidden />}
      </legend>
      <OptionCards>
        <OptionCard name="bosta-auto-ship" value="manual" checked={autoShip === "manual"} onChange={() => choose("manual")} title={t("manualTitle")} description={t("manualBody")} />
        <OptionCard name="bosta-auto-ship" value="on_confirm" checked={autoShip === "on_confirm"} onChange={() => choose("on_confirm")} title={t("autoTitle")} description={t("autoBody")} />
      </OptionCards>
    </fieldset>
  );
}
