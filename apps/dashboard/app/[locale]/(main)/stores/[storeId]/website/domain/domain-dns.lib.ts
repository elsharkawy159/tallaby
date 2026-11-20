/**
 * Website › Domain › Custom domain: the DNS records a seller adds at their
 * registrar, and short per-registrar steps (owner, 2026-11-10: a seller on
 * Hostinger got stuck on the TTL field). Display only: the routing records
 * come from the domain's provider on the server (`routingRecords()` in
 * `packages/lib/src/storefront/custom-domain-provider.ts`, Vercel or
 * Cloudflare), and nothing here changes how a domain is attached or verified.
 *
 * Step texts are message keys under `settings.customDomain.guide.steps`;
 * registrar field and menu names stay in Latin because the registrars show
 * them in English.
 */

import { splitDomain, type DnsTarget } from "@workspace/lib/storefront/custom-domain-provider.lib";
import { DOMAIN_PROVIDERS } from "./domain-providers.lib";

export { splitDomain };

/** TTL we show on every record: 1 hour, accepted by every listed registrar. */
export const RECOMMENDED_TTL = 3600;
/** Any TTL in this range works (Hostinger's input starts at 60). */
export const MIN_TTL = 60;
export const MAX_TTL = 3600;

export type DnsRecord = { type: string; name: string; value: string; ttl: number };

/**
 * The routing records for `domain` (always stored without `www.`) and its
 * `www.`, as the provider gives them, plus the provider's ownership and
 * certificate TXT records. Names are what registrars expect: `@` for the
 * root, the host part otherwise.
 */
export function dnsRecords(
  domain: string,
  routing: readonly DnsTarget[],
  verification: readonly { type: string; domain: string; value: string }[] = [],
): DnsRecord[] {
  const { root } = splitDomain(domain);
  const records: DnsRecord[] = routing.map((r) => ({ type: r.type, name: r.name, value: r.value, ttl: RECOMMENDED_TTL }));
  for (const v of verification) {
    // `_vercel.faster-eg.com` → `_vercel` (registrars want the host part).
    const name = v.domain === root ? "@" : v.domain.endsWith(`.${root}`) ? v.domain.slice(0, -(root.length + 1)) : v.domain;
    records.push({ type: v.type, name, value: v.value, ttl: RECOMMENDED_TTL });
  }
  return records;
}

/** Ids of the guides: every suggested registrar plus "other". */
export type RegistrarGuideId = (typeof DOMAIN_PROVIDERS)[number]["id"] | "other";

/** Message keys under `settings.customDomain.guide.steps`. */
export type GuideStep = "open" | "openGeneric" | "clean" | "add" | "ttlHostinger" | "ttlGodaddy" | "ttlAuto" | "ttlCloudflare" | "ttlNumber" | "save";

export type RegistrarGuide = {
  id: RegistrarGuideId;
  /** Shown in Latin. */
  label: string;
  /** Where DNS records live in the registrar's menu, or null when we don't name it. */
  menu: string | null;
  /** The registrar's own field names. */
  fields: { name: string; value: string };
  steps: readonly GuideStep[];
};

export const REGISTRAR_GUIDES: readonly RegistrarGuide[] = [
  {
    id: "hostinger",
    label: "Hostinger",
    menu: "Domains → Manage → DNS / Nameservers → Manage DNS records",
    fields: { name: "Name", value: "Points to" },
    steps: ["open", "clean", "add", "ttlHostinger", "save"],
  },
  {
    id: "godaddy",
    label: "GoDaddy",
    menu: "Domain Portfolio → your domain → DNS → Add New Record",
    fields: { name: "Name", value: "Value" },
    steps: ["open", "clean", "add", "ttlGodaddy", "save"],
  },
  {
    id: "namecheap",
    label: "Namecheap",
    menu: "Domain List → Manage → Advanced DNS → Add New Record",
    fields: { name: "Host", value: "Value" },
    steps: ["open", "clean", "add", "ttlAuto", "save"],
  },
  {
    id: "cloudflare",
    label: "Cloudflare",
    menu: "your domain → DNS → Records → Add record",
    fields: { name: "Name", value: "IPv4 address / Target" },
    steps: ["open", "clean", "add", "ttlCloudflare", "save"],
  },
  {
    id: "egyhosting",
    label: "EgyHosting",
    menu: null,
    fields: { name: "Name / Host", value: "Value / Points to" },
    steps: ["openGeneric", "clean", "add", "ttlNumber", "save"],
  },
  {
    id: "other",
    label: "Other",
    menu: null,
    fields: { name: "Name / Host", value: "Value / Points to" },
    steps: ["openGeneric", "clean", "add", "ttlNumber", "save"],
  },
];
