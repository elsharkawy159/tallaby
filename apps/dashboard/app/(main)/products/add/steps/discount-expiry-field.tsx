"use client";

import { useId, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { addDays, differenceInCalendarDays, format, isSameDay } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { CalendarDays, ChevronDown, Clock } from "lucide-react";
import { Calendar } from "@workspace/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { InputGroup, ToggleRow } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import type { AddProductFormData } from "../add-product.schema";

interface DiscountExpiryFieldProps {
  name: string;
  /** Defaults to the short "Discount expiry" label. */
  title?: string;
  description?: string;
}

/** Quick picks, in days from today; each ends at 23:59 that day. */
const PRESET_DAYS = [1, 3, 7, 14, 30] as const;
const DEFAULT_TIME = "23:59";

function endOfDayIn(days: number): Date {
  const date = addDays(new Date(), days);
  date.setHours(23, 59, 0, 0);
  return date;
}

function withTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours || 0, minutes || 0, 0, 0);
  return next;
}

export function DiscountExpiryField({ name, title, description }: DiscountExpiryFieldProps) {
  const form = useFormContext<AddProductFormData>();
  const t = useTranslations("productForm.discountExpiry");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? arLocale : undefined;
  const id = useId();
  const raw = useWatch({ control: form.control, name: name as never }) as Date | string | null | undefined;
  const value = raw ? new Date(raw) : null;
  const [enabled, setEnabled] = useState<boolean>(!!value);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const setDate = (date: Date | null) =>
    form.setValue(name as never, date as never, { shouldDirty: true, shouldValidate: true });

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) setDate(null);
    else if (!value) setDate(endOfDayIn(3));
  };

  const shown = enabled || !!value;
  const time = value ? format(value, "HH:mm") : DEFAULT_TIME;
  const daysLeft = value ? differenceInCalendarDays(value, new Date()) : null;
  const isPast = value ? value.getTime() <= Date.now() : false;

  return (
    <div className="flex flex-col gap-3">
      <ToggleRow
        id={`${id}-discount-expiry`}
        checked={shown}
        onCheckedChange={handleToggle}
        title={title ?? t("label")}
        description={description}
      />

      {shown && (
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-3.5">
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("quickPicks")}>
            {PRESET_DAYS.map((days) => {
              const target = endOfDayIn(days);
              const active = !!value && isSameDay(value, target);
              return (
                <button
                  key={days}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDate(withTime(target, time))}
                  className={cn(
                    "h-8 cursor-pointer rounded-full border px-3 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30",
                    active
                      ? "border-primary bg-primary-soft text-primary-ink"
                      : "border-border bg-card text-muted-foreground hover:border-faint hover:text-foreground"
                  )}
                >
                  {t("inDays", { count: days })}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={t("date")}
                  className={cn(
                    "flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-[10px] border border-input bg-card px-3.5 text-start text-sm transition-[border-color,box-shadow] outline-none hover:border-faint focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20",
                    isPast && "border-destructive"
                  )}
                >
                  <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                  <span className={cn("min-w-0 flex-1 truncate", !value && "text-faint")}>
                    {value ? format(value, "EEEE, d MMMM yyyy", { locale: dateLocale }) : t("placeholder")}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={value ?? undefined}
                  onSelect={(date: Date | undefined) => {
                    if (!date) return;
                    setDate(withTime(date, time));
                    setCalendarOpen(false);
                  }}
                  disabled={{ before: new Date() }}
                  locale={dateLocale}
                  dir={locale === "ar" ? "rtl" : undefined}
                  autoFocus
                />
              </PopoverContent>
            </Popover>

            <InputGroup className="bg-card" invalid={isPast}>
              <span className="flex items-center ps-3.5 text-muted-foreground">
                <Clock className="size-4" />
              </span>
              <input
                type="time"
                dir="ltr"
                aria-label={t("time")}
                value={time}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setDate(withTime(value ?? endOfDayIn(0), e.target.value));
                }}
                className="h-full min-w-0 flex-1 bg-transparent px-2.5 font-sans text-sm tabular-nums outline-none"
              />
            </InputGroup>
          </div>

          {value && (
            <p className={cn("text-xs", isPast ? "text-destructive" : "text-muted-foreground")}>
              {isPast
                ? t("inPast")
                : daysLeft === 0
                  ? t("endsToday", { time: format(value, "p", { locale: dateLocale }) })
                  : t("endsIn", { count: daysLeft ?? 0 })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
