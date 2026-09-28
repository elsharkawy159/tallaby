"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { setLocale } from "@/actions/locale";

/** Each option is labelled in its own language so it's readable by whoever needs it. */
const TARGET = {
  ar: { value: "en", label: "English" },
  en: { value: "ar", label: "العربية" },
} as const;

export function LanguageToggle({ className }: { className?: string }) {
  const t = useTranslations("header");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const target = TARGET[locale];

  const onClick = () =>
    startTransition(async () => {
      await setLocale(target.value);
      router.refresh();
    });

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      lang={target.value}
      title={t("language")}
      aria-label={`${t("language")}: ${target.label}`}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
        className
      )}
    >
      {isPending ? (
        <Loader2 className="size-[18px] animate-spin" />
      ) : (
        <Languages className="size-[18px]" />
      )}
      <span className="hidden sm:inline">{target.label}</span>
    </button>
  );
}
