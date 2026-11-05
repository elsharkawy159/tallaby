"use client";

import { useState, type ReactNode } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { cn } from "@workspace/ui/lib/utils";

import { AUTH_INPUT_BOX } from "./auth-ui";

const STRENGTH_LABELS = ["weak", "weak", "medium", "strong", "veryStrong"] as const;

/** 0 to 4: length, mixed case, a digit, and a symbol or real length. Advice only; the form's rules still decide. */
function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 12) score++;
  return score;
}

function PasswordMeter({ value }: { value: string }) {
  const t = useTranslations("auth.passwordStrength");
  if (!value) return null;
  const score = passwordScore(value);
  const filled = Math.max(1, score);
  const color = filled === 1 ? "bg-destructive" : filled === 2 ? "bg-accent" : "bg-success";
  return (
    <div className="flex items-center gap-2.5">
      <div aria-hidden className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <i key={bar} className={cn("h-1 flex-1 rounded-full", bar <= filled ? color : "bg-(--s-field)")} />
        ))}
      </div>
      <span aria-live="polite" className="text-xs font-semibold text-(--s-subtle)">
        {t(STRENGTH_LABELS[score] ?? "weak")}
      </span>
    </div>
  );
}

/** Auth-page input (`.f`, `.in`): label with an optional action beside it, the box, then hint and error. */
export function AuthField<T extends FieldValues>({
  form,
  name,
  label,
  type,
  placeholder,
  autoComplete,
  disabled,
  labelAction,
  description,
  autoFocus,
  meter,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  type: "email" | "password" | "tel" | "text";
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  labelAction?: ReactNode;
  description?: string;
  autoFocus?: boolean;
  /** Show the password strength bars under the box. */
  meter?: boolean;
}) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  // Emails, passwords and phone numbers are typed left-to-right even on the Arabic (RTL) page.
  const isLatin = type !== "text";
  const isTel = type === "tel";

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <FormLabel className="text-[13px] font-bold text-(--s-text)">{label}</FormLabel>
            {labelAction}
          </div>
          <div className={AUTH_INPUT_BOX}>
            <FormControl>
              <input
                {...field}
                value={field.value ?? ""}
                type={type === "password" && visible ? "text" : type}
                // Empty, the box follows the page, so an Arabic placeholder with a number in it stays in order.
                dir={isTel || (isLatin && field.value) ? "ltr" : undefined}
                inputMode={isTel ? "tel" : undefined}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                autoFocus={autoFocus}
                className={cn(
                  "h-full min-w-0 flex-1 border-0 bg-transparent px-3.5 text-[15px] text-(--s-text) outline-none placeholder:text-(--s-placeholder)",
                  // The number starts on the left; typed emails and passwords sit on the page's reading side.
                  isTel ? "text-left" : isLatin && "rtl:text-right",
                )}
              />
            </FormControl>
            {type === "password" && (
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? t("hidePassword") : t("showPassword")}
                aria-pressed={visible}
                className="grid h-full w-[46px] shrink-0 cursor-pointer place-items-center text-(--s-subtle) transition-colors duration-150 hover:text-(--s-ink)"
              >
                {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            )}
          </div>
          {meter && <PasswordMeter value={String(field.value ?? "")} />}
          {description && <FormDescription className="text-xs text-(--s-subtle)">{description}</FormDescription>}
          <FormMessage className="text-xs font-semibold" />
        </FormItem>
      )}
    />
  );
}
