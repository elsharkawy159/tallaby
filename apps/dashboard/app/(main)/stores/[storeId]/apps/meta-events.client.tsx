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
import { Note, OptionCard, SellerButton, Toggle } from "@/components/seller-ui";
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
    <div className="flex flex-col gap-3 rounded-2xl border border-(--s-line) p-3.5">
      <div>
        <p className="text-sm font-bold text-(--s-text)">{t("title")}</p>
        <p className="text-xs text-(--s-subtle)">{t("hint")}</p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {META_TRACKED_EVENTS.map((name) => (
          <li key={name} className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 flex-col items-start gap-0.5">
              <b className="text-[13px] font-bold text-(--s-text)">{t(`events.${name}.name`)}</b>
              <small className="text-xs text-(--s-subtle)">{t(`events.${name}.hint`)}</small>
            </span>
            <Toggle
className="max-[600px]:min-h-10"
              id={`meta-event-${name}`}
              aria-label={t(`events.${name}.name`)}
              checked={events[name]}
              disabled={readOnly || isPending}
              onCheckedChange={(on) => setEvents((list) => ({ ...list, [name]: on }))}
            />
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 border-t border-(--s-line-soft) pt-3">
        <p className="text-[13px] font-bold text-(--s-text)">{t("purchaseOn.label")}</p>
        <OptionCard
          name="meta-purchase-on"
          title={t("purchaseOn.order")}
          description={t("purchaseOn.orderHint")}
          checked={purchaseOn === "order"}
          disabled={readOnly || isPending || !events.Purchase}
          onChange={() => setPurchaseOn("order")}
        />
        <OptionCard
          name="meta-purchase-on"
          title={t("purchaseOn.delivered")}
          description={t("purchaseOn.deliveredHint")}
          checked={purchaseOn === "delivered"}
          disabled={readOnly || isPending || !events.Purchase}
          onChange={() => setPurchaseOn("delivered")}
        />
        {purchaseOn === "delivered" && !capiConnected && (
          <Note tone="amber">{t("purchaseOn.needsCapi")}</Note>
        )}
      </div>

      <SellerButton
        variant="solid"
        size="sm"
        className="self-start"
        disabled={readOnly || isPending || !dirty}
        onClick={save}
      >
        {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
        {t("save")}
      </SellerButton>
    </div>
  );
}
