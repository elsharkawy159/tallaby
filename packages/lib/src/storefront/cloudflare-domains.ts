/**
 * Seller custom domains on Cloudflare for SaaS (docs/plans/hetzner-migration.md
 * §7.2 option A): each domain and its `www.` are custom hostnames on the
 * tallaby.com zone. Traffic for them goes to the zone's fallback origin
 * (shops.tallaby.com), and Cloudflare issues and renews the certificates.
 *
 * Server-only. Needs CLOUDFLARE_SAAS_API_TOKEN (zone permission "SSL and
 * Certificates: Edit", never logged) and CLOUDFLARE_ZONE_ID (tallaby.com).
 * CUSTOM_DOMAIN_CNAME_TARGET overrides the host sellers point to.
 */

import {
  CUSTOM_DOMAIN_PRIMARY_WWW,
  CustomDomainProviderError,
  DEFAULT_CLOUDFLARE_CNAME_TARGET,
  type CustomDomainCheck,
  type CustomDomainProviderErrorCode,
  type CustomDomainStatus,
  type DomainVerificationRecord,
  wwwOf,
} from "./custom-domain-provider.lib";

const API = "https://api.cloudflare.com/client/v4";

/** Certificate settings for every hostname: HTTP validation, which passes once the CNAME points to us. */
export const CLOUDFLARE_HOSTNAME_SSL = { method: "http", type: "dv" } as const;

/** What a custom hostname looks like in the API (the fields we read). */
export type CloudflareCustomHostname = {
  id: string;
  hostname: string;
  /** "active" | "pending" | "moved" | "blocked" | "deleted" | … */
  status: string;
  ssl?: {
    /** "active" | "pending_validation" | "initializing" | … */
    status?: string;
    validation_records?: { txt_name?: string; txt_value?: string; http_url?: string; http_body?: string }[];
  } | null;
  /** TXT that proves ownership before DNS points to us: `_cf-custom-hostname.<host>`. */
  ownership_verification?: { type?: string; name?: string; value?: string } | null;
};

/**
 * `provider_meta` for a Cloudflare row: the hostname ids, keyed by hostname,
 * and `primary: "www"` while the domain is served on its `www.` host.
 */
export type CloudflareProviderMeta = { hostnames: Record<string, string>; primary?: typeof CUSTOM_DOMAIN_PRIMARY_WWW };

type CloudflareEnvelope<T> = {
  success?: boolean;
  errors?: { code?: number; message?: string }[];
  result?: T;
};

export function cloudflareCnameTarget(env: Record<string, string | undefined> = process.env): string {
  return env.CUSTOM_DOMAIN_CNAME_TARGET?.trim() || DEFAULT_CLOUDFLARE_CNAME_TARGET;
}

function config() {
  const token = process.env.CLOUDFLARE_SAAS_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) {
    throw new CustomDomainProviderError(
      "cloudflare",
      "config",
      "CLOUDFLARE_SAAS_API_TOKEN and CLOUDFLARE_ZONE_ID must be set to manage custom domains",
    );
  }
  return { token, zoneId };
}

/** Cloudflare's "duplicate custom hostname" error. */
const DUPLICATE_HOSTNAME = 1406;

function mapError(status: number, code: number | undefined): CustomDomainProviderErrorCode {
  if (status === 401 || status === 403) return "config";
  if (status === 409 || code === DUPLICATE_HOSTNAME) return "taken";
  if (status === 400 || status === 422) return "invalid";
  return "failed";
}

async function cloudflare<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
): Promise<{ status: number; result: T | null }> {
  const { token, zoneId } = config();
  const url = new URL(`${API}/zones/${encodeURIComponent(zoneId)}/custom_hostnames${path}`);

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as CloudflareEnvelope<T>;

  if (response.status === 404) return { status: 404, result: null };
  if (!response.ok || data.success === false) {
    const first = data.errors?.[0];
    throw new CustomDomainProviderError(
      "cloudflare",
      mapError(response.status, first?.code),
      first?.message || `Cloudflare API ${method} custom_hostnames${path.split("?")[0]} failed (${response.status})`,
      first?.code !== undefined ? String(first.code) : undefined,
    );
  }
  return { status: response.status, result: data.result ?? null };
}

/** The zone's custom hostname named exactly `hostname`, or null. */
export async function findCustomHostname(hostname: string): Promise<CloudflareCustomHostname | null> {
  const { result } = await cloudflare<CloudflareCustomHostname[]>(
    "GET",
    `?hostname=${encodeURIComponent(hostname)}`,
  );
  return (result ?? []).find((h) => h.hostname === hostname) ?? null;
}

async function getCustomHostname(id: string): Promise<CloudflareCustomHostname | null> {
  const { result } = await cloudflare<CloudflareCustomHostname>("GET", `/${encodeURIComponent(id)}`);
  return result;
}

