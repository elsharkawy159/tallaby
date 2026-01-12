"use client";

import { Button } from "@workspace/ui/components";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  variant?: "header" | "default";
}

export function LanguageSwitcher({
  variant = "header",
}: LanguageSwitcherProps) {
  const router = useRouter();
  const locale = useLocale();

  function switchLocale(newLocale: string) {
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `locale=${newLocale}; path=/; max-age=${oneYear};`;
    router.refresh();
  }

  const locales = [
    { code: "ar", label: "عربي" },
    { code: "en", label: "English" },
  ];

  const isHeader = variant === "header";

  return (
    <>
      {locales.map((l) => (
        <Button
          key={l.code}
          size="sm"
          variant={l.code === locale ? "default" : "ghost"}
          onClick={() => switchLocale(l.code)}
          className={cn(
            "h-8 px-3 text-xs rounded-md font-medium transition-all duration-200",
            isHeader ? "bg-gray-50/15" : "bg-gray-100",
            l.code === locale
              ? isHeader
                ? "bg-white text-black shadow-sm hover:bg-white cursor-default hidden"
                : "bg-primary text-primary-foreground shadow-sm hover:bg-primary"
              : isHeader
                ? "text-white hover:bg-white/20 hover:text-white"
                : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
          )}
          aria-label={`Switch to ${l.label}`}
        >
          <Globe className="size-4" />
          {l.label}
        </Button>
      ))}
    </>
  );
}
