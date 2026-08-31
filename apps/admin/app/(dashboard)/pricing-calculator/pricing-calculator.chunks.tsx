"use client";

import type { ReactNode } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { cn } from "@workspace/ui/lib/utils";
import type { PriceStatus, ScenarioResult } from "./pricing-calculator.types";
import {
  formatMoney,
  formatPercent,
  formatUnits,
} from "./pricing-calculator.lib";
import { NO_ORDERS_HINT } from "./pricing-calculator.constants";

const STATUS_CONFIG: Record<PriceStatus, { label: string; className: string }> = {
  profitable: {
    label: "Profitable",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  "low-margin": {
    label: "Low Margin",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  loss: {
    label: "Loss",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function StatusBadge({ status }: { status: PriceStatus | null }) {
  if (!status) return null;
  const { label, className } = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn("text-sm", className)}>
      {label}
    </Badge>
  );
}

/** Green when the business makes money, red when it does not. */
export function profitToneClass(value: number | null): string {
  if (value === null) return "";
  if (value > 0) return "text-green-600";
  if (value < 0) return "text-red-600";
  return "";
}

interface NumberFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  placeholder?: string;
  suffix?: string;
}

/**
 * A numeric field that reports an emptied input as `undefined` rather than an
 * empty string, so a blank optional amount stays valid instead of tripping an
 * "expected number" error. The shared `FormInputField` emits `""` here, which
 * is right for its callers but wrong for a calculator where every amount is
 * legitimately blankable.
 */
export function NumberField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  suffix,
}: NumberFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                placeholder={placeholder}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value ?? ""}
                className={cn(suffix && "pr-14")}
                onChange={(event) => {
                  const raw = event.target.value;
                  if (raw === "") {
                    field.onChange(undefined);
                    return;
                  }
                  const parsed = Number(raw);
                  field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                }}
              />
              {suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  {suffix}
                </span>
              )}
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface ResultRowProps {
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
  emphasis?: boolean;
  muted?: boolean;
}

export function ResultRow({
  label,
  value,
  hint,
  valueClassName,
  emphasis = false,
  muted = false,
}: ResultRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div className="min-w-0">
        <span
          className={cn(
            "text-sm",
            emphasis ? "font-semibold" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <span
        className={cn(
          "tabular-nums shrink-0",
          emphasis ? "text-lg font-bold" : "text-sm font-medium",
          muted && "text-muted-foreground",
          valueClassName
        )}
      >
        {value}
      </span>
    </div>
  );
}

interface MetricTileProps {
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
  children?: ReactNode;
}

export function MetricTile({
  label,
  value,
  hint,
  valueClassName,
  children,
}: MetricTileProps) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums mt-1", valueClassName)}>
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {children}
    </div>
  );
}

/**
 * One batch in the volume projection: the profit it makes, alongside the
 * supplier outlay it takes to stock it -- the cash you need up front.
 * `label` is a node so the quantity can be an editable input.
 */
export function ProjectionTile({
  quantity,
  label,
  profit,
  supplierOutlay,
}: {
  quantity: number;
  label: ReactNode;
  profit: number | null;
  supplierOutlay: number;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex items-baseline gap-2 mt-2 flex-wrap">
        <span
          className={cn(
            "text-2xl font-bold tabular-nums",
            profitToneClass(profit)
          )}
        >
          {formatMoney(profit)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          profit
        </span>
      </div>
      <p className="text-xs text-muted-foreground tabular-nums mt-1">
        Supplier cost {formatMoney(supplierOutlay)}
        {quantity > 1 ? ` for ${formatUnits(quantity)}` : ""}
      </p>
    </div>
  );
}

/**
 * The editable quantity that titles the third projection tile, so any batch
 * size can be checked -- 150, 200, a million -- without leaving the page.
 */
export function ProjectionQuantityInput<TFieldValues extends FieldValues>({
  control,
  name,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-0">
          <div className="flex items-center gap-1.5">
            <FormControl>
              <Input
                type="number"
                inputMode="numeric"
                step={1}
                min={1}
                className="h-7 w-28 px-2 text-xs font-medium tabular-nums"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value ?? ""}
                onChange={(event) => {
                  const raw = event.target.value;
                  if (raw === "") {
                    field.onChange(undefined);
                    return;
                  }
                  const parsed = Number(raw);
                  field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                }}
              />
            </FormControl>
            <FormLabel className="text-xs font-medium text-muted-foreground">
              items
            </FormLabel>
          </div>
          <FormMessage className="mt-1 font-normal" />
        </FormItem>
      )}
    />
  );
}

/**
 * One of the three side-by-side columns in Profit Analysis. Shows the full
 * chain for a scenario so margin can never be mistaken for markup: what you
 * charge, what it costs, what is left, and that leftover as a share of price.
 */
export function ScenarioColumn({
  scenario,
  sellingPrice,
  isSelected,
}: {
  scenario: ScenarioResult;
  sellingPrice: number;
  isSelected: boolean;
}) {
  const unavailable = scenario.costPerItem === null;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-3",
        isSelected && "border-primary ring-1 ring-primary/20"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{scenario.label}</h3>
          <p className="text-xs text-muted-foreground">
            {scenario.ordersPerDay > 0
              ? `${scenario.ordersPerDay} orders/day`
              : "—"}
          </p>
        </div>
        <StatusBadge status={scenario.status} />
      </div>

      {unavailable ? (
        <p className="text-sm text-muted-foreground">{NO_ORDERS_HINT}</p>
      ) : (
        <div className="space-y-2">
          <ResultRow
            label="Product price"
            value={sellingPrice > 0 ? formatMoney(sellingPrice) : "—"}
          />
          <ResultRow
            label="Cost per item"
            value={formatMoney(scenario.costPerItem)}
          />
          <ResultRow
            label="Profit per item"
            value={formatMoney(scenario.profitPerItem)}
            valueClassName={profitToneClass(scenario.profitPerItem)}
          />
          <ResultRow
            label="Profit margin"
            value={formatPercent(scenario.profitMargin)}
            valueClassName={profitToneClass(scenario.profitMargin)}
          />
        </div>
      )}
    </div>
  );
}
