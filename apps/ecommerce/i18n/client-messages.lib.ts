import type { Messages } from "./merge-messages.lib";

/**
 * What each route group sends to the browser through NextIntlClientProvider.
 * Server components read every string through i18n/request.ts, so only the
 * namespaces that client components pass to `useTranslations` go here.
 *
 * - Root layout (every page, store hosts included): only the cookie banner.
 * - tallaby.com ((marketing)/layout.tsx): the namespaces its client components
 *   use, picked from the base and marketing strings, instead of all of
 *   ar.json plus 17 marketing groups (~350 KB per page before).
 * - (shop), (dev-library), (template-preview): every base string, as before.
 *
 * client-messages.lib.test.ts walks the imports of each route tree and fails
 * when a client component uses a namespace that is not listed here. Add the
 * namespace (dotted paths pick a part of one) when it does.
 */
export const ROOT_CLIENT_NAMESPACES = ["trackingConsent"] as const;

export const MARKETING_CLIENT_NAMESPACES = [
  "blog",
  "careers",
  "common",
  "contact",
  "faq",
  "home.hero.live",
  "home.marketing",
  "legal",
  "nav",
  "pricing.estimate",
  "pricing.plans.currency",
  "product",
  "signup",
  "site",
  "templates",
  "toast",
  "toolPages.profit-margin-calculator.calculator",
  "toolPages.store-cost-calculator.calculator",
  "trackingConsent",
] as const;

const isObject = (value: unknown): value is Messages =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Only the given namespaces of `messages`, nested as they are there. A dotted
 * namespace ("home.demo") keeps that part only; a missing one is skipped.
 */
export function pickMessages(messages: Messages, namespaces: readonly string[]): Messages {
  const out: Messages = {};
  // A namespace inside another listed one is already there (and writing into
  // that branch would change the loaded messages themselves).
  const wanted = namespaces.filter((ns) => !namespaces.some((other) => other !== ns && ns.startsWith(`${other}.`)));
  for (const namespace of wanted) {
    const keys = namespace.split(".");
    let source: Messages | string | undefined = messages;
    for (const key of keys) source = isObject(source) ? source[key] : undefined;
    if (source === undefined) continue;
    let target = out;
    keys.slice(0, -1).forEach((key) => {
      if (!isObject(target[key])) target[key] = {};
      target = target[key] as Messages;
    });
    target[keys[keys.length - 1]!] = source;
  }
  return out;
}

/** Whether `namespace` is sent by a list: listed itself, or inside a listed namespace. */
export function namespaceCovered(namespace: string, list: readonly string[]): boolean {
  return list.some((listed) => namespace === listed || namespace.startsWith(`${listed}.`));
}
