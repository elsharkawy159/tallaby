"use client";

import { useState, useTransition } from "react";
import { Download, ImageIcon, LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { localizedText, parseCustomerInputsSnapshot } from "@workspace/lib/products/customer-fields";
import { cn } from "@/lib/utils";
import { getOrderLineUploads, type CustomerUploadLinks } from "./customer-inputs.server";

/**
 * What the customer filled for one order line (Customer requirements, F-91):
 * each field's name and value (text exactly as written, rendered as text), the
 * chosen option, and the photos behind a "Show photos" button that asks the
 * server for short-lived signed links (private bucket).
 */
export function OrderLineCustomerInputs({ orderId, orderItemId, value }: { orderId: string; orderItemId: string; value: unknown }) {
  const t = useTranslations("orders.customerInputs");
  const locale = useLocale();
  const snapshot = parseCustomerInputsSnapshot(value);
  const [links, setLinks] = useState<CustomerUploadLinks | null>(null);
  const [pending, startTransition] = useTransition();
  if (!snapshot) return null;

  const photoCount = snapshot.lines.reduce((sum, line) => sum + (line.files?.length ?? 0), 0);
  const show = () =>
    startTransition(async () => {
      setLinks(await getOrderLineUploads(orderId, orderItemId));
    });

  return (
    <div className="mt-1.5 grid gap-1.5 rounded-xl border border-(--s-line) bg-(--s-surface-2) p-2.5">
      <p className="text-[11.5px] font-bold text-(--s-subtle)">{t("title")}</p>
      <dl className="grid gap-1 text-xs">
        {snapshot.lines.map((line) => (
          <div key={line.fieldId} className="flex min-w-0 flex-wrap gap-x-1.5">
            <dt className="shrink-0 text-(--s-subtle)">{localizedText(line.label, locale)}:</dt>
            <dd className="min-w-0 font-semibold break-words whitespace-pre-wrap text-(--s-text)" dir="auto">
              {line.type === "text" && line.text}
              {line.type === "choice" && localizedText(line.option?.label, locale)}
              {line.type === "image" && t("photos", { count: line.files?.length ?? 0 })}
              {line.extraPiastres > 0 && (
                <span className="ms-1.5 font-normal text-(--s-subtle)">{t("extra")}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {photoCount > 0 &&
        (links ? (
          links.length ? (
            <ul className="flex flex-wrap gap-2 pt-1">
              {links.map((link, index) => (
                <li key={link.path} className="grid gap-1">
                  <a href={link.view} target="_blank" rel="noopener noreferrer" className="block size-20 overflow-hidden rounded-lg border border-(--s-line) bg-(--s-surface)">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a short-lived private link */}
                    <img src={link.view} alt={t("photoAlt", { number: index + 1 })} className="size-full object-cover" />
                  </a>
                  {link.download && (
                    <a href={link.download} className="inline-flex items-center gap-1 text-[11px] font-semibold text-(--s-primary) hover:underline">
                      <Download className="size-3" aria-hidden />
                      {t("download")}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-(--s-subtle)">{t("photosUnavailable")}</p>
          )
        ) : (
          <button
            type="button"
            onClick={show}
            disabled={pending}
            className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-full border border-(--s-field) bg-(--s-surface) px-3 py-1.5 text-xs font-bold text-(--s-text) hover:border-(--s-field-strong) disabled:opacity-60",
            )}
          >
            {pending ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <ImageIcon className="size-3.5" aria-hidden />}
            {t("showPhotos", { count: photoCount })}
          </button>
        ))}
    </div>
  );
}
