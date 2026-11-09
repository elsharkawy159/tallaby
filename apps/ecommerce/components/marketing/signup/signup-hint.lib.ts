/**
 * Marketing-site only: hints that ride along a signup but never decide
 * anything. `subdomain` is the store address typed before a Google signup
 * without a valid phone (no full intent), pre-filled on the dashboard's store
 * step, which checks it live and on submit like a typed one. `plan: "pro"`
 * (the Pro button) only sends the new seller to the dashboard's Plans page;
 * the upgrade itself is the seller's own click there. Both are untrusted and
 * cleaned on every read.
 */
export type SignupPlanHint = "pro";
export type SignupHint = { subdomain?: string; plan?: SignupPlanHint };

export function cleanPlanHint(value: unknown): SignupPlanHint | undefined {
  return value === "pro" ? "pro" : undefined;
}

/** Same cleaning as the dashboard's `cleanSubdomainPrefill`. */
export function cleanSubdomainHint(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32) || undefined;
}

export function cleanSignupHint(value: unknown): SignupHint | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const subdomain = cleanSubdomainHint(raw.subdomain);
  const plan = cleanPlanHint(raw.plan);
  if (!subdomain && !plan) return null;
  return { ...(subdomain ? { subdomain } : {}), ...(plan ? { plan } : {}) };
}

/**
 * Where the marketing callback sends a signed-in user who still needs the
 * store step (`${DASHBOARD_URL}signup?…`), or a new seller who came for Pro.
 */
export const PRO_PLAN_PATH = "/settings/plan";

export function dashboardSignupQuery(hint: SignupHint | null): string {
  const params = new URLSearchParams();
  if (hint?.subdomain) params.set("subdomain", hint.subdomain);
  if (hint?.plan === "pro") params.set("next", PRO_PLAN_PATH);
  const query = params.toString();
  return query ? `?${query}` : "";
}
