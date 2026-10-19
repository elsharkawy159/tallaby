"use client";

import { useState, type ReactNode } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";

/** Auth-page input: leading icon, 48px pill-ish box, optional action beside the label. */
export function AuthField<T extends FieldValues>({
  form,
  name,
  label,
  type,
  placeholder,
  autoComplete,
  disabled,
  labelAction,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  type: "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  labelAction?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const Icon = type === "email" ? Mail : Lock;

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-2">
          <div className="flex items-baseline justify-between">
            <FormLabel className="text-sm font-semibold text-foreground">{label}</FormLabel>
            {labelAction}
          </div>
          <div className="relative flex items-center">
            <Icon className="pointer-events-none absolute start-3.5 size-[18px] text-muted-foreground" />
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                type={type === "password" && visible ? "text" : type}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                className="h-12 rounded-[10px] bg-white ps-11 pe-11 text-[15px] md:text-[15px] dark:bg-card"
              />
            </FormControl>
            {type === "password" && (
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                className="absolute end-1.5 grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-3 focus-visible:outline-primary/30"
              >
                {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            )}
          </div>
          <FormMessage className="text-[13px]" />
        </FormItem>
      )}
    />
  );
}
