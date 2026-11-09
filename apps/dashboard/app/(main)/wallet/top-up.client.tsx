"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Coins,
  Copy,
  Hourglass,
  ImageUp,
  Infinity as InfinityIcon,
  LoaderCircle,
  Minus,
  Plus,
  Send,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import {
  CARD_TOP_UPS_ENABLED,
  MANUAL_TOP_UP_METHODS,
  TALLABY_TOP_UP_ACCOUNTS,
  TOP_UP_PROOF_BUCKET,
  TOP_UP_PROOF_MAX_BYTES,
  TOP_UP_PROOF_TYPES,
  buildTopUpProofPath,
  parseStoreTopUpAmount,
  STORE_TOP_UP_MIN_EGP,
  type ManualTopUpMethod,
} from "@workspace/lib/store-wallet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { DropZone, Field, IconButton, Note, SellerButton, SellerCard, Tag, TextInput } from "@/components/seller-ui";
import { toAsciiDigits } from "@/components/form/form-ui";
import { uploadOwnFolderFile } from "@/components/inputs/use-seller-upload";
import { PaymentMethodLogo } from "@/components/payments/payment-method-logo";
import { cn } from "@/lib/utils";
import { FREE_ORDER_FEE_USD_CENTS, TOP_UP_MAX_USD_CENTS, TOP_UP_MIN_USD_CENTS, minorToAmount, parseUsdTopUp, quoteTopUp, type BillingState } from "@workspace/lib/billing";
import { formatUsdPrice } from "@/lib/i18n/format";
import { DEFAULT_TOP_UP_USD, POPULAR_TOP_UP, POPULAR_TOP_UP_USD, TOP_UP_PRESETS, TOP_UP_PRESETS_USD, TOP_UP_STEP_EGP, TOP_UP_STEP_USD, orderCountValues, ordersCovered, stepTopUpAmount, stepUsdTopUp, TOP_UP_MAX_EGP, walletMoney, walletPoundLabel } from "./store-wallet.lib";
import { submitManualTopUp } from "./top-up.server";

/**
 * How a preset card sizes itself, by how many presets there are. The columns follow the space the
 * cards really get (the summary column squeezes it at lg), so the wrapper's parent is a @container.
 * Each basis is (100% - the gaps) / columns, taken at the larger 10px gap; flex-1 fills the rest.
 * Thresholds are the narrowest width where the longest English line and the badge still fit. Where the columns
 * don't divide the cards evenly, min-h keeps a full row square and the short last row wider than tall.
 */
const PRESET_CARD_LAYOUT: Record<number, string> = {
  // 2 square, then 3 + 3 + 2, then 4 + 4 square, then 8 square.
  8: "aspect-square basis-[calc((100%-10px)/2)] @[290px]:aspect-auto @[290px]:min-h-[calc((100cqw-20px)/3)] @[290px]:basis-[calc((100%-20px)/3)] @[400px]:aspect-square @[400px]:min-h-auto @[400px]:basis-[calc((100%-30px)/4)] @[820px]:basis-[calc((100%-70px)/8)]",
  // 3 + 2, then 5 square.
  5: "min-h-[calc((100cqw-20px)/3)] basis-[calc((100%-20px)/3)] @[480px]:aspect-square @[480px]:min-h-auto @[480px]:basis-[calc((100%-40px)/5)]",
};

/** "01003272830" → "0100 327 2830", easier to read off a screen and type into a wallet app. */
const groupNumber = (n: string) => n.replace(/^(\d{4})(\d{3})(\d+)$/, "$1 $2 $3");

/** The amount field shows thousands separators; the state keeps plain digits. */
const groupDigits = (digits: string) => (digits ? Number(digits).toLocaleString("en-US") : "");

/**
 * Store wallet › Top up (owner request 2026-10-18; Claude Design "Seller
 * Wallet v3"): the amount and the method are chosen on the page, the summary
 * sits beside them, and the dialog shows the transfer to Tallaby's number and
 * takes the receipt. Submitting records a pending request; the balance changes
 * only after an admin approves it. `below` and `side` are the page's other
 * cards, placed here so one grid holds the sticky summary.
 */
