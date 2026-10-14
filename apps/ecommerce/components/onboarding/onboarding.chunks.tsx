"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { Check, CircleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useFormContext, type FieldPath } from "react-hook-form";

import { cn } from "@/lib/utils";
import { ChoiceCard, ChoiceGroup } from "@workspace/ui/components/choice-card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { getPlanPricingLabel, type FulfillmentPlanView } from "@workspace/lib/fulfillment";
import { getGovernorateLabel } from "@workspace/lib/shipping";
import type { OnboardingFormValues } from "./become-seller.dto";

type Path = FieldPath<OnboardingFormValues>;

// Labels stay dark on error; the control border and message carry the error state.
const labelClass =
  "text-sm font-semibold text-neutral-900 data-[error=true]:text-neutral-900 dark:text-foreground dark:data-[error=true]:text-foreground";
const controlClass =
  "h-11.5 rounded-[10px] border-neutral-300 bg-card px-3.5 text-[15px] md:text-[15px] dark:border-input";
const messageClass = "text-[13px] font-medium";
const hintClass = "text-[12.5px]";

/** Two-column field grid (one column on phones). */
export function FieldGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2", className)}>
      {children}
    </div>
  );
}

/** Label text followed by the "Optional" pill. */
export function FieldLabelText({ children, optional }: { children: ReactNode; optional?: boolean }) {
  const t = useTranslations("onboarding");
  return (
    <>
      {children}
      {optional && (
        <span className="rounded-full bg-muted px-2 py-px text-xs font-medium text-muted-foreground">
          {t("optional")}
        </span>
      )}
    </>
  );
}

/** Clears a field's manual (step-validation) error as soon as it changes. */
function useClearOnChange() {
  const { clearErrors } = useFormContext<OnboardingFormValues>();
  return (name: Path) => clearErrors(name);
}

interface BaseFieldProps {
  name: Path;
  label: string;
  description?: ReactNode;
  optional?: boolean;
  className?: string;
}

export function TextField({
  name,
  label,
  placeholder,
  description,
  optional,
  className,
  type = "text",
  dir,
  inputMode,
}: BaseFieldProps & {
  placeholder?: string;
  type?: string;
  dir?: "ltr" | "rtl";
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const { control } = useFormContext<OnboardingFormValues>();
  const clear = useClearOnChange();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className={labelClass}>
            <FieldLabelText optional={optional}>{label}</FieldLabelText>
          </FormLabel>
          <FormControl>
            <Input
              type={type}
              dir={dir}
              inputMode={inputMode}
              placeholder={placeholder}
              className={controlClass}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={(field.value as string) ?? ""}
              onChange={(e) => {
                field.onChange(e.target.value);
                clear(name);
              }}
            />
          </FormControl>
          {description && <FormDescription className={hintClass}>{description}</FormDescription>}
          <FormMessage className={messageClass} />
        </FormItem>
      )}
    />
  );
}

export function TextAreaField({
  name,
  label,
  placeholder,
  description,
  optional,
  className,
  rows = 3,
  maxLength,
}: BaseFieldProps & { placeholder?: string; rows?: number; maxLength?: number }) {
  const { control } = useFormContext<OnboardingFormValues>();
  const clear = useClearOnChange();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = (field.value as string) ?? "";
        const hint = description ?? (maxLength ? `${value.length}/${maxLength}` : undefined);
        return (
          <FormItem className={className}>
            <FormLabel className={labelClass}>
              <FieldLabelText optional={optional}>{label}</FieldLabelText>
            </FormLabel>
            <FormControl>
              <Textarea
                rows={rows}
                maxLength={maxLength}
                placeholder={placeholder}
                className="resize-y rounded-[10px] border-neutral-300 bg-card dark:border-input px-3.5 py-3 text-[15px] leading-relaxed md:text-[15px]"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  clear(name);
                }}
              />
            </FormControl>
            {hint && <FormDescription className={hintClass}>{hint}</FormDescription>}
            <FormMessage className={messageClass} />
          </FormItem>
        );
      }}
    />
  );
}

export function SelectField({
  name,
  label,
  placeholder,
  description,
  optional,
  className,
  options,
}: BaseFieldProps & {
  placeholder?: string;
  options: { value: string; label: string }[];
}) {
  const { control } = useFormContext<OnboardingFormValues>();
  const clear = useClearOnChange();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className={labelClass}>
            <FieldLabelText optional={optional}>{label}</FieldLabelText>
          </FormLabel>
          <Select
            value={(field.value as string) || undefined}
            onValueChange={(value) => {
              field.onChange(value);
              clear(name);
            }}
          >
            <FormControl>
              <SelectTrigger className={cn(controlClass, "!h-11.5 w-full")} ref={field.ref}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription className={hintClass}>{description}</FormDescription>}
          <FormMessage className={messageClass} />
        </FormItem>
      )}
    />
  );
}

export interface ChoiceOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}

/** Single-choice field rendered as selectable cards. */
export function ChoiceField({
  name,
  label,
  description,
  optional,
  className,
  options,
  columns = 4,
}: BaseFieldProps & { options: ChoiceOption[]; columns?: number }) {
  const { control } = useFormContext<OnboardingFormValues>();
  const clear = useClearOnChange();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel className={labelClass}>
            <FieldLabelText optional={optional}>{label}</FieldLabelText>
          </FormLabel>
          <FormControl>
            <ChoiceGroup
              ref={field.ref}
              columns={columns}
              value={(field.value as string) || ""}
              onValueChange={(value) => {
                field.onChange(value);
                clear(name);
              }}
            >
              {options.map((option) => (
                <ChoiceCard
                  key={option.value}
                  value={option.value}
                  icon={option.icon}
                  title={option.label}
                  description={option.description}
                  aria-invalid={!!fieldState.error}
                />
              ))}
            </ChoiceGroup>
          </FormControl>
          {description && !fieldState.error && (
            <FormDescription className={hintClass}>{description}</FormDescription>
          )}
          <FormMessage className={messageClass} />
        </FormItem>
      )}
    />
  );
}

export function useGovernorateOptions(governorates: readonly string[]) {
  const locale = useLocale();
  return governorates.map((value) => ({
    value,
    label: getGovernorateLabel(value, locale),
  }));
}

/** "Pricing will be discussed..." unless an admin configured a price. */
export function PlanPricing({ plan, className }: { plan: FulfillmentPlanView; className?: string }) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const label = getPlanPricingLabel(plan.pricing, locale);
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      {label ?? t("pricingDiscussed")}
    </p>
  );
}

/** Check-marked feature list used by plan options. */
export function FeatureList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <span className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1">
      {items.map((item, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 text-[12.5px] text-neutral-700 dark:text-foreground"
        >
          <Check className="size-3 text-success" aria-hidden />
          {item}
        </span>
      ))}
    </span>
  );
}

/** Error message for controls that aren't wrapped in a FormField. */
export function InlineError({ name }: { name: Path }) {
  // Passing formState subscribes this component to error changes.
  const { getFieldState, formState } = useFormContext<OnboardingFormValues>();
  const message = getFieldState(name, formState).error?.message;
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-[13px] font-medium text-destructive">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
