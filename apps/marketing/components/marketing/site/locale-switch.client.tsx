"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { localeSwitchHref } from "./locale-switch.lib";

/**
 * Toggles between Arabic and English on the same page. A real link, so crawlers
 * can reach the other language; a plain <a>, because next-intl's Link would
 * write the Arabic URL as /ar/... A click still goes through router.replace,
 * which keeps the hash and query and sets the locale cookie.
 */
export function LocaleSwitch({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const next = locale === "ar" ? "en" : "ar";

  return (
    <a
      href={localeSwitchHref(pathname, next)}
      hrefLang={next}
      aria-label={t("switchAria")}
      aria-disabled={pending}
      onClick={(event) => {
        event.preventDefault();
        if (pending) return;
        startTransition(() => {
          // Keep the hash (e.g. /#how) and the query string when switching.
          router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: next, scroll: false });
        });
      }}
      className={cn(
        "flex h-[42px] items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold whitespace-nowrap text-ink-600 hover:bg-teal-50 hover:text-teal-900 hover:no-underline hover:no-underline aria-disabled:opacity-60",
        className,
      )}
    >
      <Languages className="size-4" aria-hidden />
      <span>{t("switchLabel")}</span>
    </a>
  );
}
