"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Textarea } from "@workspace/ui/components/textarea";
import { BaseField, type BaseFieldProps } from "./base-field";
import { Controller, useFormContext } from "react-hook-form";

export interface TextareaInputProps extends Omit<BaseFieldProps, "children"> {
  placeholder?: string;
  rows?: number;
  cols?: number;
  resize?: "none" | "vertical" | "horizontal" | "both";
  readOnly?: boolean;
  autoFocus?: boolean;
  tabIndex?: number;
  validation?: {
    minLength?: number;
    maxLength?: number;
  };
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onChange?: (value: string) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
}

export const TextareaInput = React.forwardRef<
  HTMLDivElement,
  TextareaInputProps
>(
  (
    {
      name,
      placeholder,
      rows = 3,
      cols,
      resize = "vertical",
      readOnly = false,
      autoFocus = false,
      tabIndex,
      validation,
      onBlur,
      onChange,
      onFocus,
      disabled = false,
      ...baseProps
    },
    ref
  ) => {
    const {
      control,
      formState: { errors },
      watch,
    } = useFormContext();

    const fieldError = errors[name]?.message as string;
    const fieldValue = watch(name) || "";
    const characterCount =
      typeof fieldValue === "string" ? fieldValue.length : 0;

    const resizeClass = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    }[resize];

    return (
      <BaseField
        ref={ref}
        name={name}
        error={fieldError}
        characterCount={characterCount}
        maxLength={validation?.maxLength}
        disabled={disabled}
        {...baseProps}
      >
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <div className="relative">
              <Textarea
                {...field}
                id={name}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                autoFocus={autoFocus}
                tabIndex={tabIndex}
                rows={rows}
                cols={cols}
                onBlur={(e) => {
                  field.onBlur();
                  onBlur?.(e);
                }}
                onFocus={onFocus}
                className={cn(
                  resizeClass,
                  fieldError && "border-red-500 focus:border-red-500",
                  baseProps.showCharacterCount &&
                    validation?.maxLength &&
                    "pb-6"
                )}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  onChange?.(e.target.value);
                }}
              />
              {baseProps.showCharacterCount && validation?.maxLength && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1">
                  {characterCount}/{validation.maxLength}
                </div>
              )}
            </div>
          )}
        />
      </BaseField>
    );
  }
);

TextareaInput.displayName = "TextareaInput";
