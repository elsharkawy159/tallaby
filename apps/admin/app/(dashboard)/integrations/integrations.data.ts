import { adminTags, createCachedQuery } from "@workspace/cache";
import { getIntegrationSummary } from "@workspace/lib/admin/server";

/**
 * Provider summary for the integrations hub: counts only, no seller data in
 * the result, so it may be Data-Cached (docs/admin-saas.md §4.2). Admin
 * integration actions invalidate the tag; seller-side changes show within
 * the 60 s backstop.
 */
export const getCachedIntegrationSummary = createCachedQuery({
  name: "admin:integration-summary",
  ttl: 60,
  tags: () => [adminTags.integrationSummary()],
  query: () => getIntegrationSummary(),
});
