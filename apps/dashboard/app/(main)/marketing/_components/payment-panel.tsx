"use client";

import { useState, useTransition } from "react";
import { Copy, Smartphone, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { createAdRequest, type AdPaymentMethod, type AdWallet } from "@/actions/ads";
import { cn } from "@/lib/utils";
import { EGYPT_MOBILE_REGEX, VODAFONE_CASH_NUMBER, type AdPackage } from "@/lib/ad-packages";

/** Vodafone's brand red, used only to mark this as the Vodafone Cash step. */
const VODAFONE_RED = "#E60000";

/**
 * Payment form state, lifted so the step footer, the order summary and the
 * mobile bar can all submit the same form.
 */
/** Whether the store wallet can pay this price (D21: no overdraft past the limit). */
export function walletCanPay(wallet: AdWallet | null, price: number) {
  return !!wallet && wallet.active && wallet.balance - price >= -wallet.negativeLimit;
}

export function usePaymentForm({
  pkg,
  productId,
  wallet,
  onSubmitted,
}: {
  pkg: AdPackage | null;
  productId: string | null;
  wallet: AdWallet | null;
  onSubmitted: (method: AdPaymentMethod) => void;
}) {
  const tErrors = useTranslations("advertise.errors");
  const [payerPhone, setPayerPhone] = useState("");
  const [reference, setReference] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [method, setMethod] = useState<AdPaymentMethod>("vodafone_cash");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [pending, startTransition] = useTransition();

  const phoneValid = EGYPT_MOBILE_REGEX.test(payerPhone.trim());
  const methodReady = method === "wallet" ? walletCanPay(wallet, pkg?.price ?? 0) : phoneValid;
  const ready = !!pkg && !!productId && methodReady && agreed && !pending;

  const reset = () => {
    setPayerPhone("");
    setReference("");
    setAgreed(false);
    setPhoneTouched(false);
  };

  const submit = () => {
    setPhoneTouched(true);
    if (!pkg || !productId || !methodReady || !agreed) return;

    startTransition(async () => {
      const result = await createAdRequest(
        method === "wallet"
          ? { paymentMethod: "wallet", packageKey: pkg.key, productId }
          : {
              paymentMethod: "vodafone_cash",
              packageKey: pkg.key,
              productId,
              payerPhone: payerPhone.trim(),
              transferReference: reference.trim() || undefined,
            }
      );
      if (result.success) {
        reset();
        onSubmitted(method);
      } else {
        toast.error(tErrors(result.error));
      }
    });
  };

  return {
    method,
    setMethod,
    wallet,
    payerPhone,
    setPayerPhone,
    reference,
    setReference,
    agreed,
    setAgreed,
    phoneTouched,
    setPhoneTouched,
    phoneValid,
    pending,
    ready,
    submit,
  };
}

export type PaymentForm = ReturnType<typeof usePaymentForm>;

export function PaymentPanel({ pkg, form }: { pkg: AdPackage; form: PaymentForm }) {
  const t = useTranslations("advertise.payment");
  const tPackage = useTranslations("advertise.package");
  const amount = pkg.price.toLocaleString();
  const tWallet = useTranslations("advertise.wallet");
  const showPhoneError = form.phoneTouched && !form.phoneValid;
  const wallet = form.wallet;
  const canPay = walletCanPay(wallet, pkg.price);
  const after = (wallet?.balance ?? 0) - pkg.price;

  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      // Clipboard can be blocked (insecure context); the value stays selectable.
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.submit();
      }}
      noValidate
      className="grid gap-4 xl:grid-cols-2"
    >
      <div role="radiogroup" aria-label={tWallet("methodLabel")} className="grid gap-2 sm:grid-cols-2 xl:col-span-2">
        {(["vodafone_cash", "wallet"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={form.method === key}
            onClick={() => form.setMethod(key)}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border p-3 text-start text-sm font-semibold",
              form.method === key ? "border-primary ring-2 ring-primary/20" : "text-muted-foreground"
            )}
          >
            {key === "wallet" ? <Wallet className="size-4" aria-hidden /> : <Smartphone className="size-4" aria-hidden />}
            <span className="flex-1">{key === "wallet" ? tWallet("method") : t("brand")}</span>
            {key === "wallet" && wallet && (
              <span dir="ltr" className="text-xs font-normal tabular-nums">
                {wallet.balance.toLocaleString()} {tPackage("currency")}
              </span>
            )}
          </button>
        ))}
      </div>

      {form.method === "wallet" ? (
        <div className="flex flex-col gap-2 rounded-2xl border bg-muted/30 p-4 text-sm">
          <p className="flex justify-between gap-2">
            <span className="text-muted-foreground">{tWallet("balance")}</span>
            <span dir="ltr" className="font-semibold tabular-nums">
              {(wallet?.balance ?? 0).toLocaleString()} {tPackage("currency")}
            </span>
          </p>
          <p className="flex justify-between gap-2">
            <span className="text-muted-foreground">{tWallet("after")}</span>
            <span dir="ltr" className={cn("font-semibold tabular-nums", after < 0 && "text-destructive")}>
              {after.toLocaleString()} {tPackage("currency")}
            </span>
          </p>
          <p className={cn("text-xs", canPay ? "text-muted-foreground" : "text-destructive")}>
            {canPay ? tWallet("note") : wallet && !wallet.active ? tWallet("notActive") : tWallet("insufficient")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 rounded-2xl border bg-muted/30 p-4">
          <div className="flex items-center gap-2.5 font-bold">
            <span
              className="flex size-8 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: VODAFONE_RED }}
            >
              <Smartphone className="size-4" aria-hidden />
            </span>
            {t("brand")}
          </div>

          <CopyField
            label={t("number")}
            value={VODAFONE_CASH_NUMBER}
            copyLabel={t("copy")}
            onCopy={() => copy(VODAFONE_CASH_NUMBER, t("copied"))}
          />
          <CopyField
            label={t("amount")}
            value={amount}
            suffix={tPackage("currency")}
            copyLabel={t("copy")}
            onCopy={() => copy(String(pkg.price), t("amountCopied"))}
          />

          <ol className="list-decimal space-y-1 ps-4.5 text-xs leading-relaxed text-muted-foreground">
            {(["one", "two", "three"] as const).map((step) => (
              <li key={step}>{t(`howTo.${step}`, { number: VODAFONE_CASH_NUMBER, amount })}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {form.method === "vodafone_cash" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="payer-phone" className="flex justify-between gap-2">
                {t("payerPhone")}
                <span className="text-xs font-normal text-muted-foreground">{t("digits")}</span>
              </Label>
              <Input
                id="payer-phone"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                maxLength={11}
                value={form.payerPhone}
                onChange={(e) => form.setPayerPhone(e.target.value.replace(/\D/g, ""))}
                onBlur={() => form.setPhoneTouched(true)}
                placeholder={t("payerPhonePlaceholder")}
                aria-invalid={showPhoneError}
                aria-describedby={showPhoneError ? "payer-phone-error" : undefined}
                className="h-11 text-start tabular-nums"
              />
              {showPhoneError && (
                <p id="payer-phone-error" className="text-xs text-destructive">
                  {t("payerPhoneError")}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transfer-reference" className="flex justify-between gap-2">
                {t("reference")}
                <span className="text-xs font-normal text-muted-foreground">{t("optional")}</span>
              </Label>
              <Input
                id="transfer-reference"
                dir="ltr"
                maxLength={100}
                value={form.reference}
                onChange={(e) => form.setReference(e.target.value)}
                placeholder={t("referencePlaceholder")}
                className="h-11 text-start"
              />
            </div>
          </>
        )}

        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
          <Checkbox
            checked={form.agreed}
            onCheckedChange={(v) => form.setAgreed(v === true)}
            className="mt-0.5"
          />
          {form.method === "wallet" ? tWallet("agree") : t("agree")}
        </label>
      </div>
    </form>
  );
}

function CopyField({
  label,
  value,
  suffix,
  copyLabel,
  onCopy,
}: {
  label: string;
  value: string;
  suffix?: string;
  copyLabel: string;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex h-11.5 items-center justify-between gap-2.5 rounded-xl border bg-card ps-3.5 pe-1.5">
        <p className="select-all text-[17px] font-bold tracking-wide tabular-nums">
          <span dir="ltr">{value}</span>
          {suffix && <span className="ms-1.5 text-sm font-medium tracking-normal">{suffix}</span>}
        </p>
        <Button type="button" variant="neutral" size="sm" onClick={onCopy}>
          <Copy aria-hidden />
          {copyLabel}
        </Button>
      </div>
    </div>
  );
}
