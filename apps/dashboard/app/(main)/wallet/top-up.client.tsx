"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy, ImageUp, LoaderCircle, Plus, RefreshCw, X } from "lucide-react";
import {
  MANUAL_TOP_UP_METHODS,
  STORE_TOP_UP_MIN_EGP,
  TALLABY_TOP_UP_ACCOUNTS,
  TOP_UP_PROOF_BUCKET,
  TOP_UP_PROOF_MAX_BYTES,
  TOP_UP_PROOF_TYPES,
  buildTopUpProofPath,
  parseStoreTopUpAmount,
  type ManualTopUpMethod,
} from "@workspace/lib/store-wallet";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { BUTTON_CLASS, FIELD_CLASS } from "@/components/form/form-ui";
import { CURRENCY_CODE, CurrencyInput } from "@/components/form/currency-input";
import { uploadSellerFile } from "@/components/inputs/use-seller-upload";
import { PaymentMethodLogo } from "@/components/payments/payment-method-logo";
import { formatMoney } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { submitManualTopUp } from "./top-up.server";

const PRESETS = ["100", "250", "500", "1000"];
const STEPS = ["amount", "transfer", "receipt"] as const;
type Step = (typeof STEPS)[number] | "done";

/** Brand colour per method, used only for the slip's edge and the chosen card. */
const METHOD_COLOR: Record<ManualTopUpMethod, string> = { vodafone_cash: "#E60000", instapay: "#3D1F73" };

/** "01003272830" → "0100 327 2830", easier to read off a screen and type into a wallet app. */
const groupNumber = (n: string) => n.replace(/^(\d{4})(\d{3})(\d+)$/, "$1 $2 $3");

/**
 * Store wallet › Top up (owner request 2026-10-18): amount and method, then
 * the transfer to Tallaby's number, then the receipt. Submitting records a
 * pending request; the balance changes only after an admin approves it.
 */
