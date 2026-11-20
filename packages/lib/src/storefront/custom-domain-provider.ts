/**
 * Seller custom domains: the provider switch (docs/plans/hetzner-migration.md
 * §7.3 #3). `vercel` is today's code unchanged; `cloudflare` is Cloudflare for
 * SaaS. A row is always handled by its own `provider` column (0177); only new
 * rows take the provider from CUSTOM_DOMAIN_PROVIDER (default `vercel`). The
 * provider never comes from the client.
 *
 * Server-only.
 */

import {
  attachCloudflareDomain,
  checkCloudflareDomain,
  cloudflareCnameTarget,
  detachCloudflareDomain,
} from "./cloudflare-domains";
import {
  CustomDomainProviderError,
  cloudflareRoutingRecords,
  isCustomDomainProviderId,
  vercelRoutingRecords,
  wwwOf,
  type CustomDomainCheck,
  type CustomDomainProviderId,
  type CustomDomainStatus,
  type DnsTarget,
} from "./custom-domain-provider.lib";
import {
  addProjectDomain,
  getProjectDomain,
  isDomainMisconfigured,
  removeProjectDomain,
  verifyProjectDomain,
} from "./vercel-domains";

export * from "./custom-domain-provider.lib";

/** Stored in `seller_custom_domains.provider_meta`; null when the provider needs nothing. */
export type CustomDomainProviderMeta = Record<string, unknown>;

export interface CustomDomainProvider {
  readonly id: CustomDomainProviderId;
  /**
   * Attaches the domain and its `www.`. Idempotent; on a partial failure it
   * detaches what it attached and throws CustomDomainProviderError.
   */
  attach(domain: string): Promise<{ meta: CustomDomainProviderMeta | null }>;
  /**
   * Detaches `www.` then the domain; missing is fine. `bestEffort` tries both
   * and never throws (cleanup after a failed save).
   */
  detach(domain: string, options?: { meta?: unknown; bestEffort?: boolean }): Promise<void>;
  /** Where the domain stands now. Reads only; the caller saves it. */
  check(domain: string, previous: CustomDomainStatus, options?: { meta?: unknown }): Promise<CustomDomainCheck>;
  /** The routing records the seller creates (not the ownership TXT ones). Pure. */
  routingRecords(domain: string): DnsTarget[];
}

/**
 * Vercel, exactly as before 0177: the domain plus a 308 `www.` redirect on
 * the ecommerce project; active once Vercel has verified ownership and DNS
 * points at it.
 */
export const vercelDomainProvider: CustomDomainProvider = {
  id: "vercel",
  async attach(domain) {
    try {
      await addProjectDomain(domain);
      await addProjectDomain(wwwOf(domain), { redirect: domain });
    } catch (error) {
      // Don't leave a half-attached domain behind.
      await Promise.allSettled([removeProjectDomain(wwwOf(domain)), removeProjectDomain(domain)]);
      throw error;
    }
    return { meta: null };
  },
  async detach(domain, options = {}) {
    if (options.bestEffort) {
      await Promise.allSettled([removeProjectDomain(wwwOf(domain)), removeProjectDomain(domain)]);
      return;
    }
    await removeProjectDomain(wwwOf(domain));
    await removeProjectDomain(domain);
  },
  async check(domain, previous) {
    let project = await getProjectDomain(domain);
    if (project && !project.verified) {
      project = (await verifyProjectDomain(domain)) ?? project;
    }

    const notReady = previous === "active" ? "failed" : "pending";
    if (!project) {
      return { status: "failed", verification: null, lastError: "not_attached" };
    }
    if (!project.verified) {
      return {
        status: notReady,
        verification: project.verification ?? null,
        lastError: "unverified",
      };
    }
    if (await isDomainMisconfigured(domain)) {
      return { status: notReady, verification: null, lastError: "dns" };
    }
    return { status: "active", verification: null, lastError: null };
  },
  routingRecords: vercelRoutingRecords,
};

/** Cloudflare for SaaS custom hostnames on the tallaby.com zone (cloudflare-domains.ts). */
export const cloudflareDomainProvider: CustomDomainProvider = {
  id: "cloudflare",
  async attach(domain) {
    return { meta: await attachCloudflareDomain(domain) };
  },
  detach: (domain, options) => detachCloudflareDomain(domain, options),
  check: (domain, previous, options) => checkCloudflareDomain(domain, previous, options),
  routingRecords: (domain) => cloudflareRoutingRecords(domain, cloudflareCnameTarget()),
};

const PROVIDERS: Record<CustomDomainProviderId, CustomDomainProvider> = {
  vercel: vercelDomainProvider,
  cloudflare: cloudflareDomainProvider,
};

/** The provider that holds a row (`seller_custom_domains.provider`). */
export function customDomainProvider(id: string): CustomDomainProvider {
  if (!isCustomDomainProviderId(id)) {
    throw new CustomDomainProviderError(null, "config", `Unknown custom domain provider "${id}"`);
  }
  return PROVIDERS[id];
}

/**
 * The provider for a NEW domain: CUSTOM_DOMAIN_PROVIDER, `vercel` when unset.
 * A value we don't know is a config error rather than a silent fallback.
 */
export function newCustomDomainProviderId(env: Record<string, string | undefined> = process.env): CustomDomainProviderId {
  const value = env.CUSTOM_DOMAIN_PROVIDER?.trim().toLowerCase();
  if (!value) return "vercel";
  if (!isCustomDomainProviderId(value)) {
    throw new CustomDomainProviderError(null, "config", `CUSTOM_DOMAIN_PROVIDER must be "vercel" or "cloudflare", got "${value}"`);
  }
  return value;
}
