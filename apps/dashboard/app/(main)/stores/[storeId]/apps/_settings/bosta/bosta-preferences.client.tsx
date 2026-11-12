"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LoaderCircle } from "lucide-react";

import { BOSTA_NOTE_MAX, type BostaSettings } from "@workspace/lib/integrations";
import type { BostaPickupLocation } from "@workspace/lib/shipping/bosta";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Field, Note, OptionCard, OptionCards, Segmented, SellerButton, Tag, TextArea, Toggle } from "@/components/seller-ui";
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
    <div className="flex flex-col gap-5">
      <Field label={t("pickupTitle")} note={t("pickupHint")}>
        {locations === null ? (
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-[68px] rounded-xl" />
            <Skeleton className="h-[68px] rounded-xl" />
          </div>
        ) : !list ? (
          <Note>{settings.pickupLocationName ? t("pickupSaved", { name: settings.pickupLocationName }) : t("pickupFailed")}</Note>
        ) : list.length === 0 ? (
          <Note tone="amber">{t("pickupNone")}</Note>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((location) => (
              <OptionCard
                key={location._id}
                name="bosta-pickup"
                checked={pickupLocationId === location._id}
                onChange={() => setPickupLocationId(location._id)}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    <span dir="auto">{location.locationName}</span>
                    {location.isDefault && <Tag>{t("pickupDefault")}</Tag>}
                  </span>
                }
                description={location.addressLine ? <span dir="auto">{location.addressLine}</span> : undefined}
              />
            ))}
          </div>
        )}
      </Field>

      <Field label={t("autoShipTitle")}>
        <OptionCards>
          <OptionCard
            name="bosta-auto-ship"
            checked={autoShip === "manual"}
            onChange={() => setAutoShip("manual")}
            title={
              <span className="flex flex-wrap items-center gap-2">
                {t("manualTitle")}
                <Tag tone="info">{t("recommended")}</Tag>
              </span>
            }
            description={t("manualBody")}
          />
          <OptionCard
            name="bosta-auto-ship"
            checked={autoShip === "on_confirm"}
            onChange={() => setAutoShip("on_confirm")}
            title={t("autoTitle")}
            description={t("autoBody")}
          />
        </OptionCards>
      </Field>

      <Field label={t("sizeTitle")} note={t("sizeHint")}>
        <Segmented
          label={t("sizeTitle")}
          className="self-start max-[600px]:w-full"
          value={size}
          onChange={(value) => setSize(value)}
          options={(["SMALL", "MEDIUM", "LARGE"] as const).map((value) => ({ value, label: t(`sizes.${value}`) }))}
        />
      </Field>

      <SwitchRow
        id="bosta-open"
        checked={allowToOpenPackage}
        onChange={setAllowToOpenPackage}
        title={t("openTitle")}
        body={t("openBody")}
      />

      <Field label={t("noteTitle")} htmlFor="bosta-note" note={t("noteHint")}>
        <TextArea
          id="bosta-note"
          dir="auto"
          maxLength={BOSTA_NOTE_MAX}
          value={note}
          placeholder={t("notePlaceholder")}
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>

      <SwitchRow id="bosta-cancel" checked={canCancel} onChange={setCanCancel} title={t("cancelTitle")} body={t("cancelBody")} />

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-(--s-line-soft) pt-4">
        {needsLocation && <p className="me-auto text-[13px] font-semibold text-destructive">{t("pickupRequired")}</p>}
        <SellerButton disabled={pending || disabled || needsLocation} onClick={submit}>
          {pending && <LoaderCircle className="animate-spin" aria-hidden />}
          {submitLabel}
        </SellerButton>
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
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-(--s-line) p-3.5">
      <div className="min-w-0">
        <b className="block text-[13.5px] font-bold text-(--s-text)">{title}</b>
        <small className="mt-0.5 block text-xs leading-normal text-(--s-subtle)">{body}</small>
      </div>
      <Toggle id={id} aria-label={title} checked={checked} onCheckedChange={onChange} className="max-[600px]:min-h-10 mt-0.5" />
    </div>
  );
}
