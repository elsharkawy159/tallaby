"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@workspace/ui/lib/utils";

/** Toggles between Arabic and English on the same page. */
export function LocaleSwitch({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      aria-label={t("switchAria")}
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          // Keep the hash (e.g. /#how) and the query string when switching.
          router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: next, scroll: false });
        })
      }
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold whitespace-nowrap text-[#c9d9dd] hover:text-white disabled:opacity-60",
        className,
      )}
    >
      <Languages className="size-4" aria-hidden />
      <span>{t("switchLabel")}</span>
    </button>
  );
}
