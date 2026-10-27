/**
 * The template gallery cards and template configs, cached. Templates are
 * global admin-authored data with no seller data, so one entry serves every
 * store; the store check and the store's last install stay uncached in
 * listStoreTemplates / getStoreTemplateConfig. Admin template writes purge
 * `templateTags.catalog()` in every app (refreshTemplateCatalog), so the 24 h
 * TTL is only a backstop. Each refill reads every ~95 KB config, which used to
 * run on every editor open (docs/egress-audit.md §1).
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
