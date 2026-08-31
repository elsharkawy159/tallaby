"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Input } from "@workspace/ui/components/input";
import { BaseField, type BaseFieldProps } from "./base-field";
import { Controller, useFormContext } from "react-hook-form";

export interface CurrencyInputProps extends Omit<BaseFieldProps, "children"> {
  placeholder?: string;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  onChange?: (value: number) => void;
  onBlurValue?: (value: number) => void;
  value?: number;
}

const EGP_SYMBOL = "ج.م";

export const CurrencyInput = React.forwardRef<
  HTMLDivElement,
  CurrencyInputProps
>(
  (
    {
      name,
      placeholder = "",
      min = 0,
      max,
      allowNegative = false,
      onChange,
      onBlurValue,
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

    const parseNumber = (value: string): number => {
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
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                <span className="text-xs font-medium">{EGP_SYMBOL}</span>
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
                  const normalizedValue =
                    numericValue > 0
                      ? parseFloat(numericValue.toFixed(2))
                      : numericValue;
                  field.onChange(normalizedValue);
                  onBlurValue?.(normalizedValue);
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
