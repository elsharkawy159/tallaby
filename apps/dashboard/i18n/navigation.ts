import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

const navigation = createNavigation(routing);

/**
 * Locale-aware Link, router and pathname (Arabic unprefixed, English under /en).
 * Every internal dashboard navigation uses these, not `next/link` /
 * `next/navigation` (an eslint rule enforces it), so a seller on /en stays on
 * /en. Never pass `locale` to Link or the router: it forces a prefix even for
 * Arabic (`/ar/...`); open another locale with `getPathname` instead
 * (components/layout/use-switch-locale.client.ts).
 */
export const { Link, usePathname, useRouter, getPathname } = navigation;

// Declared with explicit types so TypeScript treats a call as never returning
// (control-flow narrowing only works on explicitly typed functions).
// Server code passes the request locale: `redirect({ href, locale: await getLocale() })`.
export const redirect: typeof navigation.redirect = navigation.redirect;
export const permanentRedirect: typeof navigation.permanentRedirect = navigation.permanentRedirect;
