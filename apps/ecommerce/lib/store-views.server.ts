import { isValidIntegrationId } from "@workspace/lib/integrations";

/**
 * Tallaby's storefront GTM container (PLAN.md SA-01), from the server-only
 * env STORE_VIEWS_GTM_ID. Unset or malformed: no store-views tag renders.
 */
export function readStoreViewsGtmId(): string | null {
  const id = process.env.STORE_VIEWS_GTM_ID?.trim() ?? "";
  return isValidIntegrationId("google_tag_manager", id) ? id : null;
}
