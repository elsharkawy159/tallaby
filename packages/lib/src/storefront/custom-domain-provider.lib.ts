/**
 * Seller custom domains: what every domain provider shares, without any
 * server code (client components import the types and `splitDomain`).
 *
 * Two providers run side by side (docs/plans/hetzner-migration.md §7.3 #3):
 * `vercel` (every row before 0177; the domain and its www are attached to the
 * ecommerce Vercel project) and `cloudflare` (Cloudflare for SaaS custom
 * hostnames on the tallaby.com zone). Each row stores its own provider; the
 * server implementations live in custom-domain-provider.ts.
 */

export const CUSTOM_DOMAIN_PROVIDER_IDS = ["vercel", "cloudflare"] as const;
export type CustomDomainProviderId = (typeof CUSTOM_DOMAIN_PROVIDER_IDS)[number];

export function isCustomDomainProviderId(value: unknown): value is CustomDomainProviderId {
  return typeof value === "string" && (CUSTOM_DOMAIN_PROVIDER_IDS as readonly string[]).includes(value);
}

export type CustomDomainStatus = "pending" | "active" | "failed";

/**
 * A record that proves ownership or lets a certificate be issued, as stored
 * in `seller_custom_domains.verification` (the shape Vercel always used).
 */
export type DomainVerificationRecord = {
  type: string; // "TXT"
  domain: string; // "_vercel.faster-eg.com", "_cf-custom-hostname.faster-eg.com"
  value: string;
  reason: string;
};

/** Where `domain` stands at its provider. Never written by the provider itself. */
export type CustomDomainCheck = {
  status: CustomDomainStatus;
  verification: DomainVerificationRecord[] | null;
  /** "unverified" | "dns" | "not_attached" while not active. */
  lastError: string | null;
};

/**
 * A record the seller creates so the domain routes to us. `name` is relative
 * to the root domain, as registrars want it: `@`, `www`, `shop`, `www.shop`.
 * `ALIAS` is an apex record pointing at a host name (ALIAS, ANAME or a
 * flattened CNAME, depending on the DNS host).
 */
export type DnsTarget = { type: "A" | "CNAME" | "ALIAS"; name: string; value: string };

export type CustomDomainProviderErrorCode =
  /** Attached to another project or account at the provider. */
  | "taken"
  /** The provider refused the name (malformed, reserved, unsupported TLD). */
  | "invalid"
  /** Domain or hostname limit reached. */
  | "limit"
  /** Missing or wrong env, or the token lacks access. */
  | "config"
  | "failed";

export class CustomDomainProviderError extends Error {
  constructor(
    /** Null when no provider was chosen yet (an unknown provider id). */
    readonly provider: CustomDomainProviderId | null,
    readonly code: CustomDomainProviderErrorCode,
    message: string,
    /** The provider's own error code, for logs. */
    readonly providerCode?: string,
  ) {
    super(message);
  }
}

/** Vercel's targets (unchanged since 0048). */
export const VERCEL_APEX_A_RECORD = "76.76.21.21";
export const VERCEL_CNAME_TARGET = "cname.vercel-dns.com";

/** Cloudflare for SaaS: the host sellers CNAME to, unless CUSTOM_DOMAIN_CNAME_TARGET says otherwise. */
export const DEFAULT_CLOUDFLARE_CNAME_TARGET = "shops.tallaby.com";

/** `www.` + the domain: the second host every custom domain gets. */
export function wwwOf(domain: string): string {
  return `www.${domain}`;
}

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

/** Vercel: `A @ 76.76.21.21` + `CNAME www cname.vercel-dns.com`, or two CNAMEs for a sub-host. */
export function vercelRoutingRecords(domain: string): DnsTarget[] {
  const { label } = splitDomain(domain);
  return label
    ? [
        { type: "CNAME", name: label, value: VERCEL_CNAME_TARGET },
        { type: "CNAME", name: `www.${label}`, value: VERCEL_CNAME_TARGET },
      ]
    : [
        { type: "A", name: "@", value: VERCEL_APEX_A_RECORD },
        { type: "CNAME", name: "www", value: VERCEL_CNAME_TARGET },
      ];
}

/**
 * Cloudflare for SaaS: everything CNAMEs to the fallback-origin host. The
 * Free plan has no apex A target, so the root needs an ALIAS (or a flattened
 * CNAME) to the same host.
 */
export function cloudflareRoutingRecords(domain: string, target: string = DEFAULT_CLOUDFLARE_CNAME_TARGET): DnsTarget[] {
  const { label } = splitDomain(domain);
  return label
    ? [
        { type: "CNAME", name: label, value: target },
        { type: "CNAME", name: `www.${label}`, value: target },
      ]
    : [
        { type: "ALIAS", name: "@", value: target },
        { type: "CNAME", name: "www", value: target },
      ];
}
