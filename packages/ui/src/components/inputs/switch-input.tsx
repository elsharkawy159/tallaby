"use client";

import * as React from "react";
import { Switch } from "@workspace/ui/components/switch";
import { BaseField, type BaseFieldProps } from "./base-field";
import { Controller, useFormContext } from "react-hook-form";

export interface SwitchInputProps
  extends Omit<BaseFieldProps, "children" | "label"> {
  label?: string;
  labelPosition?: "left" | "right";
  size?: "sm" | "md" | "lg";
  onChange?: (checked: boolean) => void;
}

export const SwitchInput = React.forwardRef<HTMLDivElement, SwitchInputProps>(
  (
    {
      name,
      label,
      labelPosition = "right",
      size = "md",
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

    return (
      <BaseField
        ref={ref}
        name={name}
        error={fieldError}
        disabled={disabled}
        {...baseProps}
        label="" // Don't show label in BaseField since we handle it inline
      >
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-3">
              {label && labelPosition === "left" && (
                <label
                  htmlFor={name}
                  className="text-sm font-medium cursor-pointer"
                >
                  {label}
                  {baseProps.required && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                </label>
              )}

              <Switch
                id={name}
                checked={field.value || false}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  onChange?.(checked);
                }}
                disabled={disabled}
                className={
                  size === "sm" ? "scale-75" : size === "lg" ? "scale-125" : ""
                }
              />

              {label && labelPosition === "right" && (
                <label
                  htmlFor={name}
                  className="text-sm font-medium cursor-pointer"
                >
                  {label}
                  {baseProps.required && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                </label>
              )}
            </div>
          )}
        />
      </BaseField>
    );
  }
);

SwitchInput.displayName = "SwitchInput";
