import type { SubdomainCheck } from "@workspace/lib/stores/server";

/**
 * `unknown`: the check itself failed (e.g. database unreachable). The form
 * still lets the visitor continue; the dashboard signup checks again.
 */
export type SubdomainAvailability =
  | SubdomainCheck
  | { status: "rateLimited" | "unknown"; subdomain: string; suggestions: string[] };

export type SubdomainStatus = SubdomainAvailability["status"];
