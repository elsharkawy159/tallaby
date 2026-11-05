"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, LoaderCircle, Save, Sparkles, Trash2 } from "lucide-react";

import type { StoreShippingZone } from "@workspace/lib/stores/server";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Textarea } from "@workspace/ui/components/textarea";
import { CurrencyInput } from "@/components/form/currency-input";
import { BUTTON_CLASS, FIELD_CLASS, LabelNote, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import { PlacePicker, useShippingLib, type ShippingLib } from "../place-picker.client";
import { saveShippingZone } from "../shipping.server";
import { toZoneInput, type StoreShippingErrorKey, type ZoneFormValues } from "../shipping.dto";
import { AI_ZONES_LIMITS, type AiZonesErrorCode, type AiZonesResponse, type ProposedZone } from "./ai-zones.dto";
import { toAsciiDigits } from "@/components/form/form-ui";

/**
 * "Describe your delivery areas" (ROADMAP.md F-45b): the seller writes, AI
 * proposes zones, the seller edits them here, and nothing saves until they
 * confirm. Saving goes through the same action and checks as the zone sheet.
 */

type Proposal = {
  id: number;
  values: ZoneFormValues;
  unmatched: string[];
  daysAssumed: boolean;
  error?: StoreShippingErrorKey;
};

const toProposal = (zone: ProposedZone, id: number): Proposal => ({
  id,
  values: {
    nameAr: zone.nameAr,
    nameEn: zone.nameEn,
    places: zone.places,
    price: zone.price === null ? "" : String(zone.price),
    freeOver: zone.freeOver === null ? "" : String(zone.freeOver),
    deliveryDaysMin: String(zone.daysMin),
    deliveryDaysMax: String(zone.daysMax),
    codEnabled: true,
    enabled: true,
  },
  unmatched: zone.unmatched,
  daysAssumed: zone.daysAssumed,
});

async function requestZones(storeId: string, text: string): Promise<AiZonesResponse> {
  try {
    const response = await fetch("/api/ai/shipping-zones", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ storeId, text }),
    });
    // A non-JSON body comes from the platform (the 60 s cut-off), not the route.
    return (await response.json().catch(() => ({ ok: false, error: response.status === 504 ? "timeout" : "failed" }))) as AiZonesResponse;
  } catch {
    return { ok: false, error: "failed" };
  }
}