function metaIds(meta: unknown): Record<string, string> {
  const hostnames = (meta as { hostnames?: unknown } | null | undefined)?.hostnames;
  if (!hostnames || typeof hostnames !== "object") return {};
  return Object.fromEntries(
    Object.entries(hostnames as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

/** By the stored id when there is one, else (or when the id is gone) by name. */
async function resolveHostname(hostname: string, meta: unknown): Promise<CloudflareCustomHostname | null> {
  const id = metaIds(meta)[hostname];
  if (id) {
    const byId = await getCustomHostname(id);
    if (byId && byId.hostname === hostname) return byId;
  }
  return findCustomHostname(hostname);
}

/**
 * Creates the custom hostname, or returns ours when the zone already has it
 * (a retry after a partial failure). A duplicate we cannot find in our zone
 * belongs to someone else: `taken`.
 */
export async function createCustomHostname(hostname: string): Promise<CloudflareCustomHostname> {
  try {
    const { result } = await cloudflare<CloudflareCustomHostname>("POST", "", {
      hostname,
      ssl: CLOUDFLARE_HOSTNAME_SSL,
    });
    if (!result) {
      throw new CustomDomainProviderError("cloudflare", "config", "Cloudflare zone not found; check CLOUDFLARE_ZONE_ID");
    }
    return result;
  } catch (error) {
    if (error instanceof CustomDomainProviderError && error.code === "taken") {
      const existing = await findCustomHostname(hostname);
      if (existing) return existing;
    }
    throw error;
  }
}

/** Deletes `hostname` from the zone. Missing hostnames are fine. */
async function deleteCustomHostname(hostname: string, meta: unknown): Promise<void> {
  const existing = await resolveHostname(hostname, meta);
  if (existing) await cloudflare("DELETE", `/${encodeURIComponent(existing.id)}`);
}

/** Creates the domain and its www. as custom hostnames; on failure removes both again. */
export async function attachCloudflareDomain(domain: string): Promise<CloudflareProviderMeta> {
  try {
    const apex = await createCustomHostname(domain);
    const www = await createCustomHostname(wwwOf(domain));
    return { hostnames: { [apex.hostname]: apex.id, [www.hostname]: www.id } };
  } catch (error) {
    // Don't leave a half-attached domain behind.
    await detachCloudflareDomain(domain, { bestEffort: true });
    throw error;
  }
}

/** Deletes the www. and the domain (www first, as on Vercel). */
export async function detachCloudflareDomain(
  domain: string,
  options: { meta?: unknown; bestEffort?: boolean } = {},
): Promise<void> {
  if (options.bestEffort) {
    await Promise.allSettled([deleteCustomHostname(wwwOf(domain), options.meta), deleteCustomHostname(domain, options.meta)]);
    return;
  }
  await deleteCustomHostname(wwwOf(domain), options.meta);
  await deleteCustomHostname(domain, options.meta);
}

/** Live: Cloudflare routes it and its certificate is issued. */
export function isHostnameLive(hostname: CloudflareCustomHostname): boolean {
  return hostname.status === "active" && hostname.ssl?.status === "active";
}

/** The TXT records that would move `hostname` forward (ownership, then certificate). */
export function hostnameVerificationRecords(hostname: CloudflareCustomHostname): DomainVerificationRecord[] {
  const records: DomainVerificationRecord[] = [];
  const ownership = hostname.ownership_verification;
  if (hostname.status !== "active" && ownership?.name && ownership.value) {
    records.push({ type: "TXT", domain: ownership.name, value: ownership.value, reason: "ownership" });
  }
  if (hostname.ssl?.status !== "active") {
    for (const record of hostname.ssl?.validation_records ?? []) {
      if (record.txt_name && record.txt_value) {
        records.push({ type: "TXT", domain: record.txt_name, value: record.txt_value, reason: "certificate" });
      }
    }
  }
  return records;
}

/**
 * The stored meta with `primary` set for a www-primary domain and removed
 * otherwise; the hostname ids (and anything else stored) are kept.
 */
function metaWithPrimary(meta: unknown, wwwPrimary: boolean): Record<string, unknown> {
  const base = meta && typeof meta === "object" && !Array.isArray(meta) ? { ...(meta as Record<string, unknown>) } : {};
  delete base.primary;
  return wwwPrimary ? { ...base, primary: CUSTOM_DOMAIN_PRIMARY_WWW } : base;
}

/**
 * Where `domain` stands on Cloudflare. Active once its hostname and its
 * certificate are both active; the root is then the public host and `www.`
 * redirects to it. A root that is not live while `www.` is (a DNS host with
 * no ALIAS/ANAME for the root) also makes the domain active, served on
 * `www.` (`meta.primary = "www"`); once the root goes live, the next check
 * makes the root public again. An active check always returns the meta to
 * save. Until then the seller sees the routing records plus any TXT records
 * that validate ahead of the DNS move. A domain that was active and stops
 * being so becomes `failed`.
 */
export async function checkCloudflareDomain(
  domain: string,
  previous: CustomDomainStatus,
  options: { meta?: unknown } = {},
): Promise<CustomDomainCheck> {
  const [apex, www] = await Promise.all([
    resolveHostname(domain, options.meta),
    resolveHostname(wwwOf(domain), options.meta),
  ]);
  if (!apex) return { status: "failed", verification: null, lastError: "not_attached" };
  if (isHostnameLive(apex)) {
    return { status: "active", verification: null, lastError: null, meta: metaWithPrimary(options.meta, false) };
  }
  if (www && isHostnameLive(www)) {
    return { status: "active", verification: null, lastError: null, meta: metaWithPrimary(options.meta, true) };
  }

  const seen = new Set<string>();
  const verification = [apex, ...(www && !isHostnameLive(www) ? [www] : [])]
    .flatMap(hostnameVerificationRecords)
    .filter((record) => {
      const key = `${record.domain} ${record.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return {
    status: previous === "active" ? "failed" : "pending",
    verification: verification.length > 0 ? verification : null,
    lastError: "dns",
  };
}
