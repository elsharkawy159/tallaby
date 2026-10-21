import { BadgePercent, Gift, ShieldOff } from "lucide-react";
import type { SellerFeeProfile } from "@workspace/lib/orders/platform-fee";
import { cn } from "@workspace/ui/lib/utils";
import { FLAT_FEE_LABEL, platformFeeState } from "./platform-fee.lib";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * The Tallaby fee as it applies to one seller right now. `compact` is one line
 * for tables; the full form adds what the fee is and when the trial ends.
 */
export function PlatformFeeSummary({
  seller,
  compact = false,
  className,
}: {
  seller: SellerFeeProfile;
  compact?: boolean;
  className?: string;
}) {
  const state = platformFeeState(seller);
  const Icon = state.kind === "exempt" ? ShieldOff : state.kind === "trial" ? Gift : BadgePercent;
  const tone =
    state.kind === "exempt"
      ? "text-muted-foreground"
      : state.kind === "trial"
        ? "text-emerald-700 dark:text-emerald-300"
        : "text-foreground";

  if (compact) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-sm whitespace-nowrap", tone, className)}>
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {state.kind === "standard" ? "EGP 5 / order" : state.label}
        {state.kind === "trial" ? (
          <span className="text-xs text-muted-foreground">until {DATE.format(new Date(state.endsAt))}</span>
        ) : null}
      </span>
    );
  }

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-ink">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className={cn("text-sm font-medium", tone)}>{state.label}</p>
        <p className="text-xs text-muted-foreground">
          {state.kind === "exempt"
            ? "No platform fee is taken from this seller's store wallet."
            : state.kind === "trial"
              ? `No fee until ${DATE.format(new Date(state.endsAt))}, then ${FLAT_FEE_LABEL}.`
              : "Taken from the store wallet when an order is delivered."}
        </p>
      </div>
    </div>
  );
}