export function TopUpButton({
  sellerId,
  disabled,
  defaultOpen,
}: {
  sellerId: string;
  disabled?: boolean;
  /** Opens on load: /wallet?topup=1 from the negative-balance pop-up. */
  defaultOpen?: boolean;
}) {
  const t = useTranslations("storeWallet.manualTopUp");
  const tErrors = useTranslations("storeWallet.topUp.errors");
  const locale = useLocale();
  const router = useRouter();
  const ids = useId();
  const fileInput = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(Boolean(defaultOpen) && !disabled);
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("250");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [method, setMethod] = useState<ManualTopUpMethod>("vodafone_cash");
  const [senderPhone, setSenderPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"number" | "amount" | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsed = parseStoreTopUpAmount(amount);
  const money = parsed.success ? formatMoney(parsed.amount, locale) : "";
  const account = TALLABY_TOP_UP_ACCOUNTS[method];
  const methodLabel = t(`methods.${method}.name`);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const reset = () => {
    setStep("amount");
    setAmountError(null);
    setSenderPhone("");
    setFile(null);
    setPreview(null);
    setFileError(null);
  };

  const onOpenChange = (next: boolean) => {
    if (isPending) return;
    setOpen(next);
    if (!next) {
      if (step === "done") router.refresh();
      reset();
    }
  };

  const copy = async (value: string, what: "number" | "amount") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied((c) => (c === what ? null : c)), 1600);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const pickFile = (picked: File | undefined) => {
    if (!picked) return;
    if (!(TOP_UP_PROOF_TYPES as readonly string[]).includes(picked.type)) return setFileError(t("receipt.wrongType"));
    if (picked.size > TOP_UP_PROOF_MAX_BYTES) return setFileError(t("receipt.tooLarge"));
    setFileError(null);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const next = () => {
    if (step === "amount") {
      if (!parsed.success) return setAmountError(tErrors(parsed.error));
      setStep("transfer");
    } else if (step === "transfer") {
      setStep("receipt");
    }
  };

  const back = () => setStep(step === "receipt" ? "transfer" : "amount");

  const submit = () => {
    if (!parsed.success) return setStep("amount");
    if (!file) return setFileError(t("receipt.required"));
    const path = buildTopUpProofPath(sellerId, crypto.randomUUID(), file.type);
    if (!path) return setFileError(t("receipt.wrongType"));

    startTransition(async () => {
      try {
        await uploadSellerFile(file, { bucket: TOP_UP_PROOF_BUCKET, path });
      } catch (error) {
        console.error("Top-up receipt upload failed:", error);
        setFileError(t("receipt.uploadFailed"));
        return;
      }
      const result = await submitManualTopUp({ method, amount: parsed.amount, proofPath: path, senderPhone });
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setStep("done");
    });
  };

  const stepIndex = step === "done" ? STEPS.length : STEPS.indexOf(step);

  return (
    <>
      <Button type="button" variant="accent" className={BUTTON_CLASS} disabled={disabled} onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        {t("button")}
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          // Header and footer stay put; only the body scrolls, so Next/Submit is always on screen.
          className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]"
          // No autofocus on the amount field (owner request): the keyboard stays closed on phones.
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader className="shrink-0 gap-1 border-b px-5 pb-3 pt-5 text-start">
            <DialogTitle className="text-lg">{step === "done" ? t("done.title") : t("title")}</DialogTitle>
            <DialogDescription>{step === "done" ? t("done.subtitle") : t("description")}</DialogDescription>
            {step !== "done" && (
              <ol className="mt-2 grid grid-cols-3 gap-2" aria-label={t("progress")}>
                {STEPS.map((s, i) => (
                  <li key={s} aria-current={i === stepIndex ? "step" : undefined} className="min-w-0">
                    <span
                      className={cn(
                        "block h-1 rounded-full transition-colors duration-300",
                        i <= stepIndex ? "bg-primary" : "bg-border",
                      )}
                    />
                    <span
                      className={cn(
                        "mt-1.5 block truncate text-xs",
                        i === stepIndex ? "font-semibold text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {t(`steps.${s}`)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {step === "amount" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${ids}-amount`} className="text-[13px] font-semibold">
                    {t("amountLabel")}
                  </Label>
                  <CurrencyInput
                    id={`${ids}-amount`}
                    value={amount}
                    min={STORE_TOP_UP_MIN_EGP}
                    decimals={false}
                    invalid={!!amountError}
                    aria-describedby={`${ids}-amount-hint`}
                    className="h-12 rounded-xl"
                    addonClassName="px-4 text-sm"
                    inputClassName="text-2xl font-bold tabular-nums"
                    onChange={(value) => {
                      setAmount(value);
                      setAmountError(null);
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={amount === value}
                        onClick={() => {
                          setAmount(value);
                          setAmountError(null);
                        }}
                        className={cn(
                          "h-9 rounded-full border px-4 text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                          amount === value
                            ? "border-primary bg-primary-soft font-semibold text-primary-ink"
                            : "text-muted-foreground hover:border-input hover:text-foreground",
                        )}
                      >
                        <bdi dir="ltr">
                          {value} {CURRENCY_CODE}
                        </bdi>
                      </button>
                    ))}
                  </div>
                  <p id={`${ids}-amount-hint`} className={cn("text-xs", amountError ? "text-destructive" : "text-muted-foreground")}>
                    {amountError ?? t("limits")}
                  </p>
                </div>

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-[13px] font-semibold">{t("methodLabel")}</legend>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {MANUAL_TOP_UP_METHODS.map((m) => {
                      const selected = method === m;
                      return (
                        <label
                          key={m}
                          className={cn(
                            "relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-ring/40",
                            selected ? "border-transparent bg-primary-soft/60" : "hover:bg-muted/40",
                          )}
                          style={selected ? { boxShadow: `inset 0 0 0 1.5px ${METHOD_COLOR[m]}` } : undefined}
                        >
                          <input
                            type="radio"
                            name={`${ids}-method`}
                            className="sr-only"
                            checked={selected}
                            onChange={() => setMethod(m)}
                          />
                          <PaymentMethodLogo method={m} label={t(`methods.${m}.name`)} className="size-10" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">{t(`methods.${m}.name`)}</span>
                            <span className="block text-xs text-muted-foreground">{t(`methods.${m}.hint`)}</span>
                          </span>
                          {selected && <Check className="size-4 shrink-0" style={{ color: METHOD_COLOR[m] }} aria-hidden />}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            )}

            {step === "transfer" && (
              <div className="flex flex-col gap-4">
                {/* The transfer slip: what to send, and where. */}
                <div
                  className="relative overflow-hidden rounded-2xl border bg-card"
                  style={{ borderInlineStartWidth: 4, borderInlineStartColor: METHOD_COLOR[method] }}
                >
                  <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t("slip.sendExactly")}</p>
                      <p dir="ltr" className="mt-1 text-start text-[28px] font-bold leading-none tabular-nums rtl:text-end">
                        {money}
                      </p>
                    </div>
                    <CopyButton
                      label={t("slip.copyAmount")}
                      done={copied === "amount"}
                      onClick={() => parsed.success && copy(String(Number(parsed.amount)), "amount")}
                    />
                  </div>
                  <div aria-hidden className="relative h-0 border-t border-dashed">
                    <span className="absolute -start-2.5 -top-2.5 size-5 rounded-full border bg-background" />
                    <span className="absolute -end-2.5 -top-2.5 size-5 rounded-full border bg-background" />
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <PaymentMethodLogo method={method} label={methodLabel} className="size-10" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{t(`methods.${method}.to`)}</p>
                        <p dir="ltr" className="text-start font-mono text-xl font-semibold tracking-wide rtl:text-end">
                          {groupNumber(account.number)}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("slip.holder", { name: account.holder })}</p>
                      </div>
                    </div>
                    <CopyButton label={t("slip.copyNumber")} done={copied === "number"} onClick={() => copy(account.number, "number")} />
                  </div>
                </div>

                <ol className="flex flex-col gap-1.5 text-[13px] text-muted-foreground">
                  {(["open", "send", "screenshot"] as const).map((key, i) => (
                    <li key={key} className="flex gap-2.5">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                        {i + 1}
                      </span>
                      {t(`slip.how.${key}`, { method: methodLabel, amount: money })}
                    </li>
                  ))}
                </ol>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${ids}-sender`} className="justify-between text-[13px] font-semibold">
                    {t("senderLabel")}
                    <span className="text-xs font-normal text-muted-foreground">{t("optional")}</span>
                  </Label>
                  <Input
                    id={`${ids}-sender`}
                    dir="ltr"
                    inputMode="tel"
                    placeholder="01XXXXXXXXX"
                    className={cn(FIELD_CLASS, "text-start font-mono")}
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{t("senderHint")}</p>
                </div>
              </div>
            )}

            {step === "receipt" && (
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInput}
                  type="file"
                  accept={TOP_UP_PROOF_TYPES.join(",")}
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {preview && file ? (
                  <div className="flex items-center gap-4 rounded-2xl border p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL */}
                    <img src={preview} alt={t("receipt.previewAlt")} className="h-20 w-16 shrink-0 rounded-lg border object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" dir="auto">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => fileInput.current?.click()}>
                          <RefreshCw aria-hidden />
                          {t("receipt.replace")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          aria-label={t("receipt.remove")}
                          onClick={() => {
                            setFile(null);
                            setPreview(null);
                          }}
                        >
                          <X aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      pickFile(e.dataTransfer.files?.[0]);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-6 text-center transition-colors hover:border-primary/50 hover:bg-primary-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                      fileError && "border-destructive/60",
                    )}
                  >
                    <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary-ink">
                      <ImageUp className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold">{t("receipt.pick")}</span>
                    <span className="text-xs text-muted-foreground">{t("receipt.pickHint")}</span>
                  </button>
                )}
                {fileError && <p className="text-xs text-destructive">{fileError}</p>}
                <p className="rounded-xl bg-muted/50 px-3.5 py-2.5 text-[13px] text-muted-foreground">
                  {t("receipt.reviewNote", { amount: money })}
                </p>
              </div>
            )}

            {step === "done" && (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-accent-soft text-accent-ink">
                  <LoaderCircle className="size-6 motion-safe:animate-[spin_2.4s_linear_infinite]" aria-hidden />
                </span>
                <p dir="ltr" className="text-3xl font-bold tabular-nums">
                  {money}
                </p>
                <p className="max-w-sm text-pretty text-sm text-muted-foreground">{t("done.body", { method: methodLabel })}</p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t bg-muted/30 px-5 py-3">
            {step === "done" ? (
              <Button type="button" className={cn(BUTTON_CLASS, "ms-auto")} onClick={() => onOpenChange(false)}>
                {t("done.close")}
              </Button>
            ) : (
              <>
                {step !== "amount" && (
                  <Button type="button" variant="ghost" className={BUTTON_CLASS} disabled={isPending} onClick={back}>
                    <ArrowLeft className="rtl:rotate-180" aria-hidden />
                    {t("back")}
                  </Button>
                )}
                {step === "receipt" ? (
                  <Button type="button" variant="accent" className={cn(BUTTON_CLASS, "ms-auto")} disabled={isPending} onClick={submit}>
                    {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Check aria-hidden />}
                    {t("submit")}
                  </Button>
                ) : (
                  <Button type="button" className={cn(BUTTON_CLASS, "ms-auto")} onClick={next}>
                    {step === "transfer" ? t("transferred") : t("next")}
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CopyButton({ label, done, onClick }: { label: string; done: boolean; onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant="outline" className="shrink-0 rounded-lg" onClick={onClick} aria-label={label}>
      {done ? <Check className="text-success" aria-hidden /> : <Copy aria-hidden />}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