export function TopUpPanel({
  sellerId,
  balance,
  disabled,
  defaultOpen,
  billing,
  below,
  side,
}: {
  /** Set once the wallet is in USD (0136): priced in dollars, paid in EGP. */
  billing?: BillingState | null;
  sellerId: string;
  /** The current balance, for "balance after the top-up". */
  balance: number;
  disabled?: boolean;
  /** Opens on load: /wallet?topup=1 from the negative-balance pop-up. */
  defaultOpen?: boolean;
  /** The column under the top-up card. */
  below?: React.ReactNode;
  /** Under the summary card. */
  side?: React.ReactNode;
}) {
  const t = useTranslations("storeWallet.manualTopUp");
  const tErrors = useTranslations("storeWallet.topUp.errors");
  const tWallet = useTranslations("storeWallet");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const ids = useId();
  const amountInput = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(Boolean(defaultOpen) && !disabled);
  const [done, setDone] = useState(false);
  const usd = Boolean(billing?.usdLive);
  const presets = usd ? TOP_UP_PRESETS_USD : TOP_UP_PRESETS;
  const [amount, setAmount] = useState(usd ? String(DEFAULT_TOP_UP_USD) : "250");
  const [method, setMethod] = useState<ManualTopUpMethod>(MANUAL_TOP_UP_METHODS[0]);
  const [senderPhone, setSenderPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"number" | "amount" | null>(null);
  const [isPending, startTransition] = useTransition();

  // Prices show in EGP at this rate (owner, 2026-11-09). The amount typed stays in dollars:
  // that is what the wallet is credited and what the quote below prices, unchanged.
  const rate = usd ? (billing?.marketRate ?? null) : null;
  const limitValues = usd
    ? {
        min: formatUsdPrice(TOP_UP_MIN_USD_CENTS, locale, rate),
        max: formatUsdPrice(TOP_UP_MAX_USD_CENTS, locale, rate),
        minUsd: (TOP_UP_MIN_USD_CENTS / 100).toLocaleString("en-US"),
        maxUsd: (TOP_UP_MAX_USD_CENTS / 100).toLocaleString("en-US"),
      }
    : { min: walletMoney(STORE_TOP_UP_MIN_EGP, "EGP", locale), max: walletMoney(TOP_UP_MAX_EGP, "EGP", locale), minUsd: "", maxUsd: "" };
  const usdParsed = usd ? parseUsdTopUp(amount) : null;
  const quote = usdParsed?.success && billing ? quoteTopUp(usdParsed.usdCents, billing) : null;
  // Whichever mode: `parsed.amount` is what the seller typed, `money` is the EGP to send.
  const parsed: ReturnType<typeof parseStoreTopUpAmount> = !usd
    ? parseStoreTopUpAmount(amount)
    : usdParsed?.success
      ? quote
        ? { success: true, piastres: quote.totalPiastres, amount: minorToAmount(usdParsed.usdCents) }
        : { success: false, error: "invalid" }
      : { success: false, error: usdParsed?.error ?? "invalid" };
  const value = Number(amount) || 0;
  const money = !parsed.success ? "" : walletMoney(quote ? quote.totalPiastres / 100 : parsed.amount, "EGP", locale);
  // The top-up before tax in EGP: the quote's own whole pounds, so amount + tax = total.
  const credited = !parsed.success ? "—" : quote ? walletMoney(quote.basePiastres / 100, "EGP", locale) : walletMoney(parsed.amount, usd ? "USD" : "EGP", locale, rate);
  const account = TALLABY_TOP_UP_ACCOUNTS[method];
  const methodLabel = t(`methods.${method}.name`);
  // Only a typed amount gets an error; an empty field just shows the limits.
  // The shared errors name EGP limits; in USD mode the limits line says it right.
  const amountError = !parsed.success && value > 0 && parsed.error !== "invalid" ? (usd ? t("limitsUsd", limitValues) : tErrors(parsed.error, limitValues)) : null;
  const canStart = parsed.success && !disabled;

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const reset = () => {
    setDone(false);
    setSenderPhone("");
    setFile(null);
    setPreview(null);
    setFileError(null);
  };

  const onOpenChange = (next: boolean) => {
    if (isPending) return;
    setOpen(next);
    if (!next) {
      if (done) router.refresh();
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

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

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
      setDone(true);
    });
  };

  const total = parsed.success ? money : "—";
  const afterBalance = parsed.success ? balance + Number(parsed.amount) : null;
  const walletCurrency = usd ? "USD" : "EGP";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_360px] grid-rows-[auto_1fr] items-start gap-x-5 gap-y-4 max-[1180px]:grid-cols-1 max-[1180px]:grid-rows-none">
      <SellerCard
        id="topup"
        aria-labelledby={`${ids}-title`}
        className="sui-rise flex scroll-mt-24 flex-col gap-[18px] px-6 pb-6 pt-[22px] [animation-delay:.05s] max-[720px]:gap-4 max-[720px]:px-4 max-[720px]:pb-5 max-[720px]:pt-[18px]"
      >
        <div>
          <h2 id={`${ids}-title`} className="text-[17px] font-bold leading-normal text-(--s-ink)">
            {t("panel.title")}
          </h2>
          <p className="text-pretty text-[13px] text-(--s-subtle)">{t("panel.subtitle")}</p>
        </div>

        <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-3">
          <legend className="contents">
            <span className="flex items-center gap-2.5 text-[13.5px] font-bold text-(--s-text)">
              <StepNumber>1</StepNumber>
              {t("panel.presets")}
            </span>
          </legend>
          <div className="@container ps-10 max-[720px]:ps-0">
            {/* gap-y-3 clears the popular badge, which sticks up 10px when its card wraps to a lower row. */}
            <div className="flex flex-wrap gap-x-2 gap-y-3 pt-2 sm:gap-x-2.5">
              {presets.map((preset) => {
                const selected = value === preset;
                // What the seller pays for this card, the same figure as the summary's total.
                const presetQuote = usd && billing ? quoteTopUp(preset * 100, billing) : null;
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAmount(String(preset))}
                    className={cn(
                      // pt-[22px] is the circle's top-1.5 + size-4, so the amount always starts below it.
                      "relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[18px] border-[1.5px] border-(--s-field) bg-(--s-surface) px-0.5 pb-1.5 pt-[22px] text-center transition-[border-color,background-color,box-shadow,translate] duration-150 hover:-translate-y-0.5 hover:border-(--tallaby-teal-300) focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-(--s-focus) active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
                      PRESET_CARD_LAYOUT[presets.length],
                      selected && "border-(--s-primary) bg-(--s-tint) shadow-[0_0_0_3px_var(--s-focus-soft)]",
                    )}
                  >
                    {preset === (usd ? POPULAR_TOP_UP_USD : POPULAR_TOP_UP) && (
                      // leading-4 ends the badge exactly where the circle starts, so the two never touch on a narrow card.
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-1 text-[10.5px] font-bold leading-4 text-accent-foreground @[290px]:px-2">
                        {t("panel.popular")}
                      </span>
                    )}
                    <span
                      className={cn(
                        "absolute end-1.5 top-1.5 grid size-4 place-items-center rounded-full border-[1.5px] text-(--s-solid-fg) transition-colors duration-200 motion-reduce:transition-none",
                        selected ? "border-(--s-primary) bg-(--s-primary)" : "border-(--s-field-strong) bg-(--s-surface)",
                      )}
                    >
                      <Check
                        className={cn(
                          "size-3 stroke-3 transition-[opacity,scale] duration-200 motion-reduce:transition-none",
                          selected ? "scale-100 opacity-100" : "scale-50 opacity-0",
                        )}
                        aria-hidden
                      />
                    </span>
                    {presetQuote ? (
                      // USD wallet: the EGP the seller transfers leads; the dollars credited (the typed amount) are small.
                      <>
                        <bdi className="whitespace-nowrap font-montserrat text-[15px]/6 font-extrabold text-(--s-ink) tabular-nums">
                          {walletMoney(presetQuote.totalPiastres / 100, "EGP", locale)}
                        </bdi>
                        <bdi dir="ltr" className="font-montserrat text-[11.5px]/4 text-(--s-subtle) tabular-nums">
                          ${preset.toLocaleString("en-US")}
                        </bdi>
                      </>
                    ) : (
                      <bdi dir="ltr" className="font-montserrat text-lg/6 font-extrabold text-(--s-ink) tabular-nums">
                        {usd ? "$" : ""}{preset.toLocaleString("en-US")}
                      </bdi>
                    )}
                    <span className="whitespace-nowrap text-[11.5px]/4 text-(--s-subtle)">
                      {t("panel.approxOrders", orderCountValues(ordersCovered(preset, usd ? "USD" : "EGP"), locale))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>

        <div className="flex min-w-0 flex-col gap-2 ps-10 max-[720px]:ps-0">
          <label htmlFor={`${ids}-amount`} className="text-[13px] font-semibold text-(--s-text)">
            {t("panel.custom")}
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            <div
              dir="ltr"
              className={cn(
                "flex h-12 max-w-full items-stretch overflow-hidden rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) transition-[border-color,box-shadow] duration-150 focus-within:border-(--s-primary) focus-within:shadow-[0_0_0_4px_var(--s-focus-soft)]",
                amountError && "border-destructive",
                disabled && "opacity-60",
              )}
            >
              <span className="flex items-center ps-3.5 pe-1 font-montserrat text-[15px] font-bold text-(--s-subtle)">
                {usd ? "$" : walletPoundLabel(locale)}
              </span>
              <input
                ref={amountInput}
                id={`${ids}-amount`}
                inputMode="numeric"
                autoComplete="off"
                disabled={disabled}
                aria-invalid={amountError ? true : undefined}
                aria-describedby={`${ids}-amount-hint`}
                className="w-[110px] min-w-0 flex-1 bg-transparent px-1.5 font-montserrat text-lg font-bold text-(--s-ink) tabular-nums outline-none"
                value={groupDigits(amount)}
                onChange={(e) => setAmount(toAsciiDigits(e.target.value).replace(/\D/g, "").replace(/^0+/, ""))}
              />
              {(
                [
                  [usd ? -TOP_UP_STEP_USD : -TOP_UP_STEP_EGP, Minus, "panel.decrease"],
                  [usd ? TOP_UP_STEP_USD : TOP_UP_STEP_EGP, Plus, "panel.increase"],
                ] as const
              ).map(([delta, Icon, label]) => (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  aria-label={t(label)}
                  onClick={() => setAmount(String(usd ? stepUsdTopUp(value, delta) : stepTopUpAmount(value, delta)))}
                  className="grid w-11 shrink-0 cursor-pointer place-items-center border-s border-(--s-line-soft) text-(--s-primary) transition-colors duration-150 hover:bg-(--s-hover)"
                >
                  <Icon className="size-[18px]" aria-hidden />
                </button>
              ))}
            </div>
            <p
              id={`${ids}-amount-hint`}
              className={cn("min-w-0 flex-1 basis-40 text-pretty text-xs", amountError ? "font-semibold text-destructive" : "text-(--s-faint)")}
            >
              {amountError ?? (usd ? t("limitsUsd", limitValues) : t("limits"))}
            </p>
          </div>
        </div>

        <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-3">
          <legend className="contents">
            <span className="flex items-center gap-2.5 text-[13.5px] font-bold text-(--s-text)">
              <StepNumber>2</StepNumber>
              {t("methodLabel")}
            </span>
          </legend>
          <div className="grid grid-cols-2 gap-2.5 ps-10 max-[720px]:grid-cols-1 max-[720px]:ps-0">
            {MANUAL_TOP_UP_METHODS.map((m) => (
              <label
                key={m}
                className="relative flex cursor-pointer items-center gap-3 rounded-[18px] border-[1.5px] border-(--s-field) bg-(--s-surface) p-3.5 transition-[border-color,background-color,box-shadow] duration-150 hover:border-(--s-outline) has-checked:border-(--s-primary) has-checked:bg-(--s-tint) has-checked:shadow-[0_0_0_3px_var(--s-focus-soft)] has-focus-visible:outline-[3px] has-focus-visible:outline-offset-2 has-focus-visible:outline-(--s-focus) has-disabled:cursor-not-allowed has-disabled:opacity-60"
              >
                <input
                  type="radio"
                  name={`${ids}-method`}
                  className="peer absolute size-px opacity-0"
                  checked={method === m}
                  onChange={() => setMethod(m)}
                />
                <PaymentMethodLogo method={m} label={t(`methods.${m}.name`)} className="size-[42px] rounded-[13px] border-(--s-line)" />
                <span className="min-w-0 flex-1">
                  <b className="block text-sm font-bold text-(--s-ink)">{t(`methods.${m}.name`)}</b>
                  <small className="block text-xs text-(--s-subtle)">{t(`methods.${m}.hint`)}</small>
                </span>
                <span
                  aria-hidden
                  className="size-5 shrink-0 rounded-full border-2 border-(--s-field-strong) transition-all duration-150 peer-checked:border-[6px] peer-checked:border-(--s-primary)"
                />
              </label>
            ))}
            {!CARD_TOP_UPS_ENABLED && (
              <div
                aria-disabled="true"
                className="flex items-center gap-3 rounded-[18px] border-[1.5px] border-dashed border-(--s-field) p-3.5 opacity-70"
              >
                <PaymentMethodLogo method="card" label={t("methods.card.name")} className="size-[42px] rounded-[13px] border-(--s-line)" />
                <span className="min-w-0 flex-1">
                  <b className="block text-sm font-bold text-(--s-ink)">{t("methods.card.name")}</b>
                  <small className="block text-xs text-(--s-subtle)">{t("methods.card.hint")}</small>
                </span>
                <Tag>{t("methods.card.soon")}</Tag>
              </div>
            )}
          </div>
        </fieldset>
      </SellerCard>

      {/* Second in the DOM, so one column puts the summary and its button right under the amount. */}
      <aside className="sui-rise sticky top-[88px] row-span-2 flex min-w-0 flex-col gap-3.5 [animation-delay:.08s] max-[1180px]:static max-[1180px]:row-span-1">
        <SellerCard aria-labelledby={`${ids}-summary`} className="flex flex-col gap-3.5 p-[22px] max-[720px]:p-4">
          <h3 id={`${ids}-summary`} className="text-[15.5px] font-bold text-(--s-ink)">
            {t("panel.summary.title")}
          </h3>
          <SummaryRow label={t("panel.summary.amount")} value={usd ? credited : total} />
          {quote && <SummaryRow label={t("panel.summary.rateUsd")} value={walletMoney(quote.rate, "EGP", locale)} />}
          {quote && quote.taxPiastres > 0 && (
            <SummaryRow label={t("panel.summary.tax")} value={walletMoney(quote.taxPiastres / 100, "EGP", locale)} />
          )}
          {!usd && <SummaryRow label={t("panel.summary.fee")} value={t("panel.summary.free")} />}
          <div className="flex items-baseline justify-between gap-3 rounded-[18px] border border-(--tallaby-amber-100) bg-accent-soft p-4 dark:border-transparent">
            <span className="whitespace-nowrap text-[13.5px] font-bold text-accent-ink">{t("panel.summary.total")}</span>
            <bdi className="whitespace-nowrap font-montserrat text-[26px] font-extrabold leading-none text-(--s-ink) tabular-nums">{total}</bdi>
          </div>
          <p className="flex items-start gap-2 text-[12.5px] font-semibold text-success">
            <TrendingUp className="mt-0.5 size-[15px] shrink-0" aria-hidden />
            <span>
              {t("panel.summary.after")}{" "}
              <bdi className="font-montserrat tabular-nums">{afterBalance === null ? "—" : walletMoney(afterBalance, walletCurrency, locale)}</bdi>
              {afterBalance !== null && <> · {tWallet("runway", orderCountValues(ordersCovered(afterBalance, walletCurrency), locale))}</>}
            </span>
          </p>
          <SellerButton className="h-[52px] w-full text-[15px]" disabled={!canStart} onClick={start}>
            {t("panel.cta")}
            <ArrowLeft className="ltr:rotate-180" aria-hidden />
          </SellerButton>
          <ul className="flex flex-col gap-2 border-t border-(--s-line-soft) pt-3.5 text-[12.5px] text-(--s-muted)">
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-[15px] shrink-0 text-success" aria-hidden />
              {t("panel.trust.review")}
            </li>
            <li className="flex items-center gap-2">
              <InfinityIcon className="size-[15px] shrink-0 text-success" aria-hidden />
              {usd ? t("panel.trust.noExpiry") : t("panel.trust.noExpiryEgp")}
            </li>
            {usd && (
              <li className="flex items-center gap-2">
                <Coins className="size-[15px] shrink-0 text-success" aria-hidden />
                {t("panel.trust.feeUsd", { fee: formatUsdPrice(FREE_ORDER_FEE_USD_CENTS, locale, rate) })}
              </li>
            )}
          </ul>
        </SellerCard>
        {side}
      </aside>

      <div className="flex min-w-0 flex-col gap-4">{below}</div>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          closeLabel={tCommon("close")}
          // Header and footer stay put; only the body scrolls, so the send button is always on screen.
          className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0! sm:max-w-[480px]"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader className="shrink-0 gap-1 px-6 pe-12 pt-6 text-start max-[480px]:px-[18px] max-[480px]:pt-[18px]">
            <DialogTitle className="text-lg font-bold text-(--s-ink)">
              {done ? t("done.title") : t("dialogTitle", { amount: money })}
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-(--s-subtle)">
              {done ? t("done.subtitle") : t("dialogDescription", { method: methodLabel })}
            </DialogDescription>
            {!done && (
              <div className="-me-6 mt-2.5 flex gap-1.5" role="img" aria-label={t("progress")}>
                {[true, true, Boolean(file)].map((on, i) => (
                  <i
                    key={i}
                    className={cn("h-1 flex-1 rounded-full transition-colors duration-300", on ? "bg-(--s-primary)" : "bg-(--s-line-soft)")}
                  />
                ))}
              </div>
            )}
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 max-[480px]:px-[18px]">
            {done ? (
              <div className="flex flex-col items-center gap-2.5 py-2 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent-ink">
                  <Hourglass className="size-[30px]" aria-hidden />
                </span>
                <p className="font-montserrat text-3xl font-bold text-(--s-ink) tabular-nums">
                  <bdi>{money}</bdi>
                </p>
                <p className="max-w-[340px] text-pretty text-[13px] text-(--s-muted)">{t("done.body", { method: methodLabel })}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-2">
                  <CopyRow
                    label={t("slip.sendExactly")}
                    copyLabel={t("slip.copyAmount")}
                    done={copied === "amount"}
                    onCopy={() => parsed.success && copy(String(quote ? quote.totalPiastres / 100 : Number(parsed.amount)), "amount")}
                  >
                    <bdi>{money}</bdi>
                  </CopyRow>
                  <CopyRow
                    label={t(`methods.${method}.to`)}
                    note={t("slip.holder", { name: account.holder })}
                    copyLabel={t("slip.copyNumber")}
                    done={copied === "number"}
                    onCopy={() => copy(account.number, "number")}
                  >
                    <bdi dir="ltr">{groupNumber(account.number)}</bdi>
                  </CopyRow>
                  <button
                    type="button"
                    onClick={changeAmount}
                    className="w-fit cursor-pointer text-[12.5px] font-semibold text-(--s-link) underline underline-offset-2"
                  >
                    {t("changeAmount")}
                  </button>
                </div>

                <Field label={t(`methods.${method}.sender`)} hint={t("optional")} note={t("senderHint")} htmlFor={`${ids}-sender`}>
                  <TextInput
                    id={`${ids}-sender`}
                    dir="ltr"
                    inputMode="tel"
                    placeholder="01XXXXXXXXX"
                    className="text-start font-montserrat"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                  />
                </Field>

                {preview && file ? (
                  <div className="flex items-center gap-3 rounded-[18px] border-[1.5px] border-success/40 bg-success-soft/40 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL */}
                    <img src={preview} alt={t("receipt.previewAlt")} className="h-16 w-14 shrink-0 rounded-[10px] border border-(--s-line) object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold text-(--s-ink)" dir="auto">
                        {file.name}
                      </p>
                      <p className="text-xs text-(--s-subtle)" dir="ltr">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <IconButton aria-label={t("receipt.remove")} disabled={isPending} onClick={clearFile}>
                      <X aria-hidden />
                    </IconButton>
                  </div>
                ) : (
                  <DropZone
                    icon={ImageUp}
                    title={t("receipt.pick")}
                    hint={t("receipt.pickHint")}
                    accept={TOP_UP_PROOF_TYPES.join(",")}
                    onFiles={([picked]) => pickFile(picked)}
                    className={cn("p-[22px]", fileError && "border-destructive/60")}
                  />
                )}
                {fileError && <p className="text-xs font-medium text-destructive">{fileError}</p>}
                <Note tone="amber">{t("receipt.clarity")}</Note>
              </div>
            )}
          </div>

          <div className="flex shrink-0 gap-2 px-6 pb-6 pt-1 max-[480px]:px-[18px] max-[480px]:pb-[calc(18px+env(safe-area-inset-bottom))]">
            {done ? (
              <SellerButton variant="solid" className="flex-1" onClick={() => onOpenChange(false)}>
                {t("done.close")}
              </SellerButton>
            ) : (
              <>
                <SellerButton variant="outline" className="flex-1" disabled={isPending} onClick={() => onOpenChange(false)}>
                  {t("cancel")}
                </SellerButton>
                <SellerButton variant="solid" className="flex-1" disabled={isPending || !file} onClick={submit}>
                  {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Send className="rtl:-scale-x-100" aria-hidden />}
                  {t("submit")}
                </SellerButton>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StepNumber({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-(--s-solid) font-montserrat text-[13px] font-bold text-(--s-solid-fg)">
      {children}
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px] text-(--s-muted)">
      <span className="whitespace-nowrap">{label}</span>
      <bdi className="whitespace-nowrap font-montserrat text-[13.5px] font-semibold text-(--s-text) tabular-nums">{value}</bdi>
    </div>
  );
}

function CopyRow({
  label,
  note,
  copyLabel,
  done,
  onCopy,
  children,
}: {
  label: string;
  note?: string;
  copyLabel: string;
  done: boolean;
  onCopy: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-(--s-line) bg-(--s-tint) px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <small className="block text-[11.5px] text-(--s-subtle)">{label}</small>
        <b className="block font-montserrat text-base font-bold text-(--s-ink) tabular-nums">{children}</b>
        {note && <small className="block text-[11.5px] text-(--s-subtle)">{note}</small>}
      </div>
      <SellerButton
        variant="mini"
        size="xs"
        className={cn(done && "border-success/40 text-success [&_svg]:text-success")}
        aria-label={copyLabel}
        onClick={onCopy}
      >
        {done ? <Check aria-hidden /> : <Copy aria-hidden />}
        <span className="max-[480px]:sr-only">{copyLabel}</span>
      </SellerButton>
    </div>
  );
}
