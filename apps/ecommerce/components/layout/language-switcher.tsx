"use client";

import { Button } from "@workspace/ui/components";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

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
    <div className="flex items-center gap-1 rounded-md border border-white/20 bg-white/10 p-1">
      {locales.map((l) => (
        <Button
          key={l.code}
          size="sm"
          variant={l.code === locale ? "default" : "ghost"}
          onClick={() => switchLocale(l.code)}
          className={`md:h-7 h-6 md:px-3 px-1 text-xs font-medium transition-all duration-200 ${
            l.code === locale
              ? "bg-white text-black shadow-sm hover:bg-white cursor-default hidden md:flex"
              : "text-white hover:bg-white/20 hover:text-white"
          }`}
          aria-label={`Switch to ${l.label}`}
        >
          {l.label}
        </Button>
      ))}
    </div>
  );
}
