"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Input } from "@workspace/ui/components/input";
import { BaseField, type BaseFieldProps } from "./base-field";
import { Controller, useFormContext } from "react-hook-form";

export interface CurrencyInputProps extends Omit<BaseFieldProps, "children"> {
  placeholder?: string;
  currency?: string;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  onChange?: (value: number) => void;
  value?: number;
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
      placeholder = "",
      currency = "EGP",
      min = 0,
      max,
      allowNegative = false,
      onChange,
      value,
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

    const parseNumber = (value: string): number => {
      const cleaned = value.replace(/[^\d.-]/g, "");
      const parsed = parseFloat(cleaned);

      if (isNaN(parsed)) return 0;
      if (!allowNegative && parsed < 0) return 0;
      if (min !== undefined && parsed < min) return min;
      if (max !== undefined && parsed > max) return max;

      return parsed;
    };

    const formatNumber = (value: number): string => {
      return value.toFixed(2);
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
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                <span className="text-sm font-medium">{currencySymbol}</span>
              </div>

              <Input
                {...field}
                id={name}
                type="number"
                placeholder={placeholder}
                disabled={disabled}
                value={
                  value ?? (typeof field.value === "number" ? field.value : "")
                }
                className={cn(
                  "pl-12",
                  fieldError && "border-red-500 focus:border-red-500"
                )}
                onChange={(e) => {
                  const numericValue = parseNumber(e.target.value);
                  field.onChange(numericValue);
                  onChange?.(numericValue);
                }}
                onBlur={(e) => {
                  const numericValue = parseNumber(e.target.value);
                  field.onChange(numericValue);
                  // Only format to 2 decimal places on blur
                  if (numericValue > 0) {
                    field.onChange(parseFloat(numericValue.toFixed(2)));
                  }
                  field.onBlur();
                }}
              />
            </div>
          )}
        />
      </BaseField>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
