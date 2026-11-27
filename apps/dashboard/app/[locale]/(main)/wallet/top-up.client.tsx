"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Coins,
  Copy,
  CreditCard,
  Hourglass,
  ImageUp,
  Infinity as InfinityIcon,
  LoaderCircle,
  LockKeyhole,
  Minus,
  Plus,
  Send,
  ShieldCheck,
  Store,
  X,
  Zap,
} from "lucide-react";
import {
  MAX_OPEN_MANUAL_TOP_UPS,
  SELLER_MANUAL_TOP_UP_METHOD,
  STORE_TOP_UP_MIN_EGP,
  TALLABY_INSTAPAY_ACCOUNT,
  TOP_UP_PROOF_BUCKET,
  TOP_UP_PROOF_MAX_BYTES,
  TOP_UP_PROOF_TYPES,
  buildTopUpProofPath,
  parseStoreTopUpAmount,
} from "@workspace/lib/store-wallet";
import { useRouter } from "@/i18n/navigation";
import { DropZone, IconButton, Note, SellerButton, SellerCard } from "@/components/seller-ui";
import { toAsciiDigits } from "@/components/form/form-ui";
import { uploadOwnFolderFile } from "@/components/inputs/use-seller-upload";
import { PaymentMethodLogo } from "@/components/payments/payment-method-logo";
import { PaymentMethodLogos } from "@/components/payments/payment-method-logos";
import { cn } from "@/lib/utils";
import { FREE_ORDER_FEE_USD_CENTS, TOP_UP_MAX_USD_CENTS, TOP_UP_MIN_USD_CENTS, minorToAmount, parseUsdTopUp, quoteTopUp, type BillingState } from "@workspace/lib/billing";
import { formatNumber, formatUsdPrice } from "@/lib/i18n/format";
import { DEFAULT_TOP_UP_USD, POPULAR_TOP_UP, POPULAR_TOP_UP_USD, TOP_UP_PRESETS, TOP_UP_PRESETS_USD, TOP_UP_STEP_EGP, TOP_UP_STEP_USD, orderCountValues, ordersCovered, stepTopUpAmount, stepUsdTopUp, TOP_UP_MAX_EGP, walletMoney, walletPoundLabel } from "./store-wallet.lib";
import { startTopUp, submitManualTopUp } from "./top-up.server";
import { TutorialVideoButton } from "@/components/tutorials/tutorial-video-button.client";

/**
 * How a preset card sizes itself, by how many presets there are. The columns follow the space the
 * cards really get (the summary column squeezes it at lg), so the wrapper's parent is a @container.
 * Each basis is (100% - the gaps) / columns, taken at the larger 10px gap; flex-1 fills the rest.
 * Thresholds are the narrowest width where the longest English line and the badge still fit. Where the columns
 * don't divide the cards evenly, min-h keeps a full row square and the short last row wider than tall.
 */
const PRESET_CARD_LAYOUT: Record<number, string> = {
  // USD: 2 x 2, then 4 across from 400px (where the longest line still fits); as tall as the content, not square (owner, 2026-11-21).
  4: "min-h-[84px] basis-[calc((100%-10px)/2)] @[400px]:basis-[calc((100%-30px)/4)]",
  // 2 square, then 3 + 3 + 2, then 4 + 4 square, then 8 square.
  8: "aspect-square basis-[calc((100%-10px)/2)] @[290px]:aspect-auto @[290px]:min-h-[calc((100cqw-20px)/3)] @[290px]:basis-[calc((100%-20px)/3)] @[400px]:aspect-square @[400px]:min-h-auto @[400px]:basis-[calc((100%-30px)/4)] @[820px]:basis-[calc((100%-70px)/8)]",
  // 3 + 2, then 5 square.
  5: "min-h-[calc((100cqw-20px)/3)] basis-[calc((100%-20px)/3)] @[480px]:aspect-square @[480px]:min-h-auto @[480px]:basis-[calc((100%-40px)/5)]",
};

