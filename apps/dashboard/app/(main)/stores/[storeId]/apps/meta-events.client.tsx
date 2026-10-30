"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

import {
  DEFAULT_META_TRACKING,
  META_TRACKED_EVENTS,
  type MetaPurchaseTiming,
  type MetaTrackedEvent,
  type MetaTrackingSettings,
} from "@workspace/lib/integrations";
import type { StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import { Switch } from "@workspace/ui/components/switch";
import { saveMetaEvents } from "./meta-events.server";

/**
 * Meta Pixel › Events (ROADMAP.md F-30): event switches (F-30b) and when
 * Purchase is sent (F-30a). "When delivered" needs the Conversions API: the
 * delivered Purchase is a server event.
 */
export function MetaEventsSettings({
  storeId,
  current,
  capiConnected,
  readOnly,
  onSaved,
}: {
  storeId: string;
  current: StoreIntegrationSummary;
  capiConnected: boolean;
  readOnly: boolean;
  onSaved: (summary: StoreIntegrationSummary) => void;
}) {
  const t = useTranslations("storeApps.metaEvents");
  const tApps = useTranslations("storeApps");
  const router = useRouter();
  const saved: MetaTrackingSettings = current.details.tracking ?? DEFAULT_META_TRACKING;
  const [events, setEvents] = useState<Record<MetaTrackedEvent, boolean>>({ ...saved.events });
  const [purchaseOn, setPurchaseOn] = useState<MetaPurchaseTiming>(saved.purchaseOn);
  const [isPending, startTransition] = useTransition();
  const dirty =
    purchaseOn !== saved.purchaseOn || META_TRACKED_EVENTS.some((name) => events[name] !== saved.events[name]);

  const save = () => {
    startTransition(async () => {
      const result = await saveMetaEvents(storeId, { events, purchaseOn });
      if (!result.success) {
        toast.error(tApps(`errors.${result.error}`));
        return;
      }
      onSaved(result.data);
      toast.success(tApps("saved"));
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3.5">
      <div>
        <p className="text-sm font-bold">{t("title")}</p>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {META_TRACKED_EVENTS.map((name) => (
          <li key={name} className="flex items-start justify-between gap-3">
            <Label htmlFor={`meta-event-${name}`} className="flex min-w-0 flex-col items-start gap-0.5 font-normal">
              <span className="text-[13px] font-semibold">{t(`events.${name}.name`)}</span>
              <span className="text-xs text-muted-foreground">{t(`events.${name}.hint`)}</span>
            </Label>
            <Switch
              id={`meta-event-${name}`}
              checked={events[name]}
              disabled={readOnly || isPending}
              onCheckedChange={(on) => setEvents((list) => ({ ...list, [name]: on }))}
            />
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 border-t pt-3">
        <p className="text-[13px] font-semibold">{t("purchaseOn.label")}</p>
        <RadioGroup
          value={purchaseOn}
          onValueChange={(value) => setPurchaseOn(value === "delivered" ? "delivered" : "order")}
          disabled={readOnly || isPending || !events.Purchase}
          className="gap-2"
        >
          <Label className="flex items-start gap-2.5 font-normal">
            <RadioGroupItem value="order" className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold">{t("purchaseOn.order")}</span>
              <span className="text-xs text-muted-foreground">{t("purchaseOn.orderHint")}</span>
            </span>
          </Label>
          <Label className="flex items-start gap-2.5 font-normal">
            <RadioGroupItem value="delivered" className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold">{t("purchaseOn.delivered")}</span>
              <span className="text-xs text-muted-foreground">{t("purchaseOn.deliveredHint")}</span>
            </span>
          </Label>
        </RadioGroup>
        {purchaseOn === "delivered" && !capiConnected && (
          <p className="rounded-xl bg-accent-soft p-2.5 text-xs text-accent-ink">{t("purchaseOn.needsCapi")}</p>
        )}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="h-9 self-start rounded-[10px] font-semibold"
        disabled={readOnly || isPending || !dirty}
        onClick={save}
      >
        {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
        {t("save")}
      </Button>
    </div>
  );
}
