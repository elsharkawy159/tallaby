"use client";

import { Button } from "@workspace/ui/components";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();

  function switchLocale(locale: string) {
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `locale=${locale}; path=/; max-age=${oneYear};`;
    router.refresh();
  }

  const locales = [
    { code: "ar", label: "عربي" },
    { code: "en", label: "English" },
  ];

  return (
    <>
      {locales.map((l) => (
        <Button
          key={l.code}
          size="sm"
          variant={l.code === locale ? "default" : "ghost"}
          onClick={() => switchLocale(l.code)}
          className={cn(
            "h-8 px-3 text-xs rounded-md font-medium transition-all duration-200 bg-gray-50/15",
            l.code === locale
              ? "bg-white text-black shadow-sm hover:bg-white cursor-default hidden"
              : "text-white hover:bg-white/20 hover:text-white"
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
