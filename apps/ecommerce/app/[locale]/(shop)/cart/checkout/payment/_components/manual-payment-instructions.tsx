"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { BadgeCheck, Check, Copy, ExternalLink, LoaderCircle, Store, UserRound } from "lucide-react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "@/i18n/navigation";
import { formatPrice } from "@workspace/lib";
import { reportManualPaymentSent } from "@/actions/order";
import { compressImage } from "@/lib/compress-image.client";
import { PaymentProofPicker } from "./payment-proof-picker";
import {
  getManualPaymentMethodConfig,
  type ManualPaymentMethod,
  type PaymentRecipient,
  type PaymentRecipientId,
} from "@/lib/manual-payment-methods";

interface ManualPaymentInstructionsProps {
  orderId: string;
  orderNumber: string | null;
  method: ManualPaymentMethod;
  amount: string;
  currency: string;
  /** Where the money goes: the store's own details, or Tallaby's account. */
  recipient: PaymentRecipient | null;
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
      <Button type="button" variant="outline" size="sm" onClick={copy} className="shrink-0 gap-1.5">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}

export function ManualPaymentInstructions({
  orderId,
  orderNumber,
  method,
  amount,
  recipient,
}: ManualPaymentInstructionsProps) {
  const t = useTranslations("checkout");
  const tr = useTranslations("checkout.transfer");
  const tToast = useTranslations("toast");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [proof, setProof] = useState<File | null>(null);
  const config = getManualPaymentMethodConfig(method);

  if (!config || !recipient) {
    return null;
  }

  const methodName = t(config.titleKey as any);
  const toStore = recipient.collector === "seller";

  const handleConfirm = () => {
    startTransition(async () => {
      const body = new FormData();
      body.set("orderId", orderId);
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
    <Card className="rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden py-0 gap-0">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-100 px-4 py-4 md:px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-gray-200 bg-white">
          <Image src={config.logo} alt={methodName} title={methodName} width={30} height={30} className="size-7.5 object-contain" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm md:text-lg font-bold text-gray-900">{tr("title", { method: methodName })}</h2>
          <p className="flex items-center gap-1.5 text-xs text-gray-600">
            {toStore ? <Store className="size-3.5" aria-hidden /> : <BadgeCheck className="size-3.5" aria-hidden />}
            {toStore ? tr("paidToStore") : tr("paidToTallaby")}
          </p>
        </div>
      </div>

      <CardContent className="space-y-5 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <p className="text-xs text-gray-600">{t("amountToSend")}</p>
            <p
              className="text-xl md:text-2xl font-bold text-primary"
              dangerouslySetInnerHTML={{ __html: formatPrice(Number(amount), locale, "lg") }}
            />
          </div>
          {orderNumber && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
              <p className="text-xs text-gray-600">{tr("orderNumber")}</p>
              <bdi dir="ltr" className="block font-mono text-lg md:text-xl font-bold text-gray-900">
                {orderNumber}
              </bdi>
              <p className="mt-0.5 text-[11px] text-gray-500">{tr("referenceHint")}</p>
            </div>
          )}
        </div>

        {recipient.isPlaceholder ? (
          <p className="text-xs md:text-sm text-gray-600">{t("eCashPlaceholder")}</p>
        ) : (
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <div className="flex-1 space-y-2.5">
              <h3 className="text-sm font-semibold text-gray-900">{tr("sendTo")}</h3>
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
              {recipient.paymentLink && (
                <Button asChild variant="outline" className="w-full gap-2">
                  <a href={recipient.paymentLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" aria-hidden />
                    {tr("openLink")}
                  </a>
                </Button>
              )}
              {recipient.holderName && (
                <p className="text-xs leading-relaxed text-gray-500">{tr("checkName", { method: methodName })}</p>
              )}
            </div>
            {recipient.qrImage && (
              <div className="mx-auto shrink-0 text-center md:mx-0">
                <Image
                  src={recipient.qrImage}
                  alt={methodName}
                  title={methodName}
                  width={180}
                  height={180}
                  className="rounded-xl border border-gray-200"
                />
                <p className="mt-1.5 text-xs text-gray-500">{tr("scanQr")}</p>
              </div>
            )}
          </div>
        )}

        <ol className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-xs md:text-sm text-gray-700">
          {(["send", "check", "confirm"] as const).map((step, i) => (
            <li key={step} className="flex gap-2.5">
              <span className="grid size-5 shrink-0 place-items-center rounded-full border border-gray-300 bg-white text-[11px] font-bold text-primary">
                {i + 1}
              </span>
              {tr(`steps.${step}`, { method: methodName })}
            </li>
          ))}
        </ol>

        {!recipient.isPlaceholder && <PaymentProofPicker file={proof} onChange={setProof} disabled={isPending} />}

        <div className="space-y-2.5 border-t border-gray-200 pt-4">
          <Button type="button" size="lg" disabled={isPending} onClick={handleConfirm} className="w-full gap-2">
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
            {tr("sent")}
          </Button>
          <p className="text-center text-xs text-gray-500">
            {toStore ? tr("storeWillConfirm") : t("paymentInstructionsHint")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
