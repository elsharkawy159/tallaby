"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ExternalLink, ImageIcon } from "lucide-react";
import { getOrderPaymentProof, type PaymentProofView } from "./payment-proof.server";

/**
 * The customer's transfer screenshot on an order (ROADMAP.md F-21p). Loads a
 * short-lived signed link when the order opens; renders nothing without one.
 */
export function OrderPaymentProof({ orderId }: { orderId: string }) {
  const t = useTranslations("orders.details.paymentProof");
  const format = useFormatter();
  const [proof, setProof] = useState<PaymentProofView>(null);

  useEffect(() => {
    let live = true;
    getOrderPaymentProof(orderId).then((view) => live && setProof(view));
    return () => {
      live = false;
    };
  }, [orderId]);

  if (!proof) return null;
  return (
    <div className="border-t pt-2">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <ImageIcon className="size-4 text-muted-foreground" aria-hidden />
        {t("title")}
        {proof.uploadedAt && (
          <span className="text-xs font-normal text-muted-foreground">
            · {format.dateTime(new Date(proof.uploadedAt), { dateStyle: "medium", timeStyle: "short" })}
          </span>
        )}
      </p>
      <a
        href={proof.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-lg border bg-muted/40"
        title={t("open")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from a private bucket */}
        <img src={proof.url} alt={t("alt")} className="max-h-72 w-full object-contain" />
        <span className="flex items-center justify-center gap-1.5 border-t px-3 py-2 text-xs font-medium text-primary group-hover:underline">
          <ExternalLink className="size-3.5" aria-hidden />
          {t("open")}
        </span>
      </a>
      <p className="mt-1.5 text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
