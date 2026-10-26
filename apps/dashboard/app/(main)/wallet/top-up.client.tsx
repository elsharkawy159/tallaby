"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Copy,
  ImageUp,
  Infinity as InfinityIcon,
  Info,
  LoaderCircle,
  Minus,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
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
import { CURRENCY_CODE } from "@/components/form/currency-input";
import { uploadOwnFolderFile } from "@/components/inputs/use-seller-upload";
import { PaymentMethodLogo } from "@/components/payments/payment-method-logo";
import { formatMoney } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { POPULAR_TOP_UP, TOP_UP_PRESETS, TOP_UP_STEP_EGP, ordersCovered, stepTopUpAmount } from "./store-wallet.lib";
import { submitManualTopUp } from "./top-up.server";

const STEPS = ["method", "transfer", "receipt"] as const;
type Step = (typeof STEPS)[number] | "done";

/** Brand colour per method, used only for the slip's edge and the chosen card. */
const METHOD_COLOR: Record<ManualTopUpMethod, string> = { vodafone_cash: "#E60000", instapay: "#3D1F73" };

/** "01003272830" → "0100 327 2830", easier to read off a screen and type into a wallet app. */
const groupNumber = (n: string) => n.replace(/^(\d{4})(\d{3})(\d+)$/, "$1 $2 $3");

/** The amount field shows thousands separators; the state keeps plain digits. */
const groupDigits = (digits: string) => (digits ? Number(digits).toLocaleString("en-US") : "");

/**
 * Store wallet › Top up (owner request 2026-10-18; Claude Design "Seller
 * Wallet", 2026-10-26): the amount is chosen on the page, then the dialog asks
 * for the method, shows the transfer to Tallaby's number and takes the
 * receipt. Submitting records a pending request; the balance changes only
 * after an admin approves it.
 */
