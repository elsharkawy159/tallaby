"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "@/i18n/navigation";
import { formatPrice } from "@workspace/lib";
import { reportManualPaymentSent } from "@/actions/order";
import {
  getManualPaymentMethodConfig,
  type ManualPaymentMethod,
} from "@/lib/manual-payment-methods";

interface ManualPaymentInstructionsProps {
  orderId: string;
  method: ManualPaymentMethod;
  amount: string;
  currency: string;
}

export function ManualPaymentInstructions({
  orderId,
  method,
  amount,
}: ManualPaymentInstructionsProps) {
  const t = useTranslations("checkout");
  const tToast = useTranslations("toast");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const config = getManualPaymentMethodConfig(method);

  if (!config) {
    return null;
  }

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await reportManualPaymentSent(orderId);
      if (result.success && result.data) {
        router.push(result.data.orderPagePath);
      } else {
        toast.error(result.error || tToast("somethingWentWrong"));
      }
    });
  };

  return (
    <Card className="rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden pt-0">
      <div className="bg-linear-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
        <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
          <Image
            src={config.logo}
            alt={t(config.titleKey as any)}
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          {t(config.titleKey as any)}
        </CardTitle>
      </div>
      <CardContent className="space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {config.qrImage && (
            <div className="mx-auto md:mx-0 shrink-0">
              <Image
                src={config.qrImage}
                alt={t(config.titleKey as any)}
                width={220}
                height={220}
                className="rounded-lg border border-gray-200"
              />
            </div>
          )}

          <div className="flex-1 space-y-3 w-full">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 md:p-4">
              <p className="text-xs md:text-sm text-gray-600">
                {t("amountToSend")}
              </p>
              <p
                className="text-lg md:text-2xl font-bold text-primary"
                dangerouslySetInnerHTML={{
                  __html: formatPrice(Number(amount), locale, "lg"),
                }}
              />
            </div>

            {config.isPlaceholder ? (
              <p className="text-xs md:text-sm text-gray-600">
                {t("eCashPlaceholder")}
              </p>
            ) : (
              <>
                {config.accountLabel && (
                  <div className="text-xs md:text-sm">
                    <span className="font-medium text-gray-700">
                      {method === "instapay"
                        ? t("instapayAccount")
                        : t("vodafoneCashNumber")}
                      :
                    </span>{" "}
                    <span className="font-mono text-gray-900">
                      {config.accountLabel}
                    </span>
                  </div>
                )}

                {config.paymentLink && (
                  <div className="text-xs md:text-sm">
                    <span className="font-medium text-gray-700">
                      {t("instapayLink")}:
                    </span>{" "}
                    <a
                      href={config.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline break-all"
                    >
                      {config.paymentLink}
                    </a>
                  </div>
                )}

                {method === "instapay" && (
                  <p className="text-xs text-gray-400">
                    {t("poweredByInstaPay")}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-3">
          <p className="text-xs md:text-sm text-gray-600">
            {t("paymentInstructionsHint")}
          </p>
          <div className="flex flex-col md:flex-row gap-2 md:gap-3">
            <Button
              type="button"
              disabled={isPending}
              onClick={handleConfirm}
              className="flex-1"
            >
              {t("completed")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
