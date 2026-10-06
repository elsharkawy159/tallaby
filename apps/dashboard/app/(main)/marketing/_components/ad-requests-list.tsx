"use client";

import { ImageOff } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import type { AdRequestRow } from "@/actions/ads";
import type { AdRequestStatus } from "@/lib/ad-packages";

const STATUS_STYLES: Record<AdRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  approved: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  completed: "bg-muted text-muted-foreground",
  rejected: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

export function AdRequestsList({ requests }: { requests: AdRequestRow[] }) {
  const t = useTranslations("advertise.requests");
  const tPackage = useTranslations("advertise.package");
  const format = useFormatter();
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium" });

  return (
    <section aria-labelledby="ad-requests-title" className="space-y-3">
      <h2 id="ad-requests-title" className="text-lg font-bold">
        {t("title")}
      </h2>

      {requests.length === 0 ? (
        <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {requests.map((r) => (
            <li key={r.id} className="flex items-center gap-3 p-3 sm:p-4">
              <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {r.product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.product.image} alt="" loading="lazy" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted-foreground">
                    <ImageOff className="size-4" aria-hidden />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.product.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {tPackage.has(`${r.packageKey}.name`)
                    ? tPackage(`${r.packageKey}.name`)
                    : r.packageKey}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.startsAt && r.endsAt
                    ? t("runs", { start: date(r.startsAt), end: date(r.endsAt) })
                    : t("submittedOn", { date: date(r.createdAt) })}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    STATUS_STYLES[r.status]
                  )}
                >
                  {t(`status.${r.status}`)}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {r.amount.toLocaleString()} {tPackage("currency")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
