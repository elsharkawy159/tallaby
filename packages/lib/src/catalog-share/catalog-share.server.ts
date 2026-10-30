import { parseIntegrationKey } from "../integrations/crypto.server";
import { deriveCatalogShareKey } from "./catalog-share.lib";

/**
 * The catalog-link HMAC key (ROADMAP.md F-11c), derived from
 * INTEGRATIONS_ENCRYPTION_KEY. Both the dashboard (signs) and the store
 * website (verifies) need that variable. Throws when it is missing.
 */
export function catalogShareKey(): Buffer {
  return deriveCatalogShareKey(parseIntegrationKey());
}
