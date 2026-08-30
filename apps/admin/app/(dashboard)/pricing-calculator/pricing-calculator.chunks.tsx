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
import { formatMoney, formatPercent } from "./pricing-calculator.lib";
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

interface NumberFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  placeholder?: string;
}

/**
 * A numeric field that reports an emptied input as `undefined` rather than an
 * empty string, so a blank optional amount stays valid instead of tripping a
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
}: NumberFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
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
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

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

interface ResultRowProps {
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
  emphasis?: boolean;
}

export function ResultRow({
  label,
  value,
  hint,
  valueClassName,
  emphasis = false,
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
  const unavailable = scenario.totalCost === null;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-3",
        isSelected && "border-primary ring-1 ring-primary/20"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{scenario.label}</h3>
        <StatusBadge status={scenario.status} />
      </div>

      {unavailable ? (
        <p className="text-sm text-muted-foreground">{NO_ORDERS_HINT}</p>
      ) : (
        <div className="space-y-2">
          <ResultRow
            label="Selling price"
            value={sellingPrice > 0 ? formatMoney(sellingPrice) : "—"}
          />
          <ResultRow label="Total cost" value={formatMoney(scenario.totalCost)} />
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
