"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, LoaderCircle, Upload } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "@/i18n/navigation";
import { reportManualPaymentSent } from "@/actions/order";
import { compressImage } from "@/lib/compress-image.client";
import { PaymentProofPicker } from "@/app/[locale]/(shop)/cart/checkout/payment/_components/payment-proof-picker";

/**
 * Order page, while a manual transfer waits for confirmation: attach (or
 * replace) the transfer screenshot the seller sees (ROADMAP.md F-21p).
 */
export function OrderPaymentProof({
  orderId,
  accessToken,
  hasProof,
}: {
  orderId: string;
  accessToken?: string;
  hasProof: boolean;
}) {
  const t = useTranslations("checkout.transfer.proof");
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  const send = () => {
    if (!file) return;
    startTransition(async () => {
      const body = new FormData();
      body.set("orderId", orderId);
      if (accessToken) body.set("accessToken", accessToken);
      body.set("proof", await compressImage(file));
      const result = await reportManualPaymentSent(body);
      if (result.success) {
        toast.success(t("sent"));
        setFile(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-2.5 rounded-lg bg-white/70 p-3 text-gray-800">
      {hasProof && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-green-700">
          <CheckCircle2 className="size-4" aria-hidden />
          {t("attached")}
        </p>
      )}
      <PaymentProofPicker file={file} onChange={setFile} disabled={isPending} />
      {file && (
        <Button type="button" size="sm" onClick={send} disabled={isPending} className="gap-1.5">
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {hasProof ? t("replace") : t("send")}
        </Button>
      )}
    </div>
  );
}
