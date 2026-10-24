"use client";

import { useState, type ReactNode } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { Eye, EyeOff, Lock, Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

import { AUTH_INPUT_BOX } from "./auth-ui";

const ICONS = { email: Mail, password: Lock, tel: Phone } as const;

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
  description,
  autoFocus,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  type: "email" | "password" | "tel";
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  labelAction?: ReactNode;
  description?: string;
  autoFocus?: boolean;
}) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  const Icon = ICONS[type];
  // Phone numbers are always typed left-to-right, even on the Arabic (RTL)
  // page, so the tel box is LTR with the icon on the physical left where the
  // number starts. Logical classes would put the icon on the right instead.
  const isTel = type === "tel";

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
            <Icon
              className={cn(
                "pointer-events-none absolute size-[18px] text-muted-foreground",
                isTel ? "left-3.5" : "start-3.5",
              )}
            />
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                type={type === "password" && visible ? "text" : type}
                dir={isTel ? "ltr" : undefined}
                inputMode={isTel ? "tel" : undefined}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                autoFocus={autoFocus}
                className={cn(
                  AUTH_INPUT_BOX,
                  isTel ? "pr-3.5 pl-11 text-left rtl:text-left" : "ps-11 pe-11",
                )}
              />
            </FormControl>
            {type === "password" && (
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? t("hidePassword") : t("showPassword")}
                aria-pressed={visible}
                className="absolute end-1.5 grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-3 focus-visible:outline-primary/30"
              >
                {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            )}
          </div>
          {description && <FormDescription className="text-[13px]">{description}</FormDescription>}
          <FormMessage className="text-[13px]" />
        </FormItem>
      )}
    />
  );
}