/** How the seller pays: Kashier's hosted page (default) or an InstaPay transfer an admin reviews (owner, 2026-11-18). */
type PayMethod = "kashier" | "instapay";
const PAY_METHODS: readonly PayMethod[] = ["kashier", "instapay"];

/** Groups a phone number 4-3-rest, easier to read off a screen and type into the InstaPay app. */
const groupNumber = (n: string) => n.replace(/^(\d{4})(\d{3})(\d+)$/, "$1 $2 $3");

/** Unicode first-strong isolate and its closing mark (keeps a Latin name in one piece inside Arabic text). */
const FSI = String.fromCharCode(0x2068);
const PDI = String.fromCharCode(0x2069);

/** The amount field shows thousands separators; the state keeps plain digits. */
const groupDigits = (digits: string) => (digits ? Number(digits).toLocaleString("en-US") : "");

/**
 * Store wallet › Top up (Claude Design "Seller Wallet v3"): the amount is
 * chosen on the page and the summary sits beside it. Two ways to pay:
 * - Kashier (default): opens Kashier's hosted page (card, Meeza, mobile
 *   wallets, Apple Pay); the wallet is credited only by Kashier's signed
 *   webhook, and Kashier sends the seller back to /wallet/top-up.
 * - InstaPay (owner, 2026-11-18): the seller transfers the same EGP total to
 *   Tallaby's InstaPay number and uploads the receipt; this records a PENDING
 *   request and the wallet is credited only when an admin approves it.
 * `below` and `side` are the page's other cards, placed here so one grid
 * holds the sticky summary.
 */
