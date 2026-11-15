"use client";

import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSwitchLocale } from "./use-switch-locale.client";

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSwitcher({ compact, className }: LanguageSwitcherProps) {
  const locale = useLocale();
  const { switchTo, isPending } = useSwitchLocale();
  const next = locale === "ar" ? "en" : "ar";

  const onClick = () => switchTo(next);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-label={next === "ar" ? "العربية" : "English"}
      title={next === "ar" ? "العربية" : "English"}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60",
        compact && "justify-center px-0",
        className
      )}
    >
      <Languages className="h-5 w-5 shrink-0 text-muted-foreground" />
      {!compact && <span>{next === "ar" ? "العربية" : "English"}</span>}
    </button>
  );
}