export function DescribeZonesSheet({
  storeId,
  existingZones,
  onClose,
  onChanged,
}: {
  storeId: string;
  existingZones: StoreShippingZone[];
  onClose: () => void;
  /** Some zones were saved: refresh the page behind the sheet. */
  onChanged: () => void;
}) {
  const t = useTranslations("storeShipping");
  const locale = useLocale();
  const lib = useShippingLib();
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const zoneName = (name: { nameAr: string; nameEn?: string | null }) => (!locale.startsWith("ar") && name.nameEn) || name.nameAr;

  const run = async () => {
    if (!text.trim() || running) return;
    setRunning(true);
    const response = await requestZones(storeId, text);
    setRunning(false);
    if (!response.ok) {
      toast.error(t(`describe.errors.${response.error satisfies AiZonesErrorCode}`));
      return;
    }
    setProposals(response.zones.map(toProposal));
    setRemainingToday(response.remainingToday);
    setSubmitted(false);
  };

  const list = proposals ?? [];
  const parsedById = new Map(list.map((p) => [p.id, lib?.zoneInputSchema.safeParse(toZoneInput(p.values))]));

  // Place → the enabled zone holding it: saved zones plus the other proposals.
  const takenFor = (self: Proposal) => {
    const map = new Map<string, string>();
    for (const zone of existingZones) {
      if (!zone.enabled) continue;
      for (const place of zone.places) map.set(place, zoneName(zone));
    }
    for (const other of list) {
      if (other.id === self.id) continue;
      for (const place of other.values.places) if (!map.has(place)) map.set(place, zoneName(other.values) || t("describe.zoneNumber", { number: list.indexOf(other) + 1 }));
    }
    return map;
  };

  const room = lib ? lib.MAX_ZONES_PER_STORE - existingZones.length : 0;
  const tooMany = !!lib && list.length > room;
  const hasConflict = list.some((p) => {
    const taken = takenFor(p);
    return p.values.places.some((place) => taken.has(place));
  });
  const allValid = list.every((p) => parsedById.get(p.id)?.success);
  const canSave = !!lib && list.length > 0 && allValid && !hasConflict && !tooMany;

  const update = (id: number, change: Partial<ZoneFormValues>) =>
    setProposals((current) => current?.map((p) => (p.id === id ? { ...p, values: { ...p.values, ...change }, error: undefined } : p)) ?? null);
  const remove = (id: number) => setProposals((current) => current?.filter((p) => p.id !== id) ?? null);

  const save = () => {
    setSubmitted(true);
    if (!canSave) return;
    startSaving(async () => {
      const failed: Proposal[] = [];
      let saved = 0;
      // One by one through the zone sheet's action: every zone gets its tenant, overlap and limit checks.
      for (const proposal of list) {
        const parsed = parsedById.get(proposal.id);
        const result = await saveShippingZone(storeId, null, parsed?.success ? parsed.data : null);
        if (result.success) saved += 1;
        else failed.push({ ...proposal, error: result.error });
      }
      if (saved > 0) onChanged();
      if (failed.length === 0) {
        toast.success(t("describe.savedAll", { count: saved }));
        onClose();
        return;
      }
      setProposals(failed);
      toast.error(t("describe.savedSome", { saved, failed: failed.length }));
    });
  };

  const reviewing = proposals !== null;

  return (
    <Sheet open onOpenChange={(open) => !open && !isSaving && onClose()}>
      <SheetContent side={locale.startsWith("ar") ? "left" : "right"} className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-5 py-4 sm:px-6">
          <SheetTitle>{reviewing ? t("describe.reviewTitle") : t("describe.button")}</SheetTitle>
          <SheetDescription>{reviewing ? t("describe.reviewDescription") : t("describe.description")}</SheetDescription>
        </SheetHeader>

        <div className="min-w-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          {!reviewing ? (
            <div className="grid gap-1.5">
              <Label htmlFor="describe-zones-text">{t("describe.label")}</Label>
              <Textarea
                id="describe-zones-text"
                rows={6}
                dir="auto"
                maxLength={AI_ZONES_LIMITS.maxTextLength}
                placeholder={t("describe.placeholder")}
                value={text}
                disabled={running}
                onChange={(e) => setText(e.target.value.slice(0, AI_ZONES_LIMITS.maxTextLength))}
              />
              <p className={cn("text-end text-xs tabular-nums text-muted-foreground", text.length >= AI_ZONES_LIMITS.maxTextLength && "text-destructive")}>
                {text.length} / {AI_ZONES_LIMITS.maxTextLength}
              </p>
            </div>
          ) : (
            <>
              {list.length === 0 && <p className="text-sm text-muted-foreground">{t("describe.noneLeft")}</p>}
              {tooMany && <Notice>{t("describe.tooMany", { room: Math.max(0, room), max: lib?.MAX_ZONES_PER_STORE ?? 0 })}</Notice>}
              {list.map((proposal, index) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  number={index + 1}
                  lib={lib}
                  takenBy={takenFor(proposal)}
                  issues={(() => {
                    const parsed = parsedById.get(proposal.id);
                    return new Set(parsed && !parsed.success ? parsed.error.issues.map((i) => String(i.path[0] ?? "")) : []);
                  })()}
                  submitted={submitted}
                  disabled={isSaving}
                  onChange={(change) => update(proposal.id, change)}
                  onRemove={() => remove(proposal.id)}
                />
              ))}
              {list.length > 0 && <LabelNote>{t("describe.saveNote")}</LabelNote>}
              {remainingToday !== null && <LabelNote>{t("describe.remainingToday", { count: remainingToday })}</LabelNote>}
            </>
          )}
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t px-5 py-4 sm:px-6">
          {!reviewing ? (
            <>
              <Button type="button" variant="outline" className={BUTTON_CLASS} onClick={onClose} disabled={running}>
                {t("cancel")}
              </Button>
              <Button type="button" className={BUTTON_CLASS} disabled={running || !text.trim()} onClick={run}>
                {running ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                {running ? t("describe.generating") : t("describe.generate")}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" className={BUTTON_CLASS} disabled={isSaving} onClick={() => setProposals(null)}>
                <ArrowRight className="ltr:rotate-180" />
                {t("describe.back")}
              </Button>
              <Button type="button" className={BUTTON_CLASS} disabled={isSaving || !lib || list.length === 0} onClick={save}>
                {isSaving || !lib ? <LoaderCircle className="animate-spin" /> : <Save />}
                {t("describe.save", { count: list.length })}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-[14px] bg-accent-soft px-3 py-2.5 text-[12.5px] leading-[1.7] text-accent-ink">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

function ProposalCard({
  proposal,
  number,
  lib,
  takenBy,
  issues,
  submitted,
  disabled,
  onChange,
  onRemove,
}: {
  proposal: Proposal;
  number: number;
  lib: ShippingLib | null;
  takenBy: Map<string, string>;
  issues: Set<string>;
  submitted: boolean;
  disabled: boolean;
  onChange: (change: Partial<ZoneFormValues>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("storeShipping");
  const locale = useLocale();
  const { values, unmatched, daysAssumed, error, id } = proposal;
  const invalid = (key: string) => submitted && issues.has(key);
  const conflicts = values.places.filter((place) => takenBy.has(place));
  const field = (name: string) => `describe-${id}-${name}`;

  return (
    <fieldset disabled={disabled} aria-label={t("describe.zoneNumber", { number })} className="min-w-0 space-y-4 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{t("describe.zoneNumber", { number })}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(SMALL_BUTTON_CLASS, "text-destructive")}
          onClick={onRemove}
          aria-label={t("describe.remove", { number })}
        >
          <Trash2 />
        </Button>
      </div>

      {unmatched.length > 0 && <Notice>{t("describe.unmatched", { names: unmatched.join(locale.startsWith("ar") ? "، " : ", ") })}</Notice>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={field("nameAr")}>{t("fields.nameAr")}</Label>
          <Input
            id={field("nameAr")}
            dir="rtl"
            maxLength={60}
            className={cn(FIELD_CLASS, invalid("nameAr") && "border-destructive")}
            aria-invalid={invalid("nameAr") || undefined}
            value={values.nameAr}
            onChange={(e) => onChange({ nameAr: e.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={field("nameEn")}>{t("fields.nameEn")}</Label>
          <Input
            id={field("nameEn")}
            dir="ltr"
            maxLength={60}
            className={FIELD_CLASS}
            value={values.nameEn}
            onChange={(e) => onChange({ nameEn: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={field("places")}>{t("fields.places")}</Label>
        <PlacePicker
          id={field("places")}
          lib={lib}
          value={values.places}
          onChange={(places) => onChange({ places })}
          takenBy={takenBy}
          blockTaken
          invalid={invalid("places")}
        />
        {invalid("places") && <p className="text-sm text-destructive">{t("fieldErrors.places")}</p>}
        {conflicts.map((place) => (
          <p key={place} className="text-sm text-destructive">
            {t("describe.conflict", { place: lib ? lib.placeLabel(place, locale) : place, zone: takenBy.get(place) ?? "" })}
          </p>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={field("price")}>{t("fields.price")}</Label>
          <CurrencyInput id={field("price")} invalid={invalid("price")} value={values.price} onChange={(price) => onChange({ price })} />
          {values.price.trim() === "" && <LabelNote>{t("describe.priceMissing")}</LabelNote>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={field("freeOver")}>{t("fields.freeOver")}</Label>
          <CurrencyInput
            id={field("freeOver")}
            invalid={invalid("freeOver")}
            placeholder={t("freeOverPlaceholder")}
            value={values.freeOver}
            onChange={(freeOver) => onChange({ freeOver })}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <span className="text-sm font-medium">{t("fields.deliveryTime")}</span>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Input
            inputMode="numeric"
            min={0}
            max={60}
            step={1}
            dir="ltr"
            aria-label={t("fields.deliveryDaysMin")}
            aria-invalid={invalid("deliveryDaysMin") || undefined}
            className={cn(FIELD_CLASS, "w-20 text-center", invalid("deliveryDaysMin") && "border-destructive")}
            value={values.deliveryDaysMin}
            onChange={(e) => onChange({ deliveryDaysMin: toAsciiDigits(e.target.value).replace(/\D/g, "") })}
          />
          <span>{t("fields.to")}</span>
          <Input
            inputMode="numeric"
            min={0}
            max={60}
            step={1}
            dir="ltr"
            aria-label={t("fields.deliveryDaysMax")}
            aria-invalid={invalid("deliveryDaysMax") || undefined}
            className={cn(FIELD_CLASS, "w-20 text-center", invalid("deliveryDaysMax") && "border-destructive")}
            value={values.deliveryDaysMax}
            onChange={(e) => onChange({ deliveryDaysMax: toAsciiDigits(e.target.value).replace(/\D/g, "") })}
          />
          <span>{t("fields.days")}</span>
        </div>
        {daysAssumed && <LabelNote>{t("describe.daysAssumed")}</LabelNote>}
        {(invalid("deliveryDaysMin") || invalid("deliveryDaysMax")) && <p className="text-sm text-destructive">{t("fieldErrors.days")}</p>}
      </div>

      {error && <p className="text-sm text-destructive">{t(`errors.${error}`)}</p>}
    </fieldset>
  );
}
