import { deepMergeMessages, type Messages } from "./merge-messages.lib";

/**
 * Marketing site strings live in messages/marketing/<group>.<locale>.json, so
 * pages can be worked on separately. To add a group, add its name here and both
 * files. Server code sees them through i18n/request.ts. Only tallaby.com sends
 * them to the browser ((marketing)/layout.tsx), so store pages don't carry them.
 */
const MARKETING_GROUPS = [
  "site",
  "home",
  "pricing",
  "templates",
  "blog",
  "about",
  "careers",
  "contact",
  "faq",
  "legal",
  "features",
  "integrations",
  "compare",
  "tools",
  "industries",
  "keywords",
  "followUs",
] as const;

export async function loadBaseMessages(locale: string): Promise<Messages> {
  return (await import(`../messages/${locale}.json`)).default as Messages;
}

export async function loadMarketingMessages(locale: string): Promise<Messages> {
  const groups = await Promise.all(
    MARKETING_GROUPS.map(async (group) => (await import(`../messages/marketing/${group}.${locale}.json`)).default as Messages),
  );
  return groups.reduce<Messages>((all, group) => deepMergeMessages(all, group), {});
}

/** Everything server code can read. A marketing string wins over a base string with the same key. */
export async function loadAllMessages(locale: string): Promise<Messages> {
  const [base, marketing] = await Promise.all([loadBaseMessages(locale), loadMarketingMessages(locale)]);
  return deepMergeMessages(base, marketing);
}
