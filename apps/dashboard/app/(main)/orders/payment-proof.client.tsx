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
    <div data-clarity-mask="true" className="border-t border-(--s-line-soft) pt-2">
      <p className="mb-2 flex flex-wrap items-center gap-x-1.5 text-[13px] font-semibold text-(--s-text)">
        <ImageIcon className="size-4 text-(--s-subtle)" aria-hidden />
        {t("title")}
        {proof.uploadedAt && (
          <span className="text-xs font-normal text-(--s-subtle)">
            {format.dateTime(new Date(proof.uploadedAt), { dateStyle: "medium", timeStyle: "short" })}
          </span>
        )}
      </p>
      <a
        href={proof.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-2xl border border-(--s-line) bg-(--s-tint)"
        title={t("open")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from a private bucket */}
        <img src={proof.url} alt={t("alt")} className="max-h-72 w-full object-contain" />
        <span className="flex min-h-10 items-center justify-center gap-1.5 border-t border-(--s-line-soft) px-3 py-2 text-xs font-semibold text-(--s-link) group-hover:underline">
          <ExternalLink className="size-3.5" aria-hidden />
          {t("open")}
        </span>
      </a>
      <p className="mt-1.5 text-xs text-(--s-subtle)">{t("hint")}</p>
    </div>
  );
}
