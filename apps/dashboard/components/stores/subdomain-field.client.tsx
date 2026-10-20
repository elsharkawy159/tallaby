"use client";

import { useEffect, useState } from "react";
import type { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { cn } from "@workspace/ui/lib/utils";

export type SubdomainCheckStatus =
  | "available"
  | "taken"
  | "tooShort"
  | "tooLong"
  | "invalid"
  | "reserved"
  | "rateLimited";

export type SubdomainCheckResult = {
  status: SubdomainCheckStatus;
  subdomain: string;
  suggestions: string[];
};

type CheckState = { status: "idle" } | { status: "checking" } | SubdomainCheckResult;

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "tallaby.com";
const DEBOUNCE_MS = 400;

/**
 * Store address input (`____.tallaby.com`) with a live, debounced availability
 * check. Used by signup and "create store". The server re-checks on submit;
 * this is UX only. Reports availability through `onAvailabilityChange` so the
 * form can block submitting a taken address.
 */
export function SubdomainField<TFieldValues extends FieldValues>({
  form,
  name,
  check,
  onAvailabilityChange,
  disabled,
  autoFocus,
  className,
  inputClassName,
  labelClassName,
}: {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  check: (subdomain: string) => Promise<SubdomainCheckResult>;
  onAvailabilityChange?: (available: boolean) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Extra classes for the bordered box (e.g. a taller, rounder auth-page look). */
  className?: string;
  /** Extra classes for the text input inside the box. */
  inputClassName?: string;
  labelClassName?: string;
}) {
  const t = useTranslations("signup");
  const value = String(form.watch(name) ?? "");
  const [state, setState] = useState<CheckState>({ status: "idle" });

  useEffect(() => {
    const subdomain = value.trim().toLowerCase();
    if (!subdomain) {
      setState({ status: "idle" });
      onAvailabilityChange?.(false);
      return;
    }
    setState({ status: "checking" });
    onAvailabilityChange?.(false);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await check(subdomain);
        if (cancelled) return;
        setState(result);
        onAvailabilityChange?.(result.status === "available");
      } catch {
        if (!cancelled) setState({ status: "idle" });
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `check` and the callback are stable server-action / setter references.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const pick = (suggestion: string) =>
    form.setValue(name, suggestion as PathValue<TFieldValues, Path<TFieldValues>>, {
      shouldValidate: true,
      shouldDirty: true,
    });

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={labelClassName}>{t("storeAddress")}</FormLabel>
          <FormControl>
            <div
              dir="ltr"
              className={cn(
                "flex h-11 items-center overflow-hidden rounded-lg border bg-background shadow-xs transition-[color,box-shadow]",
                "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
                disabled && "opacity-50",
                className,
              )}
            >
              <input
                {...field}
                value={String(field.value ?? "")}
                onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                autoFocus={autoFocus}
                disabled={disabled}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="url"
                maxLength={32}
                placeholder="my-store"
                aria-describedby={`${String(name)}-status`}
                className={cn(
                  "h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none md:text-sm",
                  inputClassName,
                )}
              />
              <span className="flex h-full items-center border-s bg-muted px-3 text-sm text-muted-foreground">
                .{ROOT_DOMAIN}
              </span>
            </div>
          </FormControl>
          <div id={`${String(name)}-status`} aria-live="polite" className="min-h-5 text-sm">
            {state.status === "checking" && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {t("checking")}
              </span>
            )}
            {state.status === "available" && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                <span>{t("available", { address: `${state.subdomain}.${ROOT_DOMAIN}` })}</span>
              </span>
            )}
            {state.status !== "idle" && state.status !== "checking" && state.status !== "available" && (
              <span className="flex items-center gap-1.5 text-destructive">
                <XCircle className="size-3.5" />
                {t(state.status)}
              </span>
            )}
            {"suggestions" in state && state.suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">{t("suggestions")}</span>
                {state.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    dir="ltr"
                    onClick={() => pick(s)}
                    className="rounded-full border px-2.5 py-0.5 text-xs hover:bg-muted"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <FormDescription>{t("storeAddressHint")}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
