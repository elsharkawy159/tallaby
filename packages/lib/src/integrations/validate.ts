import { z } from "zod";
import { INTEGRATIONS, type IntegrationProvider } from "./registry";

/**
 * Identifier formats (PLAN.md §9.2). Checked before storing **and** again
 * before rendering a storefront script, so a bad row can never inject markup.
 */
export const INTEGRATION_ID_PATTERNS = {
  meta_pixel: /^\d{15,16}$/,
  google_analytics: /^G-[A-Z0-9]{6,12}$/,
  google_tag_manager: /^GTM-[A-Z0-9]{5,10}$/,
  tiktok_pixel: /^[A-Z0-9]{20}$/,
  snapchat_pixel: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
} as const satisfies Partial<Record<IntegrationProvider, RegExp>>;

type IdProvider = keyof typeof INTEGRATION_ID_PATTERNS;

function hasIdPattern(provider: IntegrationProvider): provider is IdProvider {
  return Object.hasOwn(INTEGRATION_ID_PATTERNS, provider);
}

/** Trims and upper-cases what sellers usually paste (GA4/GTM ids, TikTok). */
export function normalizeIntegrationId(provider: IntegrationProvider, raw: string): string {
  const value = raw.trim();
  if (provider === "snapchat_pixel") return value.toLowerCase();
  if (provider === "meta_pixel") return value.replace(/\s+/g, "");
  return value.toUpperCase();
}

export function isValidIntegrationId(provider: IntegrationProvider, value: unknown): value is string {
  return typeof value === "string" && hasIdPattern(provider) && INTEGRATION_ID_PATTERNS[provider].test(value);
}

export type IdentifierConfig = Partial<Record<"pixelId" | "measurementId" | "containerId", string>>;

export type ValidateConfigResult =
  | { success: true; config: IdentifierConfig }
  | { success: false; error: "unsupported" | "invalid_id" };

/** Validates the public config for an identifier provider; nothing else is accepted. */
export function validateIdentifierConfig(provider: IntegrationProvider, rawId: unknown): ValidateConfigResult {
  const definition = INTEGRATIONS[provider];
  if (definition.kind !== "identifier" || !definition.idField || !hasIdPattern(provider)) {
    return { success: false, error: "unsupported" };
  }
  const parsed = z.string().max(64).safeParse(rawId);
  if (!parsed.success) return { success: false, error: "invalid_id" };
  const id = normalizeIntegrationId(provider, parsed.data);
  if (!isValidIntegrationId(provider, id)) return { success: false, error: "invalid_id" };
  return { success: true, config: { [definition.idField]: id } };
}

/**
 * Reads the identifier back out of a stored config, or null when it is
 * missing or no longer valid. Storefront rendering must go through this.
 */
export function readIntegrationId(provider: IntegrationProvider, config: unknown): string | null {
  const field = INTEGRATIONS[provider].idField;
  if (!field || !config || typeof config !== "object") return null;
  const value = (config as Record<string, unknown>)[field];
  return isValidIntegrationId(provider, value) ? value : null;
}