export function TopUpPanel({
  sellerId,
  balance,
  disabled,
  defaultOpen,
}: {
  sellerId: string;
  /** The current balance, for "balance after the top-up". */
  balance: number;
  disabled?: boolean;
  /** Opens on load: /wallet?topup=1 from the negative-balance pop-up. */
  defaultOpen?: boolean;
}) {
  const t = useTranslations("storeWallet.manualTopUp");
  const tErrors = useTranslations("storeWallet.topUp.errors");
  const locale = useLocale();
  const router = useRouter();
  const ids = useId();
  const amountInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(Boolean(defaultOpen) && !disabled);
  const [step, setStep] = useState<Step>("method");
  const [amount, setAmount] = useState("250");
  const [method, setMethod] = useState<ManualTopUpMethod>("vodafone_cash");
  const [senderPhone, setSenderPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"number" | "amount" | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsed = parseStoreTopUpAmount(amount);
  const value = Number(amount) || 0;
  const money = parsed.success ? formatMoney(parsed.amount, locale) : "";
  const account = TALLABY_TOP_UP_ACCOUNTS[method];
  const methodLabel = t(`methods.${method}.name`);
  // Only a typed amount gets an error; an empty field just shows the limits.
  const amountError = !parsed.success && value > 0 && parsed.error !== "invalid" ? tErrors(parsed.error) : null;
  const canStart = parsed.success && !disabled;

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const reset = () => {
    setStep("method");
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

  const start = () => {
    if (!canStart) return amountInput.current?.focus();
    reset();
    setOpen(true);
  };

  const changeAmount = () => {
    onOpenChange(false);
    // After the dialog has given focus back to the page.
    setTimeout(() => amountInput.current?.focus(), 0);
  };

  const copy = async (text: string, what: "number" | "amount") => {
    try {
      await navigator.clipboard.writeText(text);
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

  const back = () => setStep(step === "receipt" ? "transfer" : "method");

  const submit = () => {
    if (!parsed.success) return changeAmount();
    if (!file) return setFileError(t("receipt.required"));
    const path = buildTopUpProofPath(sellerId, crypto.randomUUID(), file.type);
    if (!path) return setFileError(t("receipt.wrongType"));

    startTransition(async () => {
      try {
        await uploadOwnFolderFile(file, { bucket: TOP_UP_PROOF_BUCKET, path });
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
  const total = parsed.success ? money : "—";

  return (
    <>
      <section
        aria-labelledby={`${ids}-title`}
        className="grid overflow-hidden rounded-2xl border bg-card shadow-xs lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
          <div>
            <h2 id={`${ids}-title`} className="text-[17px] font-bold">
              {t("panel.title")}
            </h2>
            <p className="text-[13px] text-muted-foreground">{t("panel.subtitle")}</p>
          </div>

          <fieldset disabled={disabled}>
            <legend className="mb-2 text-[13px] font-semibold">{t("panel.presets")}</legend>
            <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-3 xl:grid-cols-5 sm:gap-2.5">
              {TOP_UP_PRESETS.map((preset) => {
                const selected = value === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAmount(String(preset))}
                    className={cn(
                      "relative flex h-[72px] flex-col items-center justify-center gap-0.5 rounded-2xl border-[1.5px] bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.98] disabled:opacity-60 sm:h-[84px]",
                      selected ? "border-primary bg-primary-soft" : "hover:border-input hover:bg-muted/40",
                    )}
                  >
                    {preset === POPULAR_TOP_UP && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-2 text-[10.5px] font-bold leading-5 text-accent-foreground">
                        {t("panel.popular")}
                      </span>
                    )}
                    {selected && (
                      <span className="absolute end-2 top-2 grid size-[18px] place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3 stroke-3" aria-hidden />
                      </span>
                    )}
                    <bdi dir="ltr" className={cn("text-lg font-extrabold tabular-nums sm:text-xl", selected && "text-primary-ink")}>
                      {preset.toLocaleString("en-US")}
                    </bdi>
                    <span className="text-[11.5px] text-muted-foreground">
                      {t("panel.approxOrders", { count: ordersCovered(preset) })}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <Label htmlFor={`${ids}-amount`} className="mb-2 text-[13px] font-semibold">
              {t("panel.custom")}
            </Label>
            <div
              dir="ltr"
              className={cn(
                "flex h-14 items-stretch overflow-hidden rounded-2xl border-[1.5px] bg-card transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-3 focus-within:ring-ring/25",
                amountError && "border-destructive",
                disabled && "opacity-60",
              )}
            >
              <span className="flex items-center border-e bg-muted/40 px-4 font-mono text-sm font-semibold text-muted-foreground">
                {CURRENCY_CODE}
              </span>
              <input
                ref={amountInput}
                id={`${ids}-amount`}
                inputMode="numeric"
                autoComplete="off"
                disabled={disabled}
                aria-invalid={amountError ? true : undefined}
                aria-describedby={`${ids}-amount-hint`}
                className="min-w-0 flex-1 bg-transparent px-4 text-[22px] font-bold tabular-nums outline-none"
                value={groupDigits(amount)}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").replace(/^0+/, ""))}
              />
              {(
                [
                  [-TOP_UP_STEP_EGP, Minus, "panel.decrease"],
                  [TOP_UP_STEP_EGP, Plus, "panel.increase"],
                ] as const
              ).map(([delta, Icon, label]) => (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  aria-label={t(label)}
                  onClick={() => setAmount(String(stepTopUpAmount(value, delta)))}
                  className="grid w-11 place-items-center border-s text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                >
                  <Icon className="size-[18px]" aria-hidden />
                </button>
              ))}
            </div>
            <p id={`${ids}-amount-hint`} className={cn("mt-1.5 text-xs", amountError ? "text-destructive" : "text-muted-foreground")}>
              {amountError ?? t("limits")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
            <span>{t("panel.methods")}</span>
            {MANUAL_TOP_UP_METHODS.map((m) => (
              <span key={m} className="inline-flex items-center gap-1.5">
                <PaymentMethodLogo method={m} label={t(`methods.${m}.name`)} className="size-[26px] rounded-md" />
                {t(`methods.${m}.name`)}
              </span>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-3 border-s bg-muted/30 p-6 max-lg:hidden">
          <SummaryRow label={t("panel.summary.amount")} value={total} />
          <SummaryRow label={t("panel.summary.fee")} value={t("panel.summary.free")} />
          <div className="flex items-baseline justify-between gap-3 border-t border-dashed pt-3 font-semibold">
            <span className="whitespace-nowrap">{t("panel.summary.total")}</span>
            <bdi dir="ltr" className="whitespace-nowrap text-[22px] font-extrabold tabular-nums">
              {total}
            </bdi>
          </div>
          <p className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            <TrendingUp className="size-[15px] shrink-0" aria-hidden />
            {t("panel.summary.after")}
            <bdi dir="ltr" className="font-semibold text-success tabular-nums">
              {parsed.success ? formatMoney(balance + Number(parsed.amount), locale) : "—"}
            </bdi>
          </p>
          <Button type="button" variant="accent" className="h-[50px] w-full rounded-[14px] text-[15px] font-semibold" disabled={!canStart} onClick={start}>
            {t("panel.cta")}
            <ArrowLeft className="ltr:rotate-180" aria-hidden />
          </Button>
          <ul className="mt-1 flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-[15px] shrink-0 text-success" aria-hidden />
              {t("panel.trust.review")}
            </li>
            <li className="flex items-center gap-2">
              <InfinityIcon className="size-[15px] shrink-0 text-success" aria-hidden />
              {t("panel.trust.noExpiry")}
            </li>
          </ul>
        </aside>
      </section>

      {/* Phones and tablets: the summary column is hidden, so the action stays on screen.
          mb-0 beats the parent's space-y margin, which would lift a fixed bar off the bottom. */}
      <div className="fixed inset-x-0 bottom-0 z-30 mb-0 flex items-center gap-3 border-t bg-card px-4 py-3 shadow-[0_-6px_20px_rgba(20,81,99,0.08)] lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-snug text-muted-foreground">{t("panel.summary.amount")}</p>
          <bdi dir="ltr" className="text-[19px] font-extrabold tabular-nums">
            {total}
          </bdi>
        </div>
        <Button type="button" variant="accent" className="h-12 px-5 font-semibold" disabled={!canStart} onClick={start}>
          {t("panel.cta")}
          <ArrowLeft className="ltr:rotate-180" aria-hidden />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          // Header and footer stay put; only the body scrolls, so Next/Submit is always on screen.
          className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]"
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
            {step === "method" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-primary-soft px-3.5 py-3 text-primary-ink">
                  <div>
                    <p className="text-xs opacity-85">{t("panel.summary.amount")}</p>
                    <p dir="ltr" className="text-start text-xl font-extrabold tabular-nums rtl:text-end">
                      {money}
                    </p>
                  </div>
                  <button type="button" onClick={changeAmount} className="text-[12.5px] underline underline-offset-2">
                    {t("changeAmount")}
                  </button>
                </div>

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-[13px] font-semibold">{t("methodLabel")}</legend>
                  <div className="grid gap-2.5">
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
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary-ink">
                        {i + 1}
                      </span>
                      {t(`slip.how.${key}`, { method: methodLabel, amount: money })}
                    </li>
                  ))}
                </ol>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${ids}-sender`} className="justify-between text-[13px] font-semibold">
                    {t(`methods.${method}.sender`)}
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
                      "flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed bg-muted/30 px-6 py-7 text-center transition-colors hover:border-primary/50 hover:bg-primary-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                      fileError && "border-destructive/60",
                    )}
                  >
                    <span className="grid size-12 place-items-center rounded-2xl border bg-card text-primary-ink">
                      <ImageUp className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold">{t("receipt.pick")}</span>
                    <span className="text-xs text-muted-foreground">{t("receipt.pickHint")}</span>
                  </button>
                )}
                {fileError && <p className="text-xs text-destructive">{fileError}</p>}
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl bg-muted/40 px-3.5 py-3 text-[13px]">
                  <dt className="text-muted-foreground">{t("recap.amount")}</dt>
                  <dd className="text-end font-semibold">
                    <bdi dir="ltr">{money}</bdi>
                  </dd>
                  <dt className="text-muted-foreground">{t("recap.method")}</dt>
                  <dd className="text-end font-semibold">{methodLabel}</dd>
                  {senderPhone.trim() && (
                    <>
                      <dt className="text-muted-foreground">{t("recap.from")}</dt>
                      <dd className="text-end font-semibold">
                        <bdi dir="ltr">{senderPhone.trim()}</bdi>
                      </dd>
                    </>
                  )}
                </dl>
                <p className="flex items-start gap-2 rounded-xl bg-accent-soft px-3 py-2.5 text-[12.5px] text-accent-ink">
                  <Info className="mt-0.5 size-[15px] shrink-0" aria-hidden />
                  {t("receipt.clarity")}
                </p>
              </div>
            )}

            {step === "done" && (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-success-soft text-success">
                  <Check className="size-7" aria-hidden />
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
              <Button type="button" className={cn(BUTTON_CLASS, "w-full")} onClick={() => onOpenChange(false)}>
                {t("done.close")}
              </Button>
            ) : (
              <>
                {step === "method" ? (
                  <Button type="button" variant="ghost" className={BUTTON_CLASS} onClick={() => onOpenChange(false)}>
                    {t("cancel")}
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" className={BUTTON_CLASS} disabled={isPending} onClick={back}>
                    <ArrowLeft className="rtl:rotate-180" aria-hidden />
                    {t("back")}
                  </Button>
                )}
                {step === "receipt" ? (
                  <Button
                    type="button"
                    variant="accent"
                    className={cn(BUTTON_CLASS, "ms-auto")}
                    disabled={isPending || !file}
                    onClick={submit}
                  >
                    {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Send className="rtl:-scale-x-100" aria-hidden />}
                    {t("submit")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className={cn(BUTTON_CLASS, "ms-auto")}
                    onClick={() => setStep(step === "method" ? "transfer" : "receipt")}
                  >
                    {step === "transfer" ? t("transferred") : t("next")}
                    <ArrowLeft className="ltr:rotate-180" aria-hidden />
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13.5px] text-muted-foreground">
      <span className="whitespace-nowrap">{label}</span>
      <bdi dir="ltr" className="whitespace-nowrap font-semibold text-foreground tabular-nums">
        {value}
      </bdi>
    </div>
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
