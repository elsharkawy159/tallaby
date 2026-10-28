/**
 * Templates gallery and apply (PLAN.md §8.1, §12 step 10, P4-05).
 *
 * `applyStoreTemplate` writes only this store's DRAFTS (design system,
 * header/footer, page drafts) through the pure merge in
 * @workspace/store-sections, so the live revision stays up until the seller
 * publishes. It never touches products, orders, settings, domains,
 * integrations, forms, CMS or other stores. The drafts as they were just
 * before go into `template_installs.previous_draft` (0064), so
 * `undoStoreTemplate` puts back exactly that.
 *
 * Templates come from the code catalog only (owner, 2026-10-27;
 * `template-rows.server.ts`): the store gets the template's plain tree
 * sections, so later template edits never change its site.
 *
 * Before the merge the template is fitted to the store (`prepareTemplateForStore`):
 * its ready-made forms (newsletter, contact…) are found by name or created in
 * the store and bound, the store's name goes into the header and footer, and
 * an English-default store gets English first. Forms created this way stay
 * when the install is undone (they are ordinary store forms).
 *
 * Every function takes the session's sellerId and checks store ownership.
 */
import { z } from "zod";
import {
  and,
  asc,
  db,
  desc,
  eq,
  inArray,
  isNull,
  ne,
  sellers,
  sql,
  storeDesignSystems,
  storeForms,
  storePages,
  stores,
  templateInstalls,
} from "@workspace/db";
import {
  MAX_PAGES,
  designSystemSchema,
  mergeTemplateIntoDraft,
  pageContentSchema,
  prepareTemplateForStore,
  sectionInstanceSchema,
  siteConfigSchema,
  templateEssentials,
  templateFormNeeds,
  templateLibraryKeys,
  templateOutline,
  validateSiteConfig,
  type OverrideKeys,
  type PageContent,
  type SectionInstance,
  type SiteConfig,
} from "@workspace/store-sections";
import { getCodeTemplate, templateMeta, type TemplateMeta } from "@workspace/store-sections/templates";
import { createStoreForm } from "../store-forms/server";
import type { FormInput } from "../store-forms/store-forms.lib";
import { ensureStoreSiteScaffold } from "../stores/server";
import { codeTemplateConfig, getPublicTemplate, offeredTemplates } from "./template-rows.server";
import { storeTemplateChosen } from "./template-choice.server";

export { getPublicTemplate, getTemplateMeta, loadDefaultTemplate, type DbTemplate } from "./template-rows.server";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TEMPLATE_KEY_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

export type TemplateResult<T, E extends string> = { success: true; data: T } | { success: false; error: E };

export type TemplateOptions = {
  /** Section registry (id → newest version), from storeSectionRegistry.allowedSections(). */
  allowedSections?: Readonly<Record<string, number>>;
  /** Seller-content prop keys per section, from contentOverrideKeys(storeSectionRegistry). */
  overrideKeys?: OverrideKeys;
  /**
   * Builds a ready-made form the template needs (`newsletter`, `contact`…)
   * in the store's default language. A kind it returns nothing for leaves its
   * form section unset (hidden on the storefront until the seller picks one).
   */
  formInput?: (kind: string, locale: "ar" | "en") => FormInput | undefined | Promise<FormInput | undefined>;
};

class TemplateError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

type Localized = { ar?: string; en?: string };
const localized = (value: unknown): Localized => {
  const v = (value ?? {}) as Record<string, unknown>;
  return {
    ...(typeof v.ar === "string" && { ar: v.ar }),
    ...(typeof v.en === "string" && { en: v.en }),
  };
};

