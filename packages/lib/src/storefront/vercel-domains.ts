/**
 * Seller custom domains on Vercel: attaching `faster-eg.com` (and its `www`
 * redirect) to the ecommerce project, so Vercel routes it to us and issues
 * its SSL certificate.
 *
 * Server-only. Needs STOREFRONT_VERCEL_TOKEN, STOREFRONT_VERCEL_PROJECT_ID (the ecommerce
 * project) and, for team projects, STOREFRONT_VERCEL_TEAM_ID.
 */

const API = "https://api.vercel.com";

/** DNS records the seller creates so the domain points at Vercel. */
export const VERCEL_APEX_A_RECORD = "76.76.21.21";
export const VERCEL_CNAME_TARGET = "cname.vercel-dns.com";

export type VercelVerificationRecord = {
  type: string; // "TXT"
  domain: string; // "_vercel.faster-eg.com"
  value: string; // "vc-domain-verify=…"
  reason: string;
};

export type VercelProjectDomain = {
  name: string;
  apexName: string;
  verified: boolean;
  redirect?: string | null;
  verification?: VercelVerificationRecord[];
};

export type VercelDomainError =
  /** Attached to another Vercel project or account. */
  | "taken"
  /** Vercel refused the name (malformed, reserved, unsupported TLD). */
  | "invalid"
  /** Project domain limit reached. */
  | "limit"
  /** Missing or wrong env, or the token lacks access. */
  | "config"
  | "failed";

export class VercelDomainsError extends Error {
  constructor(
    readonly code: VercelDomainError,
    message: string,
    readonly vercelCode?: string,
  ) {
    super(message);
  }
}

function config() {
  const token = process.env.STOREFRONT_VERCEL_TOKEN;
  const projectId = process.env.STOREFRONT_VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    throw new VercelDomainsError(
      "config",
      "STOREFRONT_VERCEL_TOKEN and STOREFRONT_VERCEL_PROJECT_ID must be set to manage custom domains",
    );
  }
  return { token, projectId, teamId: process.env.STOREFRONT_VERCEL_TEAM_ID };
}

function mapError(status: number, code: string | undefined): VercelDomainError {
  if (status === 401 || status === 403) return "config";
  if (code === "domain_limit_reached" || code === "too_many_domains") return "limit";
  if (
    status === 409 ||
    code === "domain_already_in_use" ||
    code === "domain_taken" ||
    code === "existing_project_domain"
  ) {
    return "taken";
  }
  if (status === 400 || code === "invalid_domain" || code === "invalid_name") {
    return "invalid";
  }
  return "failed";
}

async function vercel<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
): Promise<{ status: number; data: T }> {
  const { token, teamId } = config();
  const url = new URL(path, API);
  if (teamId) url.searchParams.set("teamId", teamId);

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: { code?: string; message?: string };
  };

  if (!response.ok && response.status !== 404) {
    const code = data.error?.code;
    throw new VercelDomainsError(
      mapError(response.status, code),
      data.error?.message || `Vercel API ${method} ${path} failed (${response.status})`,
      code,
    );
  }
  return { status: response.status, data };
}

function projectPath(suffix = "") {
  return `/projects/${encodeURIComponent(config().projectId)}/domains${suffix}`;
}

/**
 * Attaches `name` to the project. Pass `redirect` to make it a 308 redirect
 * to another attached domain (used for `www.` → apex). Attaching a domain the
 * project already has is a no-op that returns it.
 */
export async function addProjectDomain(
  name: string,
  options: { redirect?: string } = {},
): Promise<VercelProjectDomain> {
  try {
    const { status, data } = await vercel<VercelProjectDomain>(
      "POST",
      `/v10${projectPath()}`,
      {
        name,
        ...(options.redirect
          ? { redirect: options.redirect, redirectStatusCode: 308 }
          : {}),
      },
    );
    if (status === 404) {
      throw new VercelDomainsError("config", "Vercel project not found; check STOREFRONT_VERCEL_PROJECT_ID");
    }
    return data;
  } catch (error) {
    if (
      error instanceof VercelDomainsError &&
      error.vercelCode === "domain_already_in_use"
    ) {
      // Already ours (e.g. a retry after a partial failure)?
      const existing = await getProjectDomain(name);
      if (existing) return existing;
    }
    throw error;
  }
}

/** The project's view of `name`, or null when it isn't attached. */
export async function getProjectDomain(name: string): Promise<VercelProjectDomain | null> {
  const { status, data } = await vercel<VercelProjectDomain>(
    "GET",
    `/v9${projectPath(`/${encodeURIComponent(name)}`)}`,
  );
  return status === 404 ? null : data;
}

/**
 * Asks Vercel to re-check the TXT ownership record. Returns the domain;
 * `verified` stays false while the record is missing.
 */
export async function verifyProjectDomain(name: string): Promise<VercelProjectDomain | null> {
  try {
    const { status, data } = await vercel<VercelProjectDomain>(
      "POST",
      `/v9${projectPath(`/${encodeURIComponent(name)}/verify`)}`,
    );
    return status === 404 ? null : data;
  } catch (error) {
    // "Not verified yet" comes back as an error; report the current state.
    if (error instanceof VercelDomainsError && error.code !== "config") {
      return getProjectDomain(name);
    }
    throw error;
  }
}

/** Whether DNS for `name` points at Vercel. */
export async function isDomainMisconfigured(name: string): Promise<boolean> {
  const { data } = await vercel<{ misconfigured?: boolean }>(
    "GET",
    `/v6/domains/${encodeURIComponent(name)}/config`,
  );
  return data.misconfigured !== false;
}

/** Detaches `name` from the project. Missing domains are fine. */
export async function removeProjectDomain(name: string): Promise<void> {
  await vercel("DELETE", `/v9${projectPath(`/${encodeURIComponent(name)}`)}`);
}

/** `www.` + apex, the redirect that goes with every custom domain. */
export function wwwOf(domain: string): string {
  return `www.${domain}`;
}