export function TopUpPanel({
  sellerId,
  disabled,
  defaultOpen,
  billing,
  below,
  side,
}: {
  /** Set once the wallet is in USD (0136): priced in dollars, paid in EGP. */
  billing?: BillingState | null;
  /** The receipt goes into this seller's own folder of the private proof bucket. */
  sellerId: string;
  disabled?: boolean;
  /** /wallet?topup=1 from the negative-balance pop-up: puts the cursor in the amount. */
  defaultOpen?: boolean;
  /** The column under the top-up card. */
  below?: React.ReactNode;
  /** Under the summary card. */
  side?: React.ReactNode;
}) {
  const t = useTranslations("storeWallet.manualTopUp");
  const tErrors = useTranslations("storeWallet.topUp.errors");
  const tInsta = useTranslations("storeWallet.manualTopUp.instapay");
  const locale = useLocale();
  const router = useRouter();
  const ids = useId();
  const amountInput = useRef<HTMLInputElement>(null);

  const usd = Boolean(billing?.usdLive);
  const presets = usd ? TOP_UP_PRESETS_USD : TOP_UP_PRESETS;
  const [amount, setAmount] = useState(usd ? String(DEFAULT_TOP_UP_USD) : "250");
  const [isPending, startTransition] = useTransition();
  // Stays true once Kashier's page is opening, so a second tap can't start a second session.
  const [leaving, setLeaving] = useState(false);
  const [method, setMethod] = useState<PayMethod>("kashier");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"number" | "amount" | null>(null);
  // The EGP total of the InstaPay request just sent, for the "under review" state.
  const [sent, setSent] = useState<string | null>(null);
  const instapay = method === "instapay";

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
  // Whichever mode: `parsed.amount` is what the seller typed, `money` is the EGP to pay.
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
  // Only a typed amount gets an error; an empty field just shows the limits.
  // The shared errors name EGP limits; in USD mode the limits line says it right.
  const amountError = !parsed.success && value > 0 && parsed.error !== "invalid" ? (usd ? t("limitsUsd", limitValues) : tErrors(parsed.error, limitValues)) : null;
  const busy = isPending || leaving;
  const canStart = parsed.success && !disabled && !busy && !(instapay && sent);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  // From the negative-balance pop-up (/wallet?topup=1): straight to the amount.
  useEffect(() => {
    if (defaultOpen && !disabled) amountInput.current?.focus({ preventScroll: true });
  }, [defaultOpen, disabled]);

  // Back from Kashier with the browser's Back button: the page comes from the back-forward cache.
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => event.persisted && setLeaving(false);
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const copy = async (text: string, what: "number" | "amount") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied((c) => (c === what ? null : c)), 1600);
    } catch {
      toast.error(tInsta("copyFailed"));
    }
  };

  const pickFile = (picked: File | undefined) => {
    if (!picked) return;
    if (!(TOP_UP_PROOF_TYPES as readonly string[]).includes(picked.type)) return setFileError(tInsta("receipt.wrongType"));
    if (picked.size > TOP_UP_PROOF_MAX_BYTES) return setFileError(tInsta("receipt.tooLarge"));
    setFileError(null);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  const sendAnother = () => {
    setSent(null);
    setFileError(null);
    clearFile();
  };

  /** InstaPay: upload the receipt into the seller's own folder, then record a pending request. */
  const submitTransfer = () => {
    if (!parsed.success) return;
    if (!file) return setFileError(tInsta("receipt.required"));
    const path = buildTopUpProofPath(sellerId, crypto.randomUUID(), file.type);
    if (!path) return setFileError(tInsta("receipt.wrongType"));
    const total = money;
    startTransition(async () => {
      try {
        await uploadOwnFolderFile(file, { bucket: TOP_UP_PROOF_BUCKET, path });
      } catch (error) {
        console.error("Top-up receipt upload failed:", error);
        setFileError(tInsta("receipt.uploadFailed"));
        return;
      }
      // The typed amount (dollars on a USD wallet); the server validates and prices it again.
      const result = await submitManualTopUp({ method: SELLER_MANUAL_TOP_UP_METHOD, amount: parsed.amount, proofPath: path });
      if (!result.success) {
        const error = result.error;
        toast.error(
          error === "too_small" || error === "too_large"
            ? tErrors(error, limitValues)
            : tInsta(`errors.${error}`, { max: MAX_OPEN_MANUAL_TOP_UPS }),
        );
        return;
      }
      setSent(total);
      clearFile();
      // The pending request shows in "Top-up requests" and beside the balance.
      router.refresh();
    });
  };

  const start = () => {
    if (!parsed.success || disabled) return amountInput.current?.focus();
    if (busy) return;
    if (instapay) return submitTransfer();
    startTransition(async () => {
      // The typed amount (dollars on a USD wallet); the server validates and quotes it again.
      const result = await startTopUp(amount);
      if (!result.success) {
        toast.error(tErrors(result.error, limitValues));
        return;
      }
      setLeaving(true);
      window.location.assign(result.sessionUrl);
    });
  };

  const total = parsed.success ? money : "—";

  // Each method's details, shown inside its own card once chosen.
  const kashierDetails = (
    <div className="flex min-w-0 flex-col gap-2.5 p-4">
      <PaymentMethodLogos />
      <p className="text-pretty text-[13.5px] font-semibold text-(--s-ink)">{t("panel.payMethods")}</p>
      <p className="text-pretty text-xs text-(--s-subtle)">{t("panel.payHint")}</p>
      <p className="mt-0.5 flex items-center gap-1.5 border-t border-(--s-line-soft) pt-2.5 text-xs font-semibold text-(--s-muted)">
        <LockKeyhole className="size-3.5 shrink-0 text-success" aria-hidden />
        {t("panel.secure")}
      </p>
    </div>
  );
  const sentDetails = sent && (
    <div role="status" className="flex min-w-0 flex-col items-center gap-2.5 px-4 py-5 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-accent-soft text-accent-ink">
        <Hourglass className="size-[26px]" aria-hidden />
      </span>
      <p className="text-[15px] font-bold text-(--s-ink)">{tInsta("done.title")}</p>
      <p className="max-w-[360px] text-pretty text-[13px] text-(--s-muted)">
        {tInsta("done.body", { amount: sent })}
      </p>
      <SellerButton variant="outline" size="xs" className="mt-1" onClick={sendAnother}>
        {tInsta("done.again")}
      </SellerButton>
    </div>
  );
  const transferDetails = (
    <fieldset disabled={disabled || busy} className="flex min-w-0 flex-col gap-3.5 p-4">
      <legend className="sr-only">{t("panel.methods.instapay.name")}</legend>
      <div className="flex flex-col gap-2">
        <CopyRow
          label={tInsta("sendAmount")}
          copyLabel={tInsta("copyAmount")}
          done={copied === "amount"}
          disabled={!parsed.success}
          onCopy={() => parsed.success && copy(String(quote ? quote.totalPiastres / 100 : Number(parsed.amount)), "amount")}
        >
          <bdi>{total}</bdi>
        </CopyRow>
        <CopyRow
          label={tInsta("to")}
          // The masked Latin name in a bidi isolate, so its trailing asterisks stay on its right in Arabic.
          note={tInsta("holder", { name: `${FSI}${TALLABY_INSTAPAY_ACCOUNT.holder}${PDI}` })}
          copyLabel={tInsta("copyNumber")}
          done={copied === "number"}
          onCopy={() => copy(TALLABY_INSTAPAY_ACCOUNT.number, "number")}
        >
          <bdi dir="ltr">{groupNumber(TALLABY_INSTAPAY_ACCOUNT.number)}</bdi>
        </CopyRow>
      </div>

      {/* No sender phone field (owner, 2026-11-27): the receipt is enough; the server still accepts one from old clients. */}
      {preview && file ? (
        <div className="flex items-center gap-3 rounded-[18px] border-[1.5px] border-success/40 bg-success-soft/40 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL */}
          <img src={preview} alt={tInsta("receipt.previewAlt")} className="h-16 w-14 shrink-0 rounded-[10px] border border-(--s-line) object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-bold text-(--s-ink)" dir="auto">
              {file.name}
            </p>
            <p className="text-xs text-(--s-subtle)" dir="ltr">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          <IconButton aria-label={tInsta("receipt.remove")} onClick={clearFile}>
            <X aria-hidden />
          </IconButton>
        </div>
      ) : (
        <DropZone
          icon={ImageUp}
          title={tInsta("receipt.pick")}
          hint={tInsta("receipt.pickHint")}
          accept={TOP_UP_PROOF_TYPES.join(",")}
          disabled={disabled || busy}
          onFiles={([picked]) => pickFile(picked)}
          className={cn("p-[22px]", fileError && "border-destructive/60")}
        />
      )}
      {fileError && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {fileError}
        </p>
      )}
      <Note tone="amber">{tInsta("receipt.clarity")}</Note>
      <p className="flex items-start gap-1.5 border-t border-(--s-line-soft) pt-2.5 text-xs font-semibold text-(--s-muted)">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-success" aria-hidden />
        {tInsta("reviewNote")}
      </p>
    </fieldset>
  );

  return (
    <div data-clarity-mask="true" className="grid grid-cols-[minmax(0,1fr)_360px] grid-rows-[auto_1fr] items-start gap-x-5 gap-y-4 max-[1180px]:grid-cols-1 max-[1180px]:grid-rows-none">
      <SellerCard
        id="topup"
        aria-labelledby={`${ids}-title`}
        className="sui-rise flex scroll-mt-24 flex-col gap-[18px] px-6 pb-6 pt-[22px] [animation-delay:.05s] max-[720px]:gap-4 max-[720px]:px-4 max-[720px]:pb-5 max-[720px]:pt-[18px]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={`${ids}-title`} className="text-[17px] font-bold leading-normal text-(--s-ink)">
              {t("panel.title")}
            </h2>
            <p className="text-pretty text-[13px] text-(--s-subtle)">{t("panel.subtitle")}</p>
          </div>
          <TutorialVideoButton video="T-08" />
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
                      // USD wallet: the dollars credited lead, big; the EGP the seller pays sits under them, smaller,
                      // so it reads as "topping up dollars, paying in pounds" (owner, 2026-11-27).
                      <>
                        <bdi dir="ltr" className="font-montserrat text-xl/7 font-extrabold text-(--s-ink) tabular-nums">
                          ${preset.toLocaleString("en-US")}
                        </bdi>
                        <bdi className="whitespace-nowrap font-montserrat text-[12.5px]/5 font-semibold text-(--s-muted) tabular-nums">
                          {walletMoney(presetQuote.totalPiastres / 100, "EGP", locale)}
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

        <section aria-labelledby={`${ids}-pay`} className="flex min-w-0 flex-col gap-3">
          <h3 id={`${ids}-pay`} className="flex items-center gap-2.5 text-[13.5px] font-bold text-(--s-text)">
            <StepNumber>2</StepNumber>
            {t("panel.pay")}
          </h3>
          <fieldset disabled={disabled || busy} className="ms-10 flex min-w-0 flex-col gap-2.5 max-[720px]:ms-0">
            <legend className="sr-only">{t("panel.pay")}</legend>
            {/* Each method is one card: its radio row, then its details right under it once chosen, so the
                details never read as a third option on a phone (owner, 2026-11-21). */}
            {PAY_METHODS.map((m) => {
              const selected = method === m;
              return (
                <div
                  key={m}
                  className={cn(
                    "min-w-0 rounded-[18px] border-[1.5px] bg-(--s-surface) transition-[border-color,box-shadow] duration-150",
                    selected ? "border-(--s-primary) shadow-[0_0_0_3px_var(--s-focus-soft)]" : "border-(--s-field) hover:border-(--s-outline)",
                  )}
                >
                  <label
                    className={cn(
                      "relative flex cursor-pointer items-center gap-3 rounded-[16.5px] p-3.5 transition-colors duration-150 has-checked:bg-(--s-tint) has-focus-visible:outline-[3px] has-focus-visible:outline-offset-2 has-focus-visible:outline-(--s-focus) has-disabled:cursor-not-allowed has-disabled:opacity-60",
                      selected && "rounded-b-none",
                    )}
                  >
                    <input
                      type="radio"
                      name={`${ids}-method`}
                      value={m}
                      className="peer absolute size-px opacity-0"
                      checked={selected}
                      onChange={() => setMethod(m)}
                    />
                    {m === "instapay" ? (
                      <PaymentMethodLogo method="instapay" label={t("panel.methods.instapay.name")} className="size-[42px] rounded-[13px] border-(--s-line)" />
                    ) : (
                      <span aria-hidden className="grid size-[42px] shrink-0 place-items-center rounded-[13px] border border-(--s-line) bg-(--s-tint) text-(--s-primary)">
                        <CreditCard className="size-5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <b className="block text-sm font-bold text-(--s-ink)">{t(`panel.methods.${m}.name`)}</b>
                      <small className="block text-pretty text-xs text-(--s-subtle)">{t(`panel.methods.${m}.hint`)}</small>
                    </span>
                    <span
                      aria-hidden
                      className="size-5 shrink-0 rounded-full border-2 border-(--s-field-strong) transition-all duration-150 peer-checked:border-[6px] peer-checked:border-(--s-primary)"
                    />
                  </label>
                  {selected && <MethodDetails>{m === "kashier" ? kashierDetails : sent ? sentDetails : transferDetails}</MethodDetails>}
                </div>
              );
            })}
          </fieldset>
        </section>
      </SellerCard>

      {/* Second in the DOM, so one column puts the summary and its button right under the amount. */}
      <aside className="sui-rise sticky top-[88px] row-span-2 flex min-w-0 flex-col gap-3.5 [animation-delay:.08s] max-[1180px]:static max-[1180px]:row-span-1">
        <SellerCard aria-labelledby={`${ids}-summary`} className="flex flex-col gap-3.5 p-[22px] max-[720px]:p-4">
          <h3 id={`${ids}-summary`} className="text-[15.5px] font-bold text-(--s-ink)">
            {t("panel.summary.title")}
          </h3>
          <SummaryRow label={t("panel.summary.amount")} value={usd ? credited : total} />
          {quote && quote.taxPiastres > 0 && (
            <SummaryRow label={t("panel.summary.tax")} value={walletMoney(quote.taxPiastres / 100, "EGP", locale)} />
          )}
          {!usd && <SummaryRow label={t("panel.summary.fee")} value={t("panel.summary.free")} />}
          <div className="flex items-baseline justify-between gap-3 rounded-[18px] border border-(--tallaby-amber-100) bg-accent-soft p-4 dark:border-transparent">
            <span className="whitespace-nowrap text-[13.5px] font-bold text-accent-ink">{t(instapay ? "panel.summary.totalTransfer" : "panel.summary.total")}</span>
            <bdi className="whitespace-nowrap font-montserrat text-[26px] font-extrabold leading-none text-(--s-ink) tabular-nums">{total}</bdi>
          </div>
          <SellerButton className="h-[52px] w-full text-[15px]" disabled={!canStart} aria-busy={busy || undefined} onClick={start}>
            {busy ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden />
                {t(instapay ? "panel.sending" : "panel.redirecting")}
              </>
            ) : instapay ? (
              <>
                <Send className="rtl:-scale-x-100" aria-hidden />
                {t("panel.ctaInstapay")}
              </>
            ) : (
              <>
                <LockKeyhole aria-hidden />
                {t("panel.cta")}
                <ArrowLeft className="ltr:rotate-180" aria-hidden />
              </>
            )}
          </SellerButton>
          <ul className="flex flex-col gap-2 border-t border-(--s-line-soft) pt-3.5 text-[12.5px] text-(--s-muted)">
            <li className="flex items-center gap-2">
              {instapay ? <ShieldCheck className="size-[15px] shrink-0 text-success" aria-hidden /> : <Zap className="size-[15px] shrink-0 text-success" aria-hidden />}
              {t(instapay ? "panel.trust.review" : "panel.trust.instant")}
            </li>
            <li className="flex items-center gap-2">
              <InfinityIcon className="size-[15px] shrink-0 text-success" aria-hidden />
              {usd ? t("panel.trust.noExpiry") : t("panel.trust.noExpiryEgp")}
            </li>
            {usd && (
              <>
                <li className="flex items-center gap-2">
                  <Coins className="size-[15px] shrink-0 text-success" aria-hidden />
                  {/* In US cents, from the Free plan's per-order fee (owner, 2026-11-27). */}
                  {t("panel.trust.feeUsd", { count: FREE_ORDER_FEE_USD_CENTS, formatted: formatNumber(FREE_ORDER_FEE_USD_CENTS, locale) })}
                </li>
                <li className="flex items-center gap-2">
                  <Store className="size-[15px] shrink-0 text-success" aria-hidden />
                  {t("panel.trust.activeForLife")}
                </li>
              </>
            )}
          </ul>
        </SellerCard>
        {side}
      </aside>

      <div className="flex min-w-0 flex-col gap-4">{below}</div>

    </div>
  );
}

/** A chosen method's details, attached under its radio row; it fades in (none with reduced motion). */
function MethodDetails({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 border-t border-(--s-line-soft) animate-[ai-fade-up_.22s_cubic-bezier(.2,.7,.2,1)] motion-reduce:animate-none">
      {children}
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
  disabled,
  onCopy,
  children,
}: {
  label: string;
  note?: string;
  copyLabel: string;
  done: boolean;
  disabled?: boolean;
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
        disabled={disabled}
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
