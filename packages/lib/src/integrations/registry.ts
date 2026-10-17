/**
 * Store apps and integrations (PLAN.md §9, P7-01). Pure and edge-safe.
 *
 * Every provider listed here exists in the `store_integrations.provider`
 * CHECK (0056). Public identifiers live in `config`; secrets only ever go
 * through `encryptCredentials` (crypto.server.ts).
 */

export const INTEGRATION_PROVIDERS = [
  "meta_pixel",
  "google_analytics",
  "google_tag_manager",
  "meta_capi",
  "tiktok_pixel",
  "snapchat_pixel",
  "google_sheets",
  "shopify_import",
] as const;

export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export type IntegrationCategory = "tracking" | "export" | "import";

/**
 * - `identifier`: the seller pastes a public id, which is validated and
 *   rendered through a fixed script template on that store's host only.
 * - `credentials`: a secret token, encrypted at rest.
 * - `oauth`: a connect flow with the provider.
 */
export type IntegrationKind = "identifier" | "credentials" | "oauth";

export type IntegrationAvailability = "available" | "soon";

export type IntegrationDefinition = {
  provider: IntegrationProvider;
  category: IntegrationCategory;
  kind: IntegrationKind;
  availability: IntegrationAvailability;
  /** The public config key holding the identifier, for `identifier` providers. */
  idField?: "pixelId" | "measurementId" | "containerId";
  /** Shown before connecting: GTM runs whatever tags the seller configures (D18). */
  warnsAboutSellerScripts?: boolean;
};

export const INTEGRATIONS: Record<IntegrationProvider, IntegrationDefinition> = {
  meta_pixel: { provider: "meta_pixel", category: "tracking", kind: "identifier", availability: "available", idField: "pixelId" },
  google_analytics: {
    provider: "google_analytics",
    category: "tracking",
    kind: "identifier",
    availability: "available",
    idField: "measurementId",
  },
  google_tag_manager: {
    provider: "google_tag_manager",
    category: "tracking",
    kind: "identifier",
    availability: "available",
    idField: "containerId",
    warnsAboutSellerScripts: true,
  },
  meta_capi: { provider: "meta_capi", category: "tracking", kind: "credentials", availability: "soon" },
  tiktok_pixel: { provider: "tiktok_pixel", category: "tracking", kind: "identifier", availability: "soon", idField: "pixelId" },
  snapchat_pixel: { provider: "snapchat_pixel", category: "tracking", kind: "identifier", availability: "soon", idField: "pixelId" },
  google_sheets: { provider: "google_sheets", category: "export", kind: "oauth", availability: "soon" },
  shopify_import: { provider: "shopify_import", category: "import", kind: "credentials", availability: "soon" },
};

export function isIntegrationProvider(value: unknown): value is IntegrationProvider {
  return typeof value === "string" && (INTEGRATION_PROVIDERS as readonly string[]).includes(value);
}

export function getIntegration(provider: string): IntegrationDefinition | null {
  return isIntegrationProvider(provider) ? INTEGRATIONS[provider] : null;
}

export type IntegrationStatus = "connected" | "error" | "disconnected";
