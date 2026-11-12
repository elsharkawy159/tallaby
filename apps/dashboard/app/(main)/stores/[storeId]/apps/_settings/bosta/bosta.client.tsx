"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExternalLink, KeyRound, LoaderCircle, MapPin, RefreshCw, TriangleAlert, Truck } from "lucide-react";

import type { BostaOverview } from "@workspace/lib/integrations/server";
import type { BostaPickupLocation } from "@workspace/lib/shipping/bosta";
import { Note, SectionCard, SellerButton, SellerCard, StatusBadge } from "@/components/seller-ui";
import { disconnectStoreApp } from "../../apps.server";
import { DisconnectAppButton } from "../../disconnect-button.client";
import { BostaPreferences } from "./bosta-preferences.client";
import { BOSTA_DASHBOARD_URL, BostaKeyField, BostaWizard } from "./bosta-wizard.client";
import { loadBostaPickupLocations, testBosta, updateBostaSettings } from "./bosta.server";

/** Store › Apps › Bosta (BS-06): the wizard until a key is saved, then the settings. */
export function BostaApp({
  storeId,
  initial,
  readOnly,
}: {
  storeId: string;
  initial: BostaOverview | null;
  readOnly: boolean;
}) {
  const t = useTranslations("storeApps.bosta");
  const [overview, setOverview] = useState(initial);
  // A saved key with no pickup location yet (wizard left half-way) resumes the wizard.
  const [wizard, setWizard] = useState(!initial?.summary.credentialsSaved || !initial.settings.pickupLocationId);

  useEffect(() => setOverview(initial), [initial]);

  return (
    <>

      {readOnly && <Note tone="amber">{t("readOnly")}</Note>}

      {wizard ? (
        <BostaWizard
          storeId={storeId}
          initial={overview}
          readOnly={readOnly}
          onFinished={(next) => {
            setOverview(next);
            setWizard(false);
          }}
        />
      ) : overview ? (
        <BostaSettingsView storeId={storeId} overview={overview} readOnly={readOnly} onChange={setOverview} />
      ) : null}
    </>
  );
}

function BostaSettingsView({
  storeId,
  overview,
  readOnly,
  onChange,
}: {
  storeId: string;
  overview: BostaOverview;
  readOnly: boolean;
  onChange: (overview: BostaOverview) => void;
}) {
  const t = useTranslations("storeApps.bosta");
  const tApps = useTranslations("storeApps");
  const tErr = useTranslations("storeApps.errors");
  const format = useFormatter();
  const router = useRouter();
  const [locations, setLocations] = useState<BostaPickupLocation[] | null | "failed">(null);
  const [replacing, setReplacing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isTesting, startTest] = useTransition();
  const { summary, settings } = overview;
  const failing = summary.status === "error";

  useEffect(() => {
    let cancelled = false;
    loadBostaPickupLocations(storeId).then((result) => {
      if (!cancelled) setLocations(result.success ? result.data : "failed");
    });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const test = () =>
    startTest(async () => {
      const result = await testBosta(storeId);
      router.refresh();
      if (!result.success) {
        toast.error(result.message ? `${tErr(result.error)} ${result.message}` : tErr(result.error));
        return;
      }
      setLocations(result.data);
      toast.success(t("settings.testOk"));
    });

  const save = (values: Parameters<typeof updateBostaSettings>[1]) =>
    startTransition(async () => {
      const result = await updateBostaSettings(storeId, values);
      if (!result.success) {
        toast.error(tErr(result.error));
        return;
      }
      onChange(result.data);
      toast.success(tApps("saved"));
    });

  const remove = () =>
    startTransition(async () => {
      const result = await disconnectStoreApp(storeId, "bosta");
      if (!result.success) {
        toast.error(tErr(result.error));
        return;
      }
      toast.success(tApps("removed"));
      router.push(`/stores/${storeId}/apps/bosta`);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <SellerCard className="p-5 max-[600px]:p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {failing ? <StatusBadge tone="danger">{tApps("error")}</StatusBadge> : <StatusBadge tone="success">{tApps("connected")}</StatusBadge>}
              {summary.connectedAt && (
                <span className="text-xs text-(--s-faint)">
                  {t("settings.since", { date: format.dateTime(new Date(summary.connectedAt), { day: "numeric", month: "short", year: "numeric" }) })}
                </span>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px] text-(--s-text) max-[600px]:grid-cols-1">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 shrink-0 text-(--s-subtle)" aria-hidden />
                <dt className="sr-only">{t("settings.key")}</dt>
                <dd dir="ltr" className="font-montserrat">
                  ••••{settings.keyHint ?? "????"}
                </dd>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <MapPin className="size-4 shrink-0 text-(--s-subtle)" aria-hidden />
                <dt className="sr-only">{t("prefs.pickupTitle")}</dt>
                <dd dir="auto" className="truncate">
                  {settings.pickupLocationName ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
          <div className="flex gap-2 max-[600px]:w-full max-[600px]:[&>*]:flex-1">
            <SellerButton variant="mini" size="xs" disabled={isTesting} onClick={test}>
              {isTesting ? <LoaderCircle className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
              {t("settings.test")}
            </SellerButton>
            <SellerButton
              variant="mini"
              size="xs"
              disabled={readOnly}
              aria-expanded={replacing}
              onClick={() => setReplacing((v) => !v)}
            >
              <KeyRound aria-hidden />
              {t("settings.replaceKey")}
            </SellerButton>
          </div>
        </div>

        {failing && summary.lastError && (
          <Note tone="danger" icon={TriangleAlert} className="mt-4">
            <span dir="auto">
              {t("settings.errorHelp")} <span className="opacity-80">({summary.lastError})</span>
            </span>
          </Note>
        )}

        {replacing && (
          <div className="mt-4 border-t border-(--s-line-soft) pt-4">
            <BostaKeyField
              storeId={storeId}
              saved={null}
              disabled={readOnly}
              onVerified={(result) => {
                onChange(result.overview);
                setLocations(result.pickupLocations);
                setFormKey((k) => k + 1);
                setReplacing(false);
                toast.success(t("settings.keyReplaced"));
              }}
            />
          </div>
        )}
      </SellerCard>

      <SectionCard icon={Truck} title={t("prefs.title")}>
        <BostaPreferences
          key={formKey}
          settings={settings}
          locations={locations}
          pending={isPending}
          disabled={readOnly}
          submitLabel={tApps("save")}
          onSubmit={save}
        />
      </SectionCard>

      <section className="flex flex-wrap items-center gap-3 rounded-[22px] border-[1.5px] border-dashed border-(--s-field-strong) p-[18px]">
        <div className="min-w-0 flex-1 basis-[220px] text-[13px] text-(--s-muted)">
          <b className="block font-bold text-(--s-text)">{t("settings.dangerTitle")}</b>
          {t("settings.dangerBody")}
        </div>
        <SellerButton asChild variant="mini">
          <a href={BOSTA_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
            {t("key.openDashboard")}
            <ExternalLink aria-hidden />
          </a>
        </SellerButton>
        <DisconnectAppButton
          disabled={readOnly}
          pending={isPending}
          description={t("settings.disconnectConfirm")}
          onConfirm={remove}
        />
      </section>
    </div>
  );
}
