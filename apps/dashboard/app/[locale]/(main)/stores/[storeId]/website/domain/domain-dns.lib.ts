/**
 * Website › Domain › Custom domain: the DNS records a seller adds at their
 * registrar, and short per-registrar steps (owner, 2026-11-10: a seller on
 * Hostinger got stuck on the TTL field). Display only: the records are the
 * same targets the server checks (`packages/lib/src/storefront/vercel-domains.ts`),
 * and nothing here changes how a domain is attached or verified.
 *
 * Step texts are message keys under `settings.customDomain.guide.steps`;
 * registrar field and menu names stay in Latin because the registrars show
 * them in English.
 */

import { DOMAIN_PROVIDERS } from "./domain-providers.lib";

/** Vercel's targets; mirrors VERCEL_APEX_A_RECORD / VERCEL_CNAME_TARGET in vercel-domains.ts. */
export const APEX_A_RECORD = "76.76.21.21";
export const CNAME_TARGET = "cname.vercel-dns.com";

/** TTL we show on every record: 1 hour, accepted by every listed registrar. */
export const RECOMMENDED_TTL = 3600;
/** Any TTL in this range works (Hostinger's input starts at 60). */
export const MIN_TTL = 60;
export const MAX_TTL = 3600;

export type DnsRecord = { type: string; name: string; value: string; ttl: number };

/** Second-level labels used under country TLDs (`store.com.eg` is a root domain, not a subdomain). */
const SECOND_LEVEL = new Set(["com", "net", "org", "co", "edu", "gov", "ac", "sci", "eun", "name", "info", "biz", "ltd", "plc", "me"]);

/**
 * Splits a custom domain into its root domain and the host label in front of
 * it: `faster-eg.com` → label null; `shop.faster-eg.com` → label `shop`;
 * `faster.com.eg` → label null. A small heuristic, not the public suffix list.
 */
export function splitDomain(domain: string): { root: string; label: string | null } {
  const parts = domain.toLowerCase().split(".").filter(Boolean);
  const tld = parts.at(-1) ?? "";
  const rootSize = parts.length >= 3 && tld.length === 2 && SECOND_LEVEL.has(parts.at(-2) ?? "") ? 3 : 2;
  if (parts.length <= rootSize) return { root: parts.join("."), label: null };
  return { root: parts.slice(-rootSize).join("."), label: parts.slice(0, -rootSize).join(".") };
}

/**
 * The records for `domain` (always stored without `www.`) and its `www.`
 * redirect, plus Vercel's ownership TXT records. Names are what registrars
 * expect: `@` for the root, the host part otherwise.
 */
export function dnsRecords(domain: string, verification: readonly { type: string; domain: string; value: string }[] = []): DnsRecord[] {
  const { root, label } = splitDomain(domain);
  const records: DnsRecord[] = label
    ? [
        { type: "CNAME", name: label, value: CNAME_TARGET, ttl: RECOMMENDED_TTL },
        { type: "CNAME", name: `www.${label}`, value: CNAME_TARGET, ttl: RECOMMENDED_TTL },
      ]
    : [
        { type: "A", name: "@", value: APEX_A_RECORD, ttl: RECOMMENDED_TTL },
        { type: "CNAME", name: "www", value: CNAME_TARGET, ttl: RECOMMENDED_TTL },
      ];
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
