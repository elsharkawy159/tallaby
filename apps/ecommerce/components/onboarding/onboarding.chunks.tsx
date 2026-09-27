"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useFormContext, type FieldPath } from "react-hook-form";

import { cn } from "@/lib/utils";
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
import {
  getPlanPricingLabel,
  localizedPlanDescription,
  localizedPlanName,
  localizedText,
  type FulfillmentPlanView,
} from "@workspace/lib/fulfillment";
import { getGovernorateLabel } from "@workspace/lib/shipping";
import type { OnboardingFormValues } from "./become-seller.dto";

type Path = FieldPath<OnboardingFormValues>;

/** Clears a field's manual (step-validation) error as soon as it changes. */
function useClearOnChange() {
  const { clearErrors } = useFormContext<OnboardingFormValues>();
  return (name: Path) => clearErrors(name);
}

export function TextField({
  name,
  label,
  placeholder,
  description,
  type = "text",
  dir,
}: {
  name: Path;
  label: string;
  placeholder?: string;
  description?: string;
  type?: string;
  dir?: "ltr" | "rtl";
}) {
  const { control } = useFormContext<OnboardingFormValues>();
  const clear = useClearOnChange();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              dir={dir}
              placeholder={placeholder}
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
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function TextAreaField({
  name,
  label,
  placeholder,
  rows = 3,
}: {
  name: Path;
  label: string;
  placeholder?: string;
  rows?: number;
}) {
  const { control } = useFormContext<OnboardingFormValues>();
  const clear = useClearOnChange();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              rows={rows}
              placeholder={placeholder}
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
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SelectField({
  name,
  label,
  placeholder,
  description,
  options,
}: {
  name: Path;
  label: string;
  placeholder?: string;
  description?: string;
  options: { value: string; label: string }[];
}) {
  const { control } = useFormContext<OnboardingFormValues>();
  const clear = useClearOnChange();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={(field.value as string) || undefined}
            onValueChange={(value) => {
              field.onChange(value);
              clear(name);
            }}
          >
            <FormControl>
              <SelectTrigger className="w-full" ref={field.ref}>
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
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
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

/** Large radio-style card. Used for the model choice and provider choices. */
export function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
  disabled,
  children,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onSelect()}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "relative rounded-lg border p-4 text-start transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-primary/50",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/40",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-input"
          )}
          aria-hidden
        >
          {selected && <Check className="size-3" />}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="font-medium leading-snug">{title}</div>
          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

/** "Pricing will be discussed..." unless an admin configured a price. */
export function PlanPricing({ plan }: { plan: FulfillmentPlanView }) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const label = getPlanPricingLabel(plan.pricing, locale);
  return (
    <p className="text-xs text-muted-foreground">
      {label ?? t("pricingDiscussed")}
    </p>
  );
}

export function PlanDetails({ plan }: { plan: FulfillmentPlanView }) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const governorates = plan.availability?.governorates;
  return (
    <div className="space-y-2 pt-1">
      {plan.features.length > 0 && (
        <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-1.5">
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{localizedText(feature, locale)}</span>
            </li>
          ))}
        </ul>
      )}
      {plan.serviceType === "delivery" && (
        <p className="text-xs text-muted-foreground">
          {governorates?.length
            ? t("availableIn", {
                areas: governorates
                  .map((g) => getGovernorateLabel(g, locale))
                  .join(locale.startsWith("ar") ? "، " : ", "),
              })
            : t("availabilityConfirmed")}
        </p>
      )}
      <PlanPricing plan={plan} />
    </div>
  );
}

export function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: FulfillmentPlanView;
  selected: boolean;
  onSelect: () => void;
}) {
  const locale = useLocale();
  return (
    <ChoiceCard
      selected={selected}
      onSelect={onSelect}
      title={localizedPlanName(plan, locale)}
      description={localizedPlanDescription(plan, locale) || undefined}
    >
      <PlanDetails plan={plan} />
    </ChoiceCard>
  );
}

/** Small red message for errors on non-input controls (card groups). */
export function InlineError({ name }: { name: Path }) {
  // Passing formState subscribes this component to error changes.
  const { getFieldState, formState } = useFormContext<OnboardingFormValues>();
  const message = getFieldState(name, formState).error?.message;
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}
