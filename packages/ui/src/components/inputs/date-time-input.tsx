"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import { Input } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { BaseField, type BaseFieldProps } from "./base-field";
import { Controller, useFormContext } from "react-hook-form";
import { CalendarIcon, Clock, X } from "lucide-react";
import { format, type Locale } from "date-fns";

export interface DateTimeInputProps extends Omit<BaseFieldProps, "children"> {
  placeholder?: string;
  dateFormat?: string;
  showClearButton?: boolean;
  minDate?: Date;
  maxDate?: Date;
  onChange?: (date: Date | undefined) => void;
  /** date-fns locale for the trigger label and the calendar. */
  locale?: Locale;
  clearLabel?: string;
}

function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  const next = new Date(date);
  next.setHours(hours || 0, minutes || 0, 0, 0);
  return next;
}

function formatTimeValue(date?: Date | null): string {
  if (!date) return "23:59";
  return format(date, "HH:mm");
}

export const DateTimeInput = React.forwardRef<HTMLDivElement, DateTimeInputProps>(
  (
    {
      name,
      placeholder = "Select date...",
      dateFormat = "PPP",
      showClearButton = true,
      minDate,
      maxDate,
      onChange,
      disabled = false,
      locale,
      clearLabel = "Clear date",
      ...baseProps
    },
    ref
  ) => {
    const {
      control,
      formState: { errors },
    } = useFormContext();

    const [isOpen, setIsOpen] = React.useState(false);
    const isRtl = Boolean(locale?.code?.startsWith("ar"));
    const fieldError = errors[name]?.message as string;

    const isDateDisabled = React.useCallback(
      (date: Date) => {
        if (minDate) {
          const minDay = new Date(minDate);
          minDay.setHours(0, 0, 0, 0);
          if (date < minDay) return true;
        }
        if (maxDate && date > maxDate) return true;
        return false;
      },
      [minDate, maxDate]
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
          render={({ field }) => {
            const currentValue: Date | undefined = field.value ?? undefined;

            const handleDateSelect = (date: Date | undefined) => {
              if (!date) return;
              const combined = combineDateAndTime(date, formatTimeValue(currentValue));
              field.onChange(combined);
              onChange?.(combined);
              setIsOpen(false);
            };

            const handleTimeChange = (time: string) => {
              if (!time) return;
              const base = currentValue ?? new Date();
              const combined = combineDateAndTime(base, time);
              field.onChange(combined);
              onChange?.(combined);
            };

            return (
              <div className="flex flex-wrap gap-2">
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 min-w-[180px] justify-start text-start font-normal",
                        !currentValue && "text-muted-foreground",
                        fieldError && "border-red-500 focus:border-red-500"
                      )}
                      disabled={disabled}
                      type="button"
                    >
                      <CalendarIcon className="me-2 h-4 w-4 shrink-0" />
                      {currentValue ? (
                        format(currentValue, dateFormat, { locale })
                      ) : (
                        <span>{placeholder}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentValue}
                      onSelect={handleDateSelect}
                      disabled={(date: Date) => Boolean(disabled) || isDateDisabled(date)}
                      locale={locale}
                      dir={isRtl ? "rtl" : undefined}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>

                <div className="relative w-32 shrink-0">
                  <Clock className="pointer-events-none absolute start-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="time"
                    value={formatTimeValue(currentValue)}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    disabled={disabled || !currentValue}
                    className={cn("ps-8", fieldError && "border-red-500")}
                    dir="ltr"
                  />
                </div>

                {showClearButton && currentValue && (
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
                    title={clearLabel}
                    aria-label={clearLabel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          }}
        />
      </BaseField>
    );
  }
);

DateTimeInput.displayName = "DateTimeInput";
