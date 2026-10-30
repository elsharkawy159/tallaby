/**
 * Store apps and integrations (PLAN.md §9, P7-01). Pure and edge-safe.
 *
 * Every provider listed here exists in the `store_integrations.provider`
 * CHECK (0056; `bosta` from 0106; `paymob`, `kashier` and `wassalha` from 0130).
 * Where each one shows up in the dashboard is catalog.ts. Public identifiers live in `config`; secrets only ever go
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
  "bosta",
  "paymob",
  "kashier",
  "wassalha",
] as const;

export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export type IntegrationCategory = "tracking" | "export" | "import" | "shipping" | "payments";

/**
 * - `identifier`: the seller pastes a public id, which is validated and
 *   rendered through a fixed script template on that store's host only.
 * - `credentials`: a secret token, encrypted at rest.
 * - `oauth`: a connect flow with the provider.
 * - `settings`: public settings only (no secret, no script), e.g. Wassalha.
 */
export type IntegrationKind = "identifier" | "credentials" | "oauth" | "settings";

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
  meta_capi: { provider: "meta_capi", category: "tracking", kind: "credentials", availability: "available" },
  tiktok_pixel: { provider: "tiktok_pixel", category: "tracking", kind: "identifier", availability: "soon", idField: "pixelId" },
  snapchat_pixel: { provider: "snapchat_pixel", category: "tracking", kind: "identifier", availability: "soon", idField: "pixelId" },
  google_sheets: { provider: "google_sheets", category: "export", kind: "oauth", availability: "available" },
  shopify_import: { provider: "shopify_import", category: "import", kind: "credentials", availability: "available" },
  bosta: { provider: "bosta", category: "shipping", kind: "credentials", availability: "available" },
  // The seller's own card gateway (ROADMAP.md F-39). Managed on Store settings ›
  // Payment methods, not the Apps page; see payments/store-gateways.*.
  paymob: { provider: "paymob", category: "payments", kind: "credentials", availability: "available" },
  kashier: { provider: "kashier", category: "payments", kind: "credentials", availability: "available" },
  // Wassalha (Egypt Post): no API; orders go out as its Excel upload sheet
  // (ROADMAP.md F-12c). Public settings only, no secret.
  wassalha: { provider: "wassalha", category: "shipping", kind: "settings", availability: "available" },
};

export function isIntegrationProvider(value: unknown): value is IntegrationProvider {
  return typeof value === "string" && (INTEGRATION_PROVIDERS as readonly string[]).includes(value);
}

export function getIntegration(provider: string): IntegrationDefinition | null {
  return isIntegrationProvider(provider) ? INTEGRATIONS[provider] : null;
}

export type IntegrationStatus = "connected" | "error" | "disconnected";

/** Public tracking ids rendered on one store's storefront (P7-03). */
export type StorefrontTrackingConfig = {
  metaPixelId: string | null;
  ga4MeasurementId: string | null;
  gtmContainerId: string | null;
  /**
   * Meta events the store's browser Pixel must not send (F-30): switched-off
   * events, plus Purchase when it is sent on delivery. Absent = none blocked.
   */
  metaBlockedEvents?: string[];
};
