"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, Plus, Wand2 } from "lucide-react";

import type { ShippingTemplate } from "@workspace/lib/shipping/store-zones";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { ChoiceCard, ChoiceGroup } from "@workspace/ui/components/choice-card";
import { Label } from "@workspace/ui/components/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { CurrencyInput } from "@/components/form/currency-input";
import { LabelNote, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { applyShippingTemplate } from "./shipping.server";
import type { TemplateOption } from "./shipping.dto";
import { formatEgp } from "./zone-sheet.client";

type Choice = ShippingTemplate | "scratch";

const KEY: Record<Choice, "tallabyRates" | "egyptFlat" | "cairoGiza" | "scratch"> = {
  tallaby_rates: "tallabyRates",
  egypt_flat: "egyptFlat",
  cairo_giza: "cairoGiza",
  scratch: "scratch",
};

/**
 * The shipping templates. Tallaby's rates, one price for all Egypt, and Cairo &
 * Giza are built on the server from the template id; "start from scratch" opens
 * an empty zone sheet. With zones already saved, applying one replaces them
 * after a confirmation.
 */
export function ShippingTemplates({
  storeId,
  templates,
  zoneCount,
  disabled,
  onScratch,
  onApplied,
}: {
  storeId: string;
  templates: TemplateOption[];
  zoneCount: number;
  disabled: boolean;
  onScratch: () => void;
  onApplied: () => void;
}) {
  const t = useTranslations("storeShipping");
  const locale = useLocale();
  const [choice, setChoice] = useState<Choice>("tallaby_rates");
  const [price, setPrice] = useState("");
  const [priceError, setPriceError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const egp = (n: number) => t("egp", { amount: formatEgp(locale, n) });
  const option = (id: ShippingTemplate) => templates.find((x) => x.id === id);

  const description = (id: Choice) => {
    const tpl = id === "scratch" ? undefined : option(id);
    switch (id) {
      case "tallaby_rates":
        return t("templates.tallabyRates.description", {
          count: tpl?.names.length ?? 0,
          min: formatEgp(locale, tpl?.prices?.min ?? 0),
          max: formatEgp(locale, tpl?.prices?.max ?? 0),
        });
      case "cairo_giza":
        return t("templates.cairoGiza.description", { price: egp(tpl?.prices?.min ?? 0) });
      default:
        return t(`templates.${KEY[id]}.description`);
    }
  };

  const flatPrice = Number(price.replace(",", "."));
  const flatValid = price.trim() !== "" && Number.isFinite(flatPrice) && flatPrice >= 0 && flatPrice <= 10_000;

  const apply = (replace: boolean) => {
    if (choice === "scratch") return onScratch();
    const tpl = option(choice);
    if (!tpl) return;
    if (choice === "egypt_flat" && !flatValid) {
      setPriceError(true);
      return;
    }
    if (zoneCount > 0 && !replace) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result = await applyShippingTemplate(storeId, {
        template: choice,
        names: tpl.names,
        ...(choice === "egypt_flat" && { price: flatPrice }),
        replace,
      });
      setConfirming(false);
      if (result.success) {
        toast.success(t("templates.applied"));
        onApplied();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });
  };

  return (
    <div className="space-y-4">
      <ChoiceGroup
        value={choice}
        onValueChange={(v) => setChoice(v as Choice)}
        columns={2}
        stack
        disabled={disabled}
        aria-label={t("templates.title")}
      >
        {(["tallaby_rates", "egypt_flat", "cairo_giza", "scratch"] as const).map((id) => (
          <ChoiceCard key={id} value={id} indicator title={t(`templates.${KEY[id]}.title`)} description={description(id)} />
        ))}
      </ChoiceGroup>

      {choice === "egypt_flat" && (
        <div className="grid gap-1.5">
          <Label htmlFor="template-price">{t("templates.egyptFlat.priceLabel")}</Label>
          <CurrencyInput
            id="template-price"
            invalid={priceError && !flatValid}
            value={price}
            disabled={disabled}
            onChange={(v) => {
              setPrice(v);
              setPriceError(false);
            }}
          />
          {priceError && !flatValid && <p className="text-sm text-destructive">{t("templates.egyptFlat.priceError")}</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <LabelNote>{choice === "scratch" ? t("templates.scratchNote") : t("templates.note")}</LabelNote>
        <Button type="button" size="sm" className={SMALL_BUTTON_CLASS} disabled={disabled || isPending} onClick={() => apply(false)}>
          {isPending ? <LoaderCircle className="animate-spin" /> : choice === "scratch" ? <Plus /> : <Wand2 />}
          {choice === "scratch" ? t("addZone") : t("templates.apply")}
        </Button>
      </div>

      <AlertDialog open={confirming} onOpenChange={(open) => !open && !isPending && setConfirming(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("templates.replaceTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("templates.replaceDescription", { count: zoneCount })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                apply(true);
              }}
            >
              {isPending && <LoaderCircle className="animate-spin" />}
              {t("templates.replace")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** The templates in a sheet, for stores that already have zones. */
export function TemplatesSheet({
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof ShippingTemplates> & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("storeShipping");
  const locale = useLocale();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={locale.startsWith("ar") ? "left" : "right"} className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-5 py-4 sm:px-6">
          <SheetTitle>{t("templates.title")}</SheetTitle>
          <SheetDescription>{t("templates.description")}</SheetDescription>
        </SheetHeader>
        <div className="min-w-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <ShippingTemplates {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
