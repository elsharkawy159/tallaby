"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Input } from "@workspace/ui/components/input";
import { BaseField, type BaseFieldProps } from "./base-field";
import { Controller, useFormContext } from "react-hook-form";
import { DollarSign } from "lucide-react";

export interface CurrencyInputProps extends Omit<BaseFieldProps, "children"> {
  placeholder?: string;
  currency?: string;
  showCurrencySymbol?: boolean;
  decimalPlaces?: number;
  min?: number;
  max?: number;
  step?: number;
  allowNegative?: boolean;
  thousandSeparator?: boolean;
  prefix?: string;
  suffix?: string;
  onChange?: (value: number) => void;
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  EGP: "ج.م",
  SAR: "ر.س",
  AED: "د.إ",
  KWD: "د.ك",
  QAR: "ر.ق",
  BHD: "د.ب",
  OMR: "ر.ع",
  JOD: "د.أ",
};

export const CurrencyInput = React.forwardRef<
  HTMLDivElement,
  CurrencyInputProps
>(
  (
    {
      name,
      placeholder = "0.00",
      currency = "EGP",
      showCurrencySymbol = true,
      decimalPlaces = 2,
      min = 0,
      max,
      step = 0.01,
      allowNegative = false,
      thousandSeparator = true,
      prefix,
      suffix,
      onChange,
      disabled = false,
      ...baseProps
    },
    ref
  ) => {
    const {
      control,
      formState: { errors },
    } = useFormContext();

    const fieldError = errors[name]?.message as string;
    const currencySymbol = currencySymbols[currency] || currency;

    const formatNumber = (value: number): string => {
      if (isNaN(value)) return "";

      const formatted = value.toFixed(decimalPlaces);

      if (thousandSeparator) {
        const parts = formatted.split(".");
        parts[0] = parts[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "";
        return parts.join(".");
      }

      return formatted;
    };

    const parseNumber = (value: string): number => {
      // Remove commas and other non-numeric characters except decimal point and minus
      const cleaned = value.replace(/[^\d.-]/g, "");
      const parsed = parseFloat(cleaned);

      if (isNaN(parsed)) return 0;
      if (!allowNegative && parsed < 0) return 0;
      if (min !== undefined && parsed < min) return min;
      if (max !== undefined && parsed > max) return max;

      return parsed;
    };

    return (
      <BaseField
        ref={ref}
        name={name}
        error={fieldError}
        disabled={disabled}
        {...baseProps}
      >
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <div className="relative">
              {(showCurrencySymbol || prefix) && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground flex items-center gap-1">
                  {showCurrencySymbol && (
                    <span className="text-sm font-medium">
                      {currencySymbol}
                    </span>
                  )}
                  {prefix && <span className="text-sm">{prefix}</span>}
                </div>
              )}

              <Input
                {...field}
                id={name}
                type="text"
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  (showCurrencySymbol || prefix) && "pl-12",
                  suffix && "pr-8",
                  fieldError && "border-red-500 focus:border-red-500"
                )}
                value={field.value ? formatNumber(field.value) : ""}
                onChange={(e) => {
                  const numericValue = parseNumber(e.target.value);
                  field.onChange(numericValue);
                  onChange?.(numericValue);
                }}
                onBlur={(e) => {
                  // Re-format on blur to ensure consistent display
                  const numericValue = parseNumber(e.target.value);
                  field.onChange(numericValue);
                  field.onBlur();
                }}
              />

              {suffix && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  <span className="text-sm">{suffix}</span>
                </div>
              )}
            </div>
          )}
        />
      </BaseField>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