async function ownStore(q: Queryable, sellerId: string, storeId: string, lock = false) {
  if (!UUID_RE.test(storeId)) return null;
  const query = q
    .select({
      id: stores.id,
      name: stores.name,
      status: stores.status,
      templateKey: stores.templateKey,
      previousTemplateKey: stores.previousTemplateKey,
      defaultLocale: stores.defaultLocale,
      sharedHeader: stores.sharedHeader,
      sharedFooter: stores.sharedFooter,
    })
    .from(stores)
    .innerJoin(sellers, eq(sellers.id, stores.sellerId))
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .limit(1);
  const [row] = lock ? await query.for("update", { of: stores }) : await query;
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export type StoreTemplateCard = {
  id: string;
  key: string;
  name: Localized;
  description: Localized;
  category: string;
  thumbnailUrl: string | null;
  isDefault: boolean;
  isPremium: boolean;
  version: number;
  /** Gallery position: templates are numbered as they are added, so a higher one is newer. */
  sortOrder: number;
  /** Colour swatches (`templates.meta`, code fallback). */
  palette: string[];
  /** Page names in both languages by slug (`templates.meta`, code fallback). */
  pageNames: TemplateMeta["pageNames"];
  /** Ready-made forms "Use template" adds (`newsletter`, `contact`…), from the current version. */
  formKinds: string[];
  /** Section ids per page, for the card's outline preview. */
  outline: { slug: string; isHome: boolean; name: string; sections: string[] }[];
};

export type StoreTemplateInstall = {
  id: string;
  templateKey: string;
  installedAt: string;
  /** The latest install, not undone, with its saved drafts. */
  canUndo: boolean;
};

export type StoreTemplateGallery = {
  /** The template the store's drafts started from or last applied (`stores.template_key`; Tallaby Classic for a new store's placeholder). */
  currentKey: string;
  /** The seller picked a template (an install not undone) or the site was ever live (storeTemplateChosen). */
  templateChosen: boolean;
  templates: StoreTemplateCard[];
  lastInstall: StoreTemplateInstall | null;
};

/** Loads the offered template cards; apps pass a cached one (`templateTags.catalog()`). */
export type TemplateCardsLoader = () => Promise<StoreTemplateCard[]>;
/** Loads an offered template's current config by key; apps pass a cached one (`templateTags.catalog()`). */
export type TemplateConfigLoader = (templateKey: string) => Promise<SiteConfig | null>;

/**
 * Every offered template as a gallery card, from the code catalog. Each card
 * is built from a ~95 KB config, so apps still cache the list.
 */
export async function listTemplateCards(_q?: Queryable): Promise<StoreTemplateCard[]> {
  const cards: StoreTemplateCard[] = [];
  for (const template of offeredTemplates()) {
    const config = codeTemplateConfig(template.key);
    if (!config) continue; // A broken template is never offered.
    const meta = templateMeta(template);
    cards.push({
      id: template.key,
      key: template.key,
      name: localized(template.name),
      description: localized(template.description),
      category: template.category,
      thumbnailUrl: null,
      isDefault: !!template.isDefault,
      isPremium: false,
      version: template.version,
      sortOrder: template.sortOrder,
      palette: meta.palette,
      pageNames: meta.pageNames,
      formKinds: [...templateFormNeeds(config)],
      outline: templateOutline(config),
    });
  }
  return cards;
}

/** Active templates with their current version, plus this store's last install. Null for a foreign store. */
export async function listStoreTemplates(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
  loadCards: TemplateCardsLoader = () => listTemplateCards(q),
): Promise<StoreTemplateGallery | null> {
  const store = await ownStore(q, sellerId, storeId);
  if (!store) return null;

  const cards = await loadCards();
  const [install] = await q
    .select({
      id: templateInstalls.id,
      templateKey: templateInstalls.templateKey,
      installedAt: templateInstalls.installedAt,
      undoneAt: templateInstalls.undoneAt,
      hasDraft: sql<boolean>`${templateInstalls.previousDraft} IS NOT NULL`,
    })
    .from(templateInstalls)
    .where(eq(templateInstalls.storeId, storeId))
    .orderBy(desc(templateInstalls.installedAt))
    .limit(1);

  return {
    currentKey: store.templateKey,
    templateChosen: await storeTemplateChosen(q, store.id),
    templates: cards,
    lastInstall: install
      ? { id: install.id, templateKey: install.templateKey, installedAt: install.installedAt, canUndo: !install.undoneAt && install.hasDraft }
      : null,
  };
}

/**
 * One active template's current config, for the editor's preview dialog
 * (owner request 2026-10-18). Null for a foreign store, an unknown or
 * inactive key, or a broken version (the gallery hides those too).
 */
export async function getStoreTemplateConfig(
  sellerId: string,
  storeId: string,
  templateKey: string,
  q: Queryable = db,
  loadConfig: TemplateConfigLoader = (key) => loadOfferedTemplateConfig(key, q),
): Promise<SiteConfig | null> {
  if (!TEMPLATE_KEY_RE.test(templateKey)) return null;
  const store = await ownStore(q, sellerId, storeId);
  if (!store) return null;
  // Re-parsed: a cached loader hands back plain JSON.
  const config = siteConfigSchema.safeParse(await loadConfig(templateKey));
  return config.success ? config.data : null;
}

/** An offered template's config by key (code catalog), with no store involved. Null for an unknown key or a broken config. */
export async function loadOfferedTemplateConfig(templateKey: string, _q?: Queryable): Promise<SiteConfig | null> {
  return codeTemplateConfig(templateKey);
}

/**
 * The library design keys of the store's current template, first use first,
 * so the editor's Add › Sections lists them first in each category (owner,
 * 2026-10-23; `preferTemplatePresets`). Empty for a foreign store, a store
 * with no offered template or a broken version.
 */
export async function getStoreTemplateLibraryKeys(
  sellerId: string,
  storeId: string,
  templateKey: string,
  q: Queryable = db,
  loadConfig?: TemplateConfigLoader,
): Promise<string[]> {
  if (!templateKey) return [];
  const config = await getStoreTemplateConfig(sellerId, storeId, templateKey, q, loadConfig);
  return config ? templateLibraryKeys(config, templateKey) : [];
}

/**
 * One active template's current config with no store involved, for the
 * public template gallery on tallaby.com. Templates are global and
 * admin-authored, so nothing here belongs to a seller. Null for an unknown,
 * inactive or deleted key, or a broken version.
 */
export async function getPublicTemplateConfig(templateKey: string, q: Queryable = db): Promise<SiteConfig | null> {
  return (await getPublicTemplate(templateKey, q))?.config ?? null;
}

// ---------------------------------------------------------------------------
// Apply / undo
// ---------------------------------------------------------------------------

/** What `previous_draft` holds: the store's drafts just before an install. */
const previousDraftSchema = z.object({
  templateKey: z.string(),
  previousTemplateKey: z.string().nullable(),
  designSystem: designSystemSchema,
  header: sectionInstanceSchema.nullable(),
  footer: sectionInstanceSchema.nullable(),
  pages: z.array(z.object({ id: z.string().regex(UUID_RE), content: pageContentSchema })),
  createdPageIds: z.array(z.string().regex(UUID_RE)),
});
type PreviousDraft = z.output<typeof previousDraftSchema>;

export type ApplyTemplateError = "not_found" | "store_read_only" | "template_not_found" | "premium_template" | "invalid_template" | "too_many_pages";

export type ApplyTemplateResult = { installId: string; templateKey: string; pagesUpdated: number; pagesCreated: number };

const asContent = (value: unknown): PageContent => {
  const parsed = pageContentSchema.safeParse(value);
  return parsed.success ? parsed.data : { sections: [] };
};
const asInstance = (value: unknown): SectionInstance | null => {
  const parsed = sectionInstanceSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

export async function applyStoreTemplate(
  sellerId: string,
  storeId: string,
  templateKey: string,
  installedBy: string,
  options: TemplateOptions = {},
  q: Queryable = db,
): Promise<TemplateResult<ApplyTemplateResult, ApplyTemplateError>> {
  if (typeof templateKey !== "string" || !TEMPLATE_KEY_RE.test(templateKey)) return { success: false, error: "template_not_found" };
  try {
    const data = await q.transaction(async (tx) => {
      const store = await ownStore(tx, sellerId, storeId, true);
      if (!store) throw new TemplateError("not_found");
      if (store.status !== "active") throw new TemplateError("store_read_only");

      // Templates come from the code catalog; the theme store (paid templates, §8.1) is not built yet.
      const template = getCodeTemplate(templateKey);
      const code = template && codeTemplateConfig(template.key);
      if (!template) throw new TemplateError("template_not_found");
      if (!code) throw new TemplateError("invalid_template");
      const config = validateSiteConfig(code, { allowedSections: options.allowedSections });
      if (!config.success) throw new TemplateError("invalid_template");

      await ensureStoreSiteScaffold(tx, storeId);
      const locale = store.defaultLocale === "en" ? "en" : "ar";
      // Only the hero and the sections with the store's own data (owner, 2026-10-23); forms only for sections kept.
      const essentials = templateEssentials(config.data);
      const formIds = await ensureTemplateForms(tx, sellerId, storeId, templateFormNeeds(essentials), (kind) => options.formInput?.(kind, locale));
      const fitted = prepareTemplateForStore(essentials, { defaultLocale: locale, storeName: store.name, formIds });
      const pageNames = templateMeta(template).pageNames;
      const [ds] = await tx
        .select({ colors: storeDesignSystems.colors, typography: storeDesignSystems.typography, spacing: storeDesignSystems.spacing })
        .from(storeDesignSystems)
        .where(eq(storeDesignSystems.storeId, storeId));
      const pages = await tx
        .select({ id: storePages.id, slug: storePages.slug, isHome: storePages.isHome, kind: storePages.kind, draftContent: storePages.draftContent, orderIndex: storePages.orderIndex })
        .from(storePages)
        .where(eq(storePages.storeId, storeId))
        .orderBy(asc(storePages.orderIndex), asc(storePages.createdAt));

      const designSystem = designSystemSchema.safeParse(ds ?? {});
      const current = {
        designSystem: designSystem.success ? designSystem.data : { colors: {}, typography: {}, spacing: {} },
        header: asInstance(store.sharedHeader),
        footer: asInstance(store.sharedFooter),
        pages: pages.map((p) => ({ slug: p.slug, isHome: p.isHome, kind: p.kind === "product" ? ("product" as const) : ("page" as const), content: asContent(p.draftContent) })),
      };
      const merged = mergeTemplateIntoDraft(current, fitted, options.overrideKeys ?? {});

      const created = merged.pages.filter((p) => p.targetSlug === null);
      if (pages.length + created.length > MAX_PAGES) throw new TemplateError("too_many_pages");

      await tx
        .update(storeDesignSystems)
        .set({ ...merged.designSystem, version: sql`${storeDesignSystems.version} + 1`, updatedAt: sql`now()` })
        .where(eq(storeDesignSystems.storeId, storeId));
      await tx
        .update(stores)
        .set({
          sharedHeader: merged.header,
          sharedFooter: merged.footer,
          chromeVersion: sql`${stores.chromeVersion} + 1`,
          templateKey: template.key,
          previousTemplateKey: store.templateKey,
          updatedAt: sql`now()`,
        })
        .where(eq(stores.id, storeId));

      const bySlug = new Map(pages.map((p) => [p.slug, p]));
      let order = pages.reduce((m, p) => Math.max(m, p.orderIndex), 0);
      const createdPageIds: string[] = [];
      let updated = 0;
      for (const page of merged.pages) {
        const target = page.targetSlug ? bySlug.get(page.targetSlug) : undefined;
        if (target) {
          // Only the content changes; the store keeps its page names, SEO and menu.
          await tx
            .update(storePages)
            .set({ draftContent: page.content, draftVersion: sql`${storePages.draftVersion} + 1`, updatedAt: sql`now()` })
            .where(and(eq(storePages.id, target.id), eq(storePages.storeId, storeId)));
          updated += 1;
        } else {
          order += 1;
          const [row] = await tx
            .insert(storePages)
            .values({
              storeId,
              slug: page.slug,
              isHome: false,
              kind: page.kind,
              name: pageNames[page.slug] ?? { [store.defaultLocale]: page.name },
              seo: page.seo,
              showInNav: page.showInNav,
              orderIndex: order,
              draftContent: page.content,
            })
            .onConflictDoNothing()
            .returning({ id: storePages.id });
          if (row) createdPageIds.push(row.id);
        }
      }

      const previous: PreviousDraft = {
        templateKey: store.templateKey,
        previousTemplateKey: store.previousTemplateKey,
        designSystem: current.designSystem,
        header: current.header,
        footer: current.footer,
        pages: pages.map((p) => ({ id: p.id, content: asContent(p.draftContent) })),
        createdPageIds,
      };
      const [install] = await tx
        .insert(templateInstalls)
        .values({ templateKey: template.key, templateVersion: template.version, storeId, installedBy, previousDraft: previous })
        .returning({ id: templateInstalls.id });

      return { installId: install!.id, templateKey: template.key, pagesUpdated: updated, pagesCreated: createdPageIds.length };
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof TemplateError) return { success: false, error: error.code as ApplyTemplateError };
    throw error;
  }
}

/**
 * This store's form of each needed kind: one with the same name if the store
 * has it (a re-apply reuses it), else a new one. A kind with no input, or a
 * store at its form limit, gets none. Runs inside the apply transaction.
 */
async function ensureTemplateForms(
  tx: Tx,
  sellerId: string,
  storeId: string,
  needs: readonly string[],
  build: (kind: string) => FormInput | undefined | Promise<FormInput | undefined>,
): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  for (const kind of needs) {
    const input = await build(kind);
    if (!input) continue;
    const [existing] = await tx
      .select({ id: storeForms.id })
      .from(storeForms)
      .where(and(eq(storeForms.storeId, storeId), eq(storeForms.name, input.name)))
      .orderBy(asc(storeForms.createdAt))
      .limit(1);
    if (existing) {
      ids[kind] = existing.id;
      continue;
    }
    const created = await createStoreForm(sellerId, storeId, input, tx);
    if (created.success) ids[kind] = created.data.id;
  }
  return ids;
}

export type UndoTemplateError = "not_found" | "store_read_only" | "nothing_to_undo";

/**
 * Puts back the drafts saved by this store's latest install (changes made
 * after it are replaced too; the UI says so). Pages the install created are
 * removed, except the product page (a store keeps one; it keeps the
 * template's content). Only the latest install can be undone, once.
 */
export async function undoStoreTemplate(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<TemplateResult<{ templateKey: string }, UndoTemplateError>> {
  try {
    const data = await q.transaction(async (tx) => {
      const store = await ownStore(tx, sellerId, storeId, true);
      if (!store) throw new TemplateError("not_found");
      if (store.status !== "active") throw new TemplateError("store_read_only");

      const [install] = await tx
        .select({ id: templateInstalls.id, undoneAt: templateInstalls.undoneAt, previousDraft: templateInstalls.previousDraft })
        .from(templateInstalls)
        .where(eq(templateInstalls.storeId, storeId))
        .orderBy(desc(templateInstalls.installedAt))
        .limit(1);
      const previous = previousDraftSchema.safeParse(install?.previousDraft);
      if (!install || install.undoneAt || !previous.success) throw new TemplateError("nothing_to_undo");
      const saved = previous.data;

      await tx
        .update(storeDesignSystems)
        .set({ ...saved.designSystem, version: sql`${storeDesignSystems.version} + 1`, updatedAt: sql`now()` })
        .where(eq(storeDesignSystems.storeId, storeId));
      await tx
        .update(stores)
        .set({
          sharedHeader: saved.header,
          sharedFooter: saved.footer,
          chromeVersion: sql`${stores.chromeVersion} + 1`,
          templateKey: saved.templateKey,
          previousTemplateKey: saved.previousTemplateKey,
          updatedAt: sql`now()`,
        })
        .where(eq(stores.id, storeId));
      for (const page of saved.pages) {
        await tx
          .update(storePages)
          .set({ draftContent: page.content, draftVersion: sql`${storePages.draftVersion} + 1`, updatedAt: sql`now()` })
          .where(and(eq(storePages.id, page.id), eq(storePages.storeId, storeId)));
      }
      if (saved.createdPageIds.length) {
        await tx
          .delete(storePages)
          .where(
            and(
              eq(storePages.storeId, storeId),
              eq(storePages.isHome, false),
              // The product page stays: a store always keeps one (spec §8); one that existed
              // before the install had its content restored above with the other pages.
              ne(storePages.kind, "product"),
              inArray(storePages.id, saved.createdPageIds),
            ),
          );
      }
      await tx.update(templateInstalls).set({ undoneAt: sql`now()` }).where(eq(templateInstalls.id, install.id));
      return { templateKey: saved.templateKey };
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof TemplateError) return { success: false, error: error.code as UndoTemplateError };
    throw error;
  }
}
