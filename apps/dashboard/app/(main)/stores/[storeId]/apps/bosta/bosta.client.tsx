"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronLeft, ExternalLink, KeyRound, LoaderCircle, MapPin, RefreshCw, TriangleAlert } from "lucide-react";

import type { BostaOverview } from "@workspace/lib/integrations/server";
import type { BostaPickupLocation } from "@workspace/lib/shipping/bosta";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { BUTTON_CLASS, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { APP_BRANDS } from "../apps-brand.lib";
import { disconnectStoreApp } from "../apps.server";
import { DisconnectAppButton } from "../disconnect-button.client";
import { BostaPreferences } from "./bosta-preferences.client";
import { BOSTA_DASHBOARD_URL, BostaKeyField, BostaWizard } from "./bosta-wizard.client";
import { loadBostaPickupLocations, testBosta, updateBostaSettings } from "./bosta.server";

/** Store › Apps › Bosta (BS-06): the wizard until a key is saved, then the settings. */
export function BostaApp({
  storeId,
  storeName,
  initial,
  readOnly,
}: {
  storeId: string;
  storeName: string;
  initial: BostaOverview | null;
  readOnly: boolean;
}) {
  const t = useTranslations("storeApps.bosta");
  const [overview, setOverview] = useState(initial);
  // A saved key with no pickup location yet (wizard left half-way) resumes the wizard.
  const [wizard, setWizard] = useState(!initial?.summary.credentialsSaved || !initial.settings.pickupLocationId);

  useEffect(() => setOverview(initial), [initial]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/stores/${storeId}/apps`}
          className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
          {t("back")}
        </Link>
        <div className="flex items-center gap-3.5">
          <BostaLogo />
          <div className="min-w-0">
            <h1 className="text-[22px] leading-tight font-extrabold tracking-tight sm:text-[26px]">
              {wizard ? t("titleConnect") : t("title")}
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{t("subtitle", { store: storeName })}</p>
          </div>
        </div>
      </div>

      {readOnly && <p className="rounded-xl bg-muted p-3.5 text-[13px] text-muted-foreground">{t("readOnly")}</p>}

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
    </div>
  );
}

function BostaLogo() {
  const brand = APP_BRANDS.bosta;
  return (
    <span className="grid size-14 shrink-0 place-items-center rounded-2xl" style={{ background: brand.bg }}>
      <svg viewBox="0 0 24 24" aria-hidden className="size-[52%]" style={{ fill: brand.fg }}>
        <path d={brand.icon.path} />
      </svg>
    </span>
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
      router.push(`/stores/${storeId}/apps`);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {failing ? (
                <Badge variant="destructive">{tApps("error")}</Badge>
              ) : (
                <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-success-soft px-2.5 text-xs font-semibold text-success before:size-1.5 before:rounded-full before:bg-current">
                  {tApps("connected")}
                </span>
              )}
              {summary.connectedAt && (
                <span className="text-xs text-faint">
                  {t("settings.since", { date: format.dateTime(new Date(summary.connectedAt), { day: "numeric", month: "short", year: "numeric" }) })}
                </span>
              )}
            </div>
            <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 shrink-0 text-faint" aria-hidden />
                <dt className="sr-only">{t("settings.key")}</dt>
                <dd dir="ltr" className="font-mono">
                  ••••{settings.keyHint ?? "????"}
                </dd>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <MapPin className="size-4 shrink-0 text-faint" aria-hidden />
                <dt className="sr-only">{t("prefs.pickupTitle")}</dt>
                <dd dir="auto" className="truncate">
                  {settings.pickupLocationName ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="outline" className={cn(SMALL_BUTTON_CLASS, "max-sm:flex-1")} disabled={isTesting} onClick={test}>
              {isTesting ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
              {t("settings.test")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(SMALL_BUTTON_CLASS, "max-sm:flex-1")}
              disabled={readOnly}
              aria-expanded={replacing}
              onClick={() => setReplacing((v) => !v)}
            >
              <KeyRound className="size-4" aria-hidden />
              {t("settings.replaceKey")}
            </Button>
          </div>
        </div>

        {failing && summary.lastError && (
          <p className="mt-4 flex gap-2 rounded-xl bg-destructive/10 p-3 text-[13px] text-destructive">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span dir="auto">
              {t("settings.errorHelp")} <span className="opacity-80">({summary.lastError})</span>
            </span>
          </p>
        )}

        {replacing && (
          <div className="mt-4 border-t pt-4">
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
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-xs sm:p-6">
        <h2 className="mb-5 text-lg font-extrabold">{t("prefs.title")}</h2>
        <BostaPreferences
          key={formKey}
          settings={settings}
          locations={locations}
          pending={isPending}
          disabled={readOnly}
          submitLabel={tApps("save")}
          onSubmit={save}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-dashed p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0 flex-1 text-[13px] text-muted-foreground">
          <b className="block text-foreground">{t("settings.dangerTitle")}</b>
          {t("settings.dangerBody")}
        </div>
        <Button asChild variant="ghost" className={BUTTON_CLASS}>
          <a href={BOSTA_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
            {t("key.openDashboard")}
            <ExternalLink className="size-4" aria-hidden />
          </a>
        </Button>
        <DisconnectAppButton
          className={cn(BUTTON_CLASS, "border-destructive/35 text-destructive hover:text-destructive")}
          disabled={readOnly}
          pending={isPending}
          description={t("settings.disconnectConfirm")}
          onConfirm={remove}
        />
      </section>
    </div>
  );
}
