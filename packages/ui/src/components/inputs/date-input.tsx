"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { BaseField, type BaseFieldProps } from "./base-field";
import { Controller, useFormContext } from "react-hook-form";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

export interface DateInputProps extends Omit<BaseFieldProps, "children"> {
  placeholder?: string;
  dateFormat?: string;
  showClearButton?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  mode?: "single" | "range";
  onChange?: (date: Date | undefined) => void;
}

export const DateInput = React.forwardRef<HTMLDivElement, DateInputProps>(
  (
    {
      name,
      placeholder = "Select date...",
      dateFormat = "PPP", // "January 1, 2023" format
      showClearButton = true,
      minDate,
      maxDate,
      disabledDates = [],
      mode = "single",
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

    const [isOpen, setIsOpen] = React.useState(false);
    const fieldError = errors[name]?.message as string;

    const isDateDisabled = React.useCallback(
      (date: Date) => {
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        if (
          disabledDates.some(
            (disabledDate) =>
              date.toDateString() === disabledDate.toDateString()
          )
        )
          return true;
        return false;
      },
      [minDate, maxDate, disabledDates]
    );

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
            <div className="flex gap-2">
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal flex-1",
                      !field.value && "text-muted-foreground",
                      fieldError && "border-red-500 focus:border-red-500"
                    )}
                    disabled={disabled}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(field.value, dateFormat)
                    ) : (
                      <span>{placeholder}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode={mode}
                    selected={field.value}
                    onSelect={(date: any) => {
                      field.onChange(date);
                      onChange?.(date);
                      setIsOpen(false);
                    }}
                    disabled={(date: Date) => disabled || isDateDisabled(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {showClearButton && field.value && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    field.onChange(undefined);
                    onChange?.(undefined);
                  }}
                  disabled={disabled}
                  className="px-2"
                  title="Clear date"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        />
      </BaseField>
    );
  }
);

DateInput.displayName = "DateInput";
