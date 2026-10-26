"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Hand, LoaderCircle, MapPin, Zap } from "lucide-react";

import { BOSTA_NOTE_MAX, type BostaSettings } from "@workspace/lib/integrations";
import type { BostaPickupLocation } from "@workspace/lib/shipping/bosta";
import { Button } from "@workspace/ui/components/button";
import { ChoiceCard, ChoiceGroup } from "@workspace/ui/components/choice-card";
import { Label } from "@workspace/ui/components/label";
import { SegmentedControl, SegmentedControlItem } from "@workspace/ui/components/segmented-control";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { BUTTON_CLASS, TEXTAREA_CLASS } from "@/components/form/form-ui";
import type { BostaSettingsForm } from "./bosta.server";

/**
 * Bosta shipping preferences (wizard step 4 and the settings view). Every
 * field has a default, so "Finish" works without touching anything.
 * `locations` is null while loading and "failed" when Bosta could not list
 * them; the saved location is then kept as is.
 */
export function BostaPreferences({
  settings,
  locations,
  pending,
  disabled,
  submitLabel,
  onSubmit,
}: {
  settings: BostaSettings;
  locations: BostaPickupLocation[] | null | "failed";
  pending: boolean;
  disabled?: boolean;
  submitLabel: string;
  onSubmit: (values: BostaSettingsForm) => void;
}) {
  const t = useTranslations("storeApps.bosta.prefs");
  const [pickupLocationId, setPickupLocationId] = useState(settings.pickupLocationId ?? "");
  const [autoShip, setAutoShip] = useState(settings.autoShip);
  const [size, setSize] = useState(settings.size);
  const [allowToOpenPackage, setAllowToOpenPackage] = useState(settings.allowToOpenPackage);
  const [note, setNote] = useState(settings.note);
  const [canCancel, setCanCancel] = useState(settings.canCancel);

  const list = Array.isArray(locations) ? locations : null;
  const needsLocation = Boolean(list) && !pickupLocationId;

  const submit = () =>
    onSubmit({
      // Sent only when Bosta listed the locations, so a failed list never clears the saved one.
      ...(list && pickupLocationId ? { pickupLocationId } : {}),
      autoShip,
      size,
      allowToOpenPackage,
      note,
      canCancel,
    });

  return (
    <div className="flex flex-col gap-7">
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 text-[15px] font-bold">{t("pickupTitle")}</legend>
        <p className="text-[13px] text-muted-foreground">{t("pickupHint")}</p>
        {locations === null ? (
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-[68px] rounded-xl" />
            <Skeleton className="h-[68px] rounded-xl" />
          </div>
        ) : !list ? (
          <p className="rounded-xl border border-dashed p-3.5 text-[13px] text-muted-foreground">
            {settings.pickupLocationName ? t("pickupSaved", { name: settings.pickupLocationName }) : t("pickupFailed")}
          </p>
        ) : list.length === 0 ? (
          <p className="rounded-xl bg-accent-soft p-3.5 text-[13px] text-accent-ink">{t("pickupNone")}</p>
        ) : (
          <ChoiceGroup stack value={pickupLocationId} onValueChange={setPickupLocationId} aria-label={t("pickupTitle")}>
            {list.map((location) => (
              <ChoiceCard
                key={location._id}
                value={location._id}
                indicator
                icon={<MapPin aria-hidden />}
                badge={
                  location.isDefault ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {t("pickupDefault")}
                    </span>
                  ) : undefined
                }
                title={<span dir="auto">{location.locationName}</span>}
                description={location.addressLine ? <span dir="auto">{location.addressLine}</span> : undefined}
              />
            ))}
          </ChoiceGroup>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 text-[15px] font-bold">{t("autoShipTitle")}</legend>
        <ChoiceGroup
          stack
          columns={2}
          className="sm:grid-cols-2"
          value={autoShip}
          onValueChange={(value) => setAutoShip(value === "on_confirm" ? "on_confirm" : "manual")}
          aria-label={t("autoShipTitle")}
        >
          <ChoiceCard
            value="manual"
            indicator
            icon={<Hand aria-hidden />}
            badge={
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-ink">
                {t("recommended")}
              </span>
            }
            title={t("manualTitle")}
            description={t("manualBody")}
          />
          <ChoiceCard value="on_confirm" indicator icon={<Zap aria-hidden />} title={t("autoTitle")} description={t("autoBody")} />
        </ChoiceGroup>
      </fieldset>

      <div className="flex flex-col gap-2.5">
        <Label className="text-[15px] font-bold">{t("sizeTitle")}</Label>
        <SegmentedControl value={size} onValueChange={(value) => setSize(value as typeof size)} aria-label={t("sizeTitle")}>
          <SegmentedControlItem value="SMALL">{t("sizes.SMALL")}</SegmentedControlItem>
          <SegmentedControlItem value="MEDIUM">{t("sizes.MEDIUM")}</SegmentedControlItem>
          <SegmentedControlItem value="LARGE">{t("sizes.LARGE")}</SegmentedControlItem>
        </SegmentedControl>
        <p className="text-xs text-muted-foreground">{t("sizeHint")}</p>
      </div>

      <SwitchRow
        id="bosta-open"
        checked={allowToOpenPackage}
        onChange={setAllowToOpenPackage}
        title={t("openTitle")}
        body={t("openBody")}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bosta-note" className="text-[15px] font-bold">
          {t("noteTitle")}
        </Label>
        <Textarea
          id="bosta-note"
          dir="auto"
          className={TEXTAREA_CLASS}
          maxLength={BOSTA_NOTE_MAX}
          value={note}
          placeholder={t("notePlaceholder")}
          onChange={(event) => setNote(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t("noteHint")}</p>
      </div>

      <SwitchRow id="bosta-cancel" checked={canCancel} onChange={setCanCancel} title={t("cancelTitle")} body={t("cancelBody")} />

      <div className="flex flex-col items-stretch gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
        {needsLocation && <p className="text-[13px] text-destructive sm:me-auto">{t("pickupRequired")}</p>}
        <Button type="button" className={BUTTON_CLASS} disabled={pending || disabled || needsLocation} onClick={submit}>
          {pending && <LoaderCircle className="animate-spin" aria-hidden />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function SwitchRow({
  id,
  checked,
  onChange,
  title,
  body,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border p-3.5">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-[14.5px] font-semibold">
          {title}
        </Label>
        <p className="mt-1 text-[12.5px] leading-normal text-muted-foreground">{body}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-0.5" />
    </div>
  );
}
