"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronDown, Copy, ExternalLink, LoaderCircle, UserRound } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { currencyDefaultLabel, formatPrice } from "@workspace/lib";
import { useRouter } from "@/i18n/navigation";
import { reportManualPaymentSent } from "@/actions/order";
import { compressImage } from "@/lib/compress-image.client";
import {
  getManualPaymentMethodConfig,
  type ManualPaymentMethod,
  type PaymentRecipient,
  type PaymentRecipientId,
} from "@/lib/manual-payment-methods";
import { PaymentProofPicker } from "./payment-proof-picker";

/** Outer frame of one way to pay; the open one is highlighted. */
export function paymentOptionClass(open: boolean) {
  return cn(
    "overflow-hidden rounded-2xl border-2 bg-white transition-colors",
    open ? "border-primary shadow-sm" : "border-gray-200 hover:border-gray-300",
  );
}

/** The tappable row of a payment option (link, button or plain header). */
export const paymentOptionHeaderClass =
  "flex min-h-16 w-full items-center gap-3 px-4 py-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:opacity-60 md:px-5";

export function PaymentOptionHeaderBody({ icon, name, action }: { icon: ReactNode; name: ReactNode; action?: ReactNode }) {
  return (
    <>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-gray-200 bg-white">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm md:text-base font-bold text-gray-900">{name}</span>
        {action && <span className="block text-sm md:text-base font-semibold text-primary">{action}</span>}
      </span>
    </>
  );
}

/** A rich-text tag that renders `amount` with the store's currency label ("150 EGP"). */
export function usePriceTag(amount: number, currency: string) {
  const locale = useLocale();
  const html = formatPrice(amount, locale, "sm", currencyDefaultLabel(currency));
  return function PriceTag() {
    return <bdi dangerouslySetInnerHTML={{ __html: html }} />;
  };
}

/** "01012345678" → "0101 234 5678"; IBAN in groups of 4. Display only; copy uses the raw value. */
function formatId({ kind, value }: PaymentRecipientId): string {
  if (kind === "iban") return value.replace(/(.{4})/g, "$1 ").trim();
  if ((kind === "walletNumber" || kind === "instapayPhone") && /^\d{11}$/.test(value)) {
    return `${value.slice(0, 4)} ${value.slice(4, 7)} ${value.slice(7)}`;
  }
  return value;
}

function CopyRow({ label, value, display }: { label: string; value: string; display: string }) {
  const t = useTranslations("checkout.transfer");
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(t("copied"));
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t("copyFailed"));
    }
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <bdi dir="ltr" className="block truncate font-mono text-sm md:text-base font-semibold text-gray-900">
          {display}
        </bdi>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={copy} className="min-h-11 shrink-0 gap-1.5">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}

/**
 * One manual transfer (InstaPay or a wallet) as a tappable card. With an
 * InstaPay payment link the card is the link itself: tapping it opens the
 * seller's link in a new tab and turns the card into the receipt form.
 * Otherwise tapping it shows where to send the money, then the same form.
 */
