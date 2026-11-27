"use client";

import { useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, Bike, CircleCheck, LoaderCircle, Truck } from "lucide-react";

import type { ShippingMode } from "@workspace/lib/shipping/mode";
import { IconTile, SectionCard, SellerButton, SellerCard } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { saveShippingMode } from "./shipping.server";
import { StepCard } from "./shipping-ui";

const MODE_ICON = { self: Bike, company: Truck } as const;

/**
 * The two ways to deliver (owner, 2026-11-27): ship it yourself or use a shipping company.
 * Clicking a card saves it and the page refreshes into that flow. Nothing is deleted when
 * switching: zones, riders and carriers stay.
 */
function ModeCards({
  storeId,
  current,
  readOnly,
  onSaved,
}: {
  storeId: string;
  current: ShippingMode | null;
  readOnly: boolean;
  onSaved?: () => void;
}) {
  const t = useTranslations("storeShipping.mode");
  const tErr = useTranslations("storeShipping.errors");
  const router = useRouter();
  const [saving, setSaving] = useState<ShippingMode | null>(null);
  const [isPending, startTransition] = useTransition();

  const choose = (mode: ShippingMode) => {
    if (mode === current) {
      onSaved?.();
      return;
    }
    setSaving(mode);
    startTransition(async () => {
      const result = await saveShippingMode(storeId, mode);
      setSaving(null);
      if (!result.success) {
        toast.error(tErr(result.error));
        return;
      }
      toast.success(t(`saved.${mode}`));
      onSaved?.();
      router.refresh();
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3 max-[720px]:grid-cols-1">
      {(["self", "company"] as const).map((mode) => {
        const selected = current === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={selected}
            disabled={readOnly || isPending}
            onClick={() => choose(mode)}
            className={cn(
              "group flex min-w-0 cursor-pointer flex-col items-start gap-3 rounded-[20px] border-[1.5px] border-(--s-field) bg-(--s-surface) p-5 text-start outline-none transition-[border-color,background-color,box-shadow] duration-150 hover:border-(--s-primary) focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-(--s-focus) disabled:cursor-not-allowed disabled:opacity-60 max-[720px]:p-4",
              selected && "border-(--s-primary) bg-(--s-tint) shadow-[0_0_0_3px_var(--s-focus-soft)]",
            )}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <IconTile icon={MODE_ICON[mode]} tone={mode === "self" ? "primary" : "accent"} size="lg" />
              {saving === mode ? (
                <LoaderCircle className="size-5 animate-spin text-(--s-subtle)" aria-hidden />
              ) : selected ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                  <CircleCheck className="size-4" aria-hidden />
                  {t("current")}
                </span>
              ) : null}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <b className="text-[15.5px] font-bold text-(--s-ink)">{t(`${mode}.title`)}</b>
              <small className="text-pretty text-[13px] leading-[1.6] text-(--s-subtle)">{t(`${mode}.description`)}</small>
            </span>
            <span className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-bold text-(--s-link)">
              {t(selected ? "keep" : "choose")}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The first-visit setup: only a short intro and the two cards. */
export function ShippingModeChooser({ storeId, readOnly }: { storeId: string; readOnly: boolean }) {
  const t = useTranslations("storeShipping.mode");
  return (
    <SectionCard id="shipping-mode" title={t("chooseTitle")} description={t("chooseDescription")} className="sui-rise">
      <ModeCards storeId={storeId} current={null} readOnly={readOnly} />
      <p className="text-pretty text-xs text-(--s-faint)">{t("switchNote")}</p>
    </SectionCard>
  );
}

/** "How you deliver: …" with a Change button that opens the two cards in place. */
export function ShippingModeBar({ storeId, mode, readOnly }: { storeId: string; mode: ShippingMode; readOnly: boolean }) {
  const t = useTranslations("storeShipping.mode");
  const [open, setOpen] = useState(false);

  return (
    <SellerCard id="shipping-mode" className="flex scroll-mt-24 flex-col gap-3.5 px-5 py-3.5 max-[720px]:px-4">
      <div className="flex flex-wrap items-center gap-3">
        <IconTile icon={MODE_ICON[mode]} tone={mode === "self" ? "primary" : "accent"} />
        <p className="min-w-0 flex-1 basis-40 text-[13.5px] text-(--s-muted)">
          {t("currentLabel")} <b className="font-bold text-(--s-ink)">{t(`${mode}.title`)}</b>
        </p>
        <SellerButton variant="mini" size="xs" disabled={readOnly} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? t("close") : t("change")}
        </SellerButton>
      </div>
      {open && (
        <>
          <ModeCards storeId={storeId} current={mode} readOnly={readOnly} onSaved={() => setOpen(false)} />
          <p className="text-pretty text-xs text-(--s-faint)">{t("switchNote")}</p>
        </>
      )}
    </SellerCard>
  );
}

/** Self delivery, step 2: where the seller adds their riders and hands them orders. */
export function RidersCard() {
  const t = useTranslations("storeShipping.mode.riders");
  return (
    <StepCard id="shipping-riders" step={2} title={t("title")} description={t("description")} className="[animation-delay:.1s]">
      <div className="flex flex-wrap gap-2 max-[600px]:flex-col">
        <SellerButton asChild variant="solid" size="sm">
          <Link href="/orders/riders">{t("manage")}</Link>
        </SellerButton>
        <SellerButton asChild variant="outline" size="sm">
          <Link href="/orders/delivery">{t("track")}</Link>
        </SellerButton>
      </div>
    </StepCard>
  );
}
