"use client";

import type { ReactNode } from "react";
import { useFormContext, type FieldPath } from "react-hook-form";
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
import { Switch } from "@workspace/ui/components/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";

import type { ProductFormValues } from "./types";

type Name = FieldPath<ProductFormValues>;

export function Section({
  id,
  title,
  description,
  action,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn("scroll-mt-24 rounded-xl border bg-card p-4 sm:p-5", className)}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id ? `${id}-title` : undefined} className="text-base font-semibold">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function TextField({
  name,
  label,
  placeholder,
  description,
  maxLength,
  className,
  prefix,
}: {
  name: Name;
  label: string;
  placeholder?: string;
  description?: ReactNode;
  /** Shows a live character counter. */
  maxLength?: number;
  className?: string;
  prefix?: string;
}) {
  const { control } = useFormContext<ProductFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = (field.value as string | undefined) ?? "";
        return (
          <FormItem className={className}>
            <div className="flex items-baseline justify-between gap-2">
              <FormLabel>{label}</FormLabel>
              {maxLength && <CharCount length={value.length} max={maxLength} />}
            </div>
            <FormControl>
              {prefix ? (
                <div className="flex rounded-md shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50">
                  <span className="hidden max-w-[45%] items-center truncate rounded-l-md border border-r-0 bg-muted px-2.5 text-sm text-muted-foreground sm:flex">
                    {prefix}
                  </span>
                  <Input
                    {...field}
                    value={value}
                    placeholder={placeholder}
                    className="sm:rounded-l-none focus-visible:ring-0"
                  />
                </div>
              ) : (
                <Input {...field} value={value} placeholder={placeholder} />
              )}
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export function TextareaField({
  name,
  label,
  placeholder,
  description,
  maxLength,
  rows = 4,
}: {
  name: Name;
  label: string;
  placeholder?: string;
  description?: ReactNode;
  maxLength?: number;
  rows?: number;
}) {
  const { control } = useFormContext<ProductFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = (field.value as string | undefined) ?? "";
        return (
          <FormItem>
            <div className="flex items-baseline justify-between gap-2">
              <FormLabel>{label}</FormLabel>
              {maxLength && <CharCount length={value.length} max={maxLength} />}
            </div>
            <FormControl>
              <Textarea
                {...field}
                value={value}
                rows={rows}
                placeholder={placeholder}
                className="min-h-20 resize-y"
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

/** Number input where an empty box means "not set" (undefined), not 0. */
export function NumberField({
  name,
  label,
  placeholder,
  description,
  suffix,
  step,
  disabled,
  className,
}: {
  name: Name;
  label: string;
  placeholder?: string;
  description?: ReactNode;
  suffix?: string;
  step?: number | "any";
  disabled?: boolean;
  className?: string;
}) {
  const { control } = useFormContext<ProductFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                ref={field.ref}
                name={field.name}
                onBlur={field.onBlur}
                type="number"
                inputMode="decimal"
                step={step ?? "any"}
                disabled={disabled}
                placeholder={placeholder}
                value={(field.value as number | undefined) ?? ""}
                onChange={(event) => {
                  const raw = event.target.value;
                  field.onChange(raw === "" ? undefined : Number(raw));
                }}
                className={cn("tabular-nums", suffix && "pr-12")}
              />
              {suffix && (
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  {suffix}
                </span>
              )}
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SelectField({
  name,
  label,
  options,
  placeholder,
  className,
}: {
  name: Name;
  label: string;
  options: ReadonlyArray<{ label: string; value: string }>;
  placeholder?: string;
  className?: string;
}) {
  const { control } = useFormContext<ProductFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <Select
            value={(field.value as string | undefined) ?? ""}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger ref={field.ref} className="w-full">
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
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** A full-width row: label + hint on the left, switch on the right. */
export function SwitchRow({
  name,
  label,
  hint,
}: {
  name: Name;
  label: string;
  hint?: string;
}) {
  const { control } = useFormContext<ProductFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between gap-3 space-y-0 py-1">
          <div className="min-w-0">
            <FormLabel className="font-normal">{label}</FormLabel>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          <FormControl>
            <Switch
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function CharCount({ length, max }: { length: number; max: number }) {
  return (
    <span
      className={cn(
        "text-xs tabular-nums text-muted-foreground",
        length > max && "font-medium text-destructive"
      )}
    >
      {length}/{max}
    </span>
  );
}
