"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { setLocale } from "@/actions/locale";

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSwitcher({ compact, className }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const next = locale === "ar" ? "en" : "ar";

  const onClick = () =>
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-label={next === "ar" ? "العربية" : "English"}
      title={next === "ar" ? "العربية" : "English"}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-60",
        compact && "justify-center px-0",
        className
      )}
    >
      <Languages className="h-5 w-5 shrink-0 text-gray-600" />
      {!compact && <span>{next === "ar" ? "العربية" : "English"}</span>}
    </button>
  );
}
