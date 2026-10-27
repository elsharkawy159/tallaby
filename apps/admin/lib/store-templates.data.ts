/**
 * The template gallery cards and template configs, cached exactly like the
 * dashboard (apps/dashboard/lib/store-templates.data.ts; apps cannot import
 * each other). Global admin-authored data with no seller data; the store
 * check stays uncached in listStoreTemplates / getStoreTemplateConfig.
 * Template writes purge `templateTags.catalog()` (refreshTemplateCatalog), so
 * the 24 h TTL is only a backstop (docs/egress-audit.md §1).
 */
import { cacheProfiles, createCachedQuery, templateTags } from "@workspace/cache";
import { listTemplateCards, loadOfferedTemplateConfig, type TemplateCardsLoader, type TemplateConfigLoader } from "@workspace/lib/store-sites/server";

export const loadCachedTemplateCards: TemplateCardsLoader = createCachedQuery({
  name: "templates:cards",
  ttl: cacheProfiles.taxonomy,
  // Templates and sections are code: a deploy brings new trees.
  perDeploy: true,
  tags: () => [templateTags.catalog()],
  query: () => listTemplateCards(),
});

export const loadCachedTemplateConfig: TemplateConfigLoader = createCachedQuery({
  name: "templates:config",
  ttl: cacheProfiles.taxonomy,
  // Templates and sections are code: a deploy brings new trees.
  perDeploy: true,
  tags: (_key: string) => [templateTags.catalog()],
  query: (key: string) => loadOfferedTemplateConfig(key),
});
