"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/actions/locale";
import { getPathname, usePathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

/**
 * The language switchers' action (plan Phase 1.4): save the choice in the
 * `locale` cookie first (setLocale, the only place it changes), then open the
 * same page in that locale (`/orders` ↔ `/en/orders`), query string kept.
 * The cookie must be written before navigating: the proxy sends an unprefixed
 * URL to /en while the saved choice is still English.
 *
 * The URL comes from next-intl's `getPathname`, not its router: with a
 * `locale` option the router always adds the prefix (`/ar/orders`), so the
 * middleware can store a cookie, which this app turns off (`localeCookie:
 * false`). The middleware then 307s `/ar/...` to `/...`, and the client
 * router keeps `/ar/...` in the address bar.
 */
export function useSwitchLocale() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: AppLocale) =>
    startTransition(async () => {
      await setLocale(next);
      // Read at click time: useSearchParams would need a Suspense boundary.
      const { search, hash } = window.location;
      router.replace(`${getPathname({ href: pathname, locale: next })}${search}${hash}`);
    });

  return { switchTo, isPending };
}