export function TransferPaymentCard({
  orderId,
  orderNumber,
  method,
  amount,
  currency,
  recipient,
  deposit = false,
  open,
  onOpenChange,
}: {
  orderId: string;
  orderNumber: string | null;
  method: ManualPaymentMethod;
  /** Amount to send, in currency units. */
  amount: number;
  currency: string;
  recipient: PaymentRecipient;
  /** A COD order's deposit (F-21): reported with `purpose=deposit` and `method`. */
  deposit?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("checkout");
  const tr = useTranslations("checkout.transfer");
  const tToast = useTranslations("toast");
  const router = useRouter();
  const panelId = useId();
  const priceTag = usePriceTag(amount, currency);
  const [isPending, startTransition] = useTransition();
  const [proof, setProof] = useState<File | null>(null);
  const [linkOpened, setLinkOpened] = useState(false);
  const config = getManualPaymentMethodConfig(method);
  if (!config) return null;

  const methodName = t(config.titleKey as never);
  const link = recipient.isPlaceholder ? undefined : recipient.paymentLink;
  const showBody = open && (!link || linkOpened);
  const headerBody = (
    <PaymentOptionHeaderBody
      icon={<Image src={config.logo} alt="" width={30} height={30} className="size-7.5 object-contain" />}
      name={methodName}
      action={tr.rich("payAmount", { amount: priceTag })}
    />
  );

  const handleConfirm = () => {
    startTransition(async () => {
      const body = new FormData();
      body.set("orderId", orderId);
      if (deposit) {
        body.set("purpose", "deposit");
        body.set("method", method);
      }
      if (proof) body.set("proof", await compressImage(proof));
      const result = await reportManualPaymentSent(body);
      if (result.success && result.data) {
        router.push(result.data.orderPagePath);
      } else {
        toast.error(result.error || tToast("somethingWentWrong"));
      }
    });
  };

  return (
    <div className={paymentOptionClass(open)}>
      {link && !showBody ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            setLinkOpened(true);
            onOpenChange(true);
          }}
          className={paymentOptionHeaderClass}
        >
          {headerBody}
          <ExternalLink className="size-5 shrink-0 text-primary" aria-hidden />
          <span className="sr-only">{tr("newTab")}</span>
        </a>
      ) : link ? (
        <div className={paymentOptionHeaderClass}>{headerBody}</div>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onOpenChange(!open)}
          className={paymentOptionHeaderClass}
        >
          {headerBody}
          <ChevronDown className={cn("size-5 shrink-0 text-gray-500 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      )}

      {showBody && (
        <div id={panelId} className="space-y-4 border-t border-gray-200 px-4 py-4 md:px-5">
          {!link &&
            (recipient.isPlaceholder ? (
              <p className="text-sm text-gray-600">{t("eCashPlaceholder")}</p>
            ) : (
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex-1 space-y-2.5">
                  {recipient.holderName && (
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <UserRound className="size-4.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{tr("recipientName")}</p>
                        <p className="truncate text-sm md:text-base font-semibold text-gray-900">{recipient.holderName}</p>
                      </div>
                    </div>
                  )}
                  {recipient.ids.map((id) => (
                    <CopyRow key={id.kind} label={tr(`ids.${id.kind}`)} value={id.value} display={formatId(id)} />
                  ))}
                </div>
                {recipient.qrImage && (
                  <div className="mx-auto shrink-0 text-center md:mx-0">
                    <Image
                      src={recipient.qrImage}
                      alt={methodName}
                      title={methodName}
                      width={160}
                      height={160}
                      className="rounded-xl border border-gray-200"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">{tr("scanQr")}</p>
                  </div>
                )}
              </div>
            ))}

          {currency !== "EGP" && <p className="text-xs leading-relaxed text-gray-500">{tr("foreignCurrencyHint")}</p>}

          {!recipient.isPlaceholder && (
            <PaymentProofPicker file={proof} onChange={setProof} disabled={isPending} title={tr("receiptPrompt")} />
          )}

          <div className="space-y-2">
            <Button type="button" size="lg" disabled={isPending} onClick={handleConfirm} className="min-h-12 w-full gap-2">
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              {tr("sent")}
            </Button>
            {orderNumber && (
              <p className="text-center text-xs text-gray-500">
                {tr.rich("orderNote", {
                  number: orderNumber,
                  num: (chunks) => (
                    <bdi dir="ltr" className="font-mono font-semibold text-gray-700">
                      {chunks}
                    </bdi>
                  ),
                })}
              </p>
            )}
            <p className="text-center text-xs text-gray-500">
              {recipient.collector === "seller" ? tr("storeWillConfirm") : t("paymentInstructionsHint")}
            </p>
            {link && (
              <p className="text-center">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ExternalLink className="size-4" aria-hidden />
                  {tr("openLinkAgain")}
                  <span className="sr-only">{tr("newTab")}</span>
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
