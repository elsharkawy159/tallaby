"use client";

import { Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import type { AdPackage } from "@/lib/ad-packages";
import type { AdProductOption } from "./product-picker";

export type SummaryAction = {
  label: string;
  disabled: boolean;
  pending?: boolean;
  onClick: () => void;
};

type Props = {
  pkg: AdPackage | null;
  product: AdProductOption | null;
  action: SummaryAction;
};

/** Sticky order summary beside the flow (desktop). */
export function OrderSummary({ pkg, product, action }: Props) {
  const t = useTranslations("advertise.summary");
  const tPackage = useTranslations("advertise.package");

  const rows = [
    { key: "package", value: pkg ? tPackage(`${pkg.key}.name`) : null },
    { key: "duration", value: pkg ? tPackage("days", { count: pkg.durationDays }) : null },
    { key: "product", value: product?.title ?? null },
  ] as const;

  return (
    <aside className="sticky top-22 hidden flex-col gap-3 lg:flex">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        <div className="bg-primary px-4.5 py-4 text-primary-foreground">
          <small className="text-xs opacity-75">{t("totalCost")}</small>
          <div className="mt-2 flex items-baseline gap-1.5">
            <b className="text-[32px] font-extrabold leading-none tabular-nums">
              {(pkg?.price ?? 0).toLocaleString()}
            </b>
            <span>{tPackage("currency")}</span>
          </div>
        </div>
        <div className="px-4.5 pt-1.5 pb-4.5">
          <dl>
            {rows.map(({ key, value }) => (
              <div key={key} className="flex justify-between gap-3 border-b py-2.5 text-[13px]">
                <dt className="whitespace-nowrap text-muted-foreground">{t(key)}</dt>
                <dd
                  className={cn(
                    "min-w-0 text-end leading-snug [overflow-wrap:anywhere]",
                    value ? "font-semibold" : "text-muted-foreground"
                  )}
                >
                  {value ?? (key === "duration" ? "—" : t("none"))}
                </dd>
              </div>
            ))}
          </dl>
          <ActionButton action={action} className="mt-3.5 w-full" />
        </div>
      </div>
      <div className="flex gap-2.5 rounded-2xl bg-accent-soft p-3.5 text-xs leading-relaxed text-accent-ink">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{t("note")}</span>
      </div>
    </aside>
  );
}

/** Fixed bottom bar replacing the summary on small screens. */
export function MobileSummaryBar({ pkg, product, action }: Props) {
  const t = useTranslations("advertise");
  const tPackage = useTranslations("advertise.package");
  const label = pkg
    ? [tPackage(`${pkg.key}.name`), product?.title].filter(Boolean).join(" · ")
    : t("flow.pickPackage");

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t bg-card px-4 py-3 shadow-[0_-6px_20px_rgba(20,81,99,0.08)] lg:hidden">
      <div className="min-w-0 flex-1">
        <small className="block truncate text-[11px] text-muted-foreground">{label}</small>
        <b className="text-xl font-extrabold tabular-nums">{(pkg?.price ?? 0).toLocaleString()}</b>{" "}
        <span className="text-xs text-muted-foreground">{tPackage("currency")}</span>
      </div>
      <ActionButton action={action} />
    </div>
  );
}

function ActionButton({ action, className }: { action: SummaryAction; className?: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      className={cn("h-10.5", className)}
      disabled={action.disabled}
      onClick={action.onClick}
    >
      {action.pending && <Loader2 className="animate-spin" aria-hidden />}
      {action.label}
    </Button>
  );
}
