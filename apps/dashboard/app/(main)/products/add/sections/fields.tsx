"use client";

import { useEffect, useState } from "react";
import { Controller, useFormContext, useFormState } from "react-hook-form";
import { useTranslations } from "next-intl";
import { normalizePrice } from "@/lib/utils/product-pricing.lib";
import { GroupInput, InputGroup } from "@/components/form/form-ui";
import { CURRENCY_CODE, CurrencyAddon } from "@/components/form/currency-input";
import { cn } from "@/lib/utils";
import { getErrorAtPath } from "../add-product.lib";
import type { AddProductFormData } from "../add-product.schema";

/**
 * A field's error message, once it's worth showing: after a publish attempt,
 * or after the seller has touched that field. Messages are already localized
 * by the form resolver.
 */
export function useFieldError(name: string): string | undefined {
  const { getFieldState } = useFormContext<AddProductFormData>();
  const formState = useFormState<AddProductFormData>({ name: name as never });
  const error = getErrorAtPath(formState.errors, name) as { message?: string } | undefined;
  if (!error) return undefined;
  const { isTouched } = getFieldState(name as never, formState);
  if (formState.submitCount === 0 && !isTouched) return undefined;
  return error.message || " ";
}

const toNumber = (raw: string): number | undefined => {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (cleaned === "" || cleaned === ".") return undefined;
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? undefined : parsed;
};

/**
 * Decimal input bound to a number field. Keeps the raw text while typing so
 * "12." doesn't snap back to "12".
 */
export function NumberInput({
  id,
  name,
  placeholder = "0",
  roundOnBlur = false,
  className,
  disabled,
}: {
  id?: string;
  name: string;
  placeholder?: string;
  /** Tidy the price to the piastre on blur (normalizePrice), as it is stored. */
  roundOnBlur?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  const { control } = useFormContext<AddProductFormData>();
  return (
    <Controller
      control={control}
      name={name as never}
      render={({ field }) => (
        <DecimalText
          id={id}
          value={field.value as unknown as number | undefined}
          onChange={field.onChange}
          onBlur={(value) => {
            if (roundOnBlur && typeof value === "number" && value > 0) {
              const rounded = normalizePrice(value);
              if (rounded !== value) field.onChange(rounded);
            }
            field.onBlur();
          }}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
        />
      )}
    />
  );
}

function DecimalText({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  disabled,
}: {
  id?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState(value == null ? "" : String(value));

  // Follow outside changes (import, rounding, draft restore) without
  // clobbering what the seller is mid-way through typing.
  useEffect(() => {
    if (toNumber(text) !== value) setText(value == null ? "" : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <GroupInput
      id={id}
      dir="ltr"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      disabled={disabled}
      className={className ?? "text-start font-sans tabular-nums rtl:text-right"}
      onChange={(e) => {
        const next = e.target.value.replace(/[^\d.]/g, "");
        setText(next);
        onChange(toNumber(next));
      }}
      onBlur={() => onBlur(toNumber(text))}
    />
  );
}

/** Price input with the static EGP addon. */
export function MoneyField({
  id,
  name,
  invalid,
  placeholder = "0.00",
  disabled,
}: {
  id?: string;
  name: string;
  invalid?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("productForm.sections.pricing");
  return (
    <InputGroup dir="ltr" invalid={invalid}>
      <CurrencyAddon />
      <NumberInput id={id} name={name} placeholder={placeholder} roundOnBlur disabled={disabled} />
    </InputGroup>
  );
}

const DISCOUNT_TYPES = ["percent", "amount"] as const;

/** Discount amount with a %/EGP segmented switch at the end of the group. */
export function DiscountField({
  id,
  valueName,
  typeName,
}: {
  id?: string;
  valueName: string;
  typeName: string;
}) {
  const t = useTranslations("productForm.sections.pricing");
  const { control } = useFormContext<AddProductFormData>();
  return (
    <InputGroup>
      <NumberInput id={id} name={valueName} placeholder="0" />
      <Controller
        control={control}
        name={typeName as never}
        render={({ field }) => {
          const current = (field.value as unknown as string) || "percent";
          return (
            <div
              role="radiogroup"
              aria-label={t("discountType")}
              dir="ltr"
              className="m-1.5 flex shrink-0 items-center rounded-lg bg-muted p-0.5"
            >
              {DISCOUNT_TYPES.map((type) => {
                const checked = current === type;
                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    title={type === "percent" ? t("discountPercent") : t("discountAmount")}
                    onClick={() => field.onChange(type)}
                    className={cn(
                      "h-full min-w-10 cursor-pointer rounded-md px-2.5 text-xs font-semibold transition-[color,background-color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30",
                      checked
                        ? "bg-card text-primary-ink shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {type === "percent" ? "%" : CURRENCY_CODE}
                  </button>
                );
              })}
            </div>
          );
        }}
      />
    </InputGroup>
  );
}
