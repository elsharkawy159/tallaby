"use client";

import { useTransition } from "react";
import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { resolveProductSlugForLocale } from "@/actions/i18n";
import { updatePreferences } from "@/actions/customer";
import { routing } from "@/i18n/routing";
import type { ProductLocale } from "@/lib/product-translations";
import s from "../storefront.module.css";

const LABELS: Record<ProductLocale, string> = { ar: "عربي", en: "English" };

// Product slugs differ per locale, so product pages need the other slug.
const PRODUCT_PATH = /^\/products\/([^/]+)\/?$/;

/**
 * Switches the storefront to the other language. Works from the address-bar
 * path (`/`, `/en/products/x`), not the rewritten internal one, so it uses a
 * full navigation: the page's `lang`/`dir` change with it.
 */
export function StorefrontLanguageSwitcher() {
  const locale = useLocale() as ProductLocale;
  const target: ProductLocale = locale === "ar" ? "en" : "ar";
  const [isPending, startTransition] = useTransition();

  function switchLocale() {
    // Best-effort: remembered for signed-in shoppers; a no-op for guests.
    updatePreferences({ preferredLanguage: target }).catch(() => {});

    startTransition(async () => {
      const { pathname, search, hash } = window.location;
      let path = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/";

      const product = path.match(PRODUCT_PATH);
      if (product?.[1]) {
        const slug = await resolveProductSlugForLocale(decodeURIComponent(product[1]), target);
        path = slug ? `/products/${encodeURIComponent(slug)}` : "/";
      }

      const prefix = target === routing.defaultLocale ? "" : `/${target}`;
      const next = prefix ? `${prefix}${path === "/" ? "" : path}` : path;
      window.location.assign(`${next}${search}${hash}`);
    });
  }

  return (
    <button
      type="button"
      lang={target}
      onClick={switchLocale}
      disabled={isPending}
      className={s.iconButton}
    >
      <Globe className="size-4" aria-hidden />
      {LABELS[target]}
    </button>
  );
}
