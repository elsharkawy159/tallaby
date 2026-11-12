"use client";

import { useLocale, useTranslations } from "next-intl";
import { localizedText, parseCustomerInputsSnapshot } from "@workspace/lib/products/customer-fields";
import { cn } from "@/lib/utils";

/**
 * What the customer filled for a line's "Customer requirements" (F-91): text
 * and choices as written (always as text, never HTML), photos as small
 * thumbnails when `views` has their short-lived links, else "N photos attached".
 * Shared by the store cart, the checkout summary and the order pages.
 */
export function CustomerInputsLines({
  value,
  views,
  className,
}: {
  value: unknown;
  /** Signed links to the customer's own photos (their cart only). */
  views?: Record<string, string>;
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("customerFields");
  const snapshot = parseCustomerInputsSnapshot(value);
  if (!snapshot) return null;
  return (
    <dl className={cn("grid gap-1 text-xs", className)}>
      {snapshot.lines.map((line) => {
        const files = line.files ?? [];
        const shown = files.filter((path) => views?.[path]);
        return (
          <div key={line.fieldId} className="flex min-w-0 flex-wrap items-start gap-x-1.5">
            <dt className="shrink-0 text-(--sf-muted,#6b7280)">{localizedText(line.label, locale)}:</dt>
            <dd className="min-w-0 font-medium break-words whitespace-pre-line">
              {line.type === "text" && <span className="line-clamp-3">{line.text}</span>}
              {line.type === "choice" && localizedText(line.option?.label, locale)}
              {line.type === "image" &&
                (shown.length ? (
                  <span className="flex flex-wrap gap-1 pt-0.5">
                    {shown.map((path, index) => (
                      // eslint-disable-next-line @next/next/no-img-element -- short-lived private link, not an optimisable image
                      <img
                        key={path}
                        src={views![path]}
                        alt={t("photoAlt", { number: index + 1 })}
                        className="size-9 rounded-md border border-(--sf-line,#e5e7eb) object-cover"
                      />
                    ))}
                  </span>
                ) : (
                  t("imagesAttached", { count: files.length })
                ))}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
