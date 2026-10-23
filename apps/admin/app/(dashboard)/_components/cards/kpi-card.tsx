import type { ReactNode } from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  /** One short line under the value. */
  hint?: ReactNode;
  /** Shown as "+N today" (Cairo day). Omit for metrics without a daily count. */
  today?: number;
  className?: string;
}

/**
 * The header KPI card of the people and store directories (Customers,
 * Sellers, Stores), so the three pages read the same way.
 */
export function KpiCard({ label, value, icon, hint, today, className }: KpiCardProps) {
  return (
    <Card className={cn("gap-0 py-5", className)}>
      <CardContent className="px-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:size-4">
              {icon}
            </span>
            <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          </div>
          {today !== undefined && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                today > 0
                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                  : "bg-muted text-muted-foreground",
              )}
            >
              +{today.toLocaleString("en-EG")} today
            </span>
          )}
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">
          {typeof value === "number" ? value.toLocaleString("en-EG") : value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function KpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}

/** Whole-number share, "—" when there is nothing to divide by. */
export function percentOf(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";
}
