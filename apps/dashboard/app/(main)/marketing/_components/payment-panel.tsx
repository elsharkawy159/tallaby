"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { createAdRequest } from "@/actions/ads";
import { EGYPT_MOBILE_REGEX, VODAFONE_CASH_NUMBER, type AdPackage } from "@/lib/ad-packages";

type Props = {
  pkg: AdPackage;
  productId: string | null;
  onSubmitted: () => void;
};

/** Vodafone's brand red, used only to mark this as the Vodafone Cash step. */
const VODAFONE_RED = "#E60000";

export function PaymentPanel({ pkg, productId, onSubmitted }: Props) {
  const t = useTranslations("advertise.payment");
  const tErrors = useTranslations("advertise.errors");
  const [payerPhone, setPayerPhone] = useState("");
  const [reference, setReference] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [pending, startTransition] = useTransition();

  const phoneValid = EGYPT_MOBILE_REGEX.test(payerPhone.trim());
  const showPhoneError = phoneTouched && !phoneValid;
  const amount = pkg.price.toLocaleString();

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(VODAFONE_CASH_NUMBER);
      toast.success(t("copied"));
    } catch {
      // Clipboard can be blocked (insecure context); the number stays selectable.
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    if (!productId || !phoneValid) return;

    startTransition(async () => {
      const result = await createAdRequest({
        packageKey: pkg.key,
        productId,
        payerPhone: payerPhone.trim(),
        transferReference: reference.trim() || undefined,
      });
      if (result.success) {
        setPayerPhone("");
        setReference("");
        setPhoneTouched(false);
        onSubmitted();
      } else {
        toast.error(tErrors(result.error));
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-s-4 p-5 sm:p-6" style={{ borderInlineStartColor: VODAFONE_RED }}>
        <h3 className="text-lg font-bold">{t("title", { amount })}</h3>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("number")}</p>
            <p
              dir="ltr"
              className="select-all text-2xl font-bold tracking-wider tabular-nums sm:text-3xl"
            >
              {VODAFONE_CASH_NUMBER}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={copyNumber}>
            <Copy className="size-4" aria-hidden />
            {t("copy")}
          </Button>
        </div>

        <ol className="mt-4 space-y-2 text-sm">
          {(["one", "two", "three"] as const).map((step, i) => (
            <li key={step} className="flex gap-3">
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: VODAFONE_RED }}
              >
                {i + 1}
              </span>
              <span className="leading-relaxed">
                {t(`howTo.${step}`, { number: VODAFONE_CASH_NUMBER, amount })}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <form onSubmit={submit} noValidate className="space-y-4 border-t p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="payer-phone">{t("payerPhone")}</Label>
            <Input
              id="payer-phone"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              maxLength={11}
              value={payerPhone}
              onChange={(e) => setPayerPhone(e.target.value.replace(/\D/g, ""))}
              onBlur={() => setPhoneTouched(true)}
              placeholder={t("payerPhonePlaceholder")}
              aria-invalid={showPhoneError}
              aria-describedby={showPhoneError ? "payer-phone-error" : undefined}
              className="text-start tabular-nums"
            />
            {showPhoneError && (
              <p id="payer-phone-error" className="text-xs text-destructive">
                {t("payerPhoneError")}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transfer-reference">{t("reference")}</Label>
            <Input
              id="transfer-reference"
              dir="ltr"
              maxLength={100}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={t("referencePlaceholder")}
              className="text-start"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending || !productId}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending ? t("submitting") : productId ? t("submit") : t("needProduct")}
        </Button>
      </form>
    </div>
  );
}
