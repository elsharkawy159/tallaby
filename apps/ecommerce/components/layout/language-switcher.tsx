"use client";

import { useTransition } from "react";
import { Button } from "@workspace/ui/components";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";
import { resolveProductSlugForLocale } from "@/actions/i18n";
import type { ProductLocale } from "@/lib/product-translations";

interface LanguageSwitcherProps {
  variant?: "header" | "default";
}

// Product slugs differ per locale, so the internal pathname alone can't be
// reused across locales the way every other route can — it needs the
// equivalent slug resolved from the database first.
const PRODUCT_PATH = /^\/products\/([^/]+)$/;

export function LanguageSwitcher({
  variant = "header",
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function switchLocale(targetLocale: ProductLocale) {
    if (targetLocale === locale || isPending) return;

    const productMatch = pathname.match(PRODUCT_PATH);
    if (productMatch) {
      const currentSlug = productMatch[1] as string;
      startTransition(async () => {
        const translatedSlug = await resolveProductSlugForLocale(
          currentSlug,
          targetLocale
        );
        router.replace(
          translatedSlug ? `/products/${translatedSlug}` : "/products",
          { locale: targetLocale }
        );
      });
      return;
    }

    router.replace(pathname, { locale: targetLocale });
  }

  const locales: Array<{ code: ProductLocale; label: string }> = [
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
          disabled={isPending}
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
