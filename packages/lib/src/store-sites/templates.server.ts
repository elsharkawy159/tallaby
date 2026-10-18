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
  sellers,
  sql,
  storeDesignSystems,
  storePages,
  stores,
  templateInstalls,
  templateVersions,
  templates,
} from "@workspace/db";
import {
  MAX_PAGES,
  designSystemSchema,
  mergeTemplateIntoDraft,
  pageContentSchema,
  sectionInstanceSchema,
  siteConfigSchema,
  templateOutline,
  validateSiteConfig,
  type OverrideKeys,
  type PageContent,
  type SectionInstance,
} from "@workspace/store-sections";
import { ensureStoreSiteScaffold } from "../stores/server";

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
  currentKey: string;
  templates: StoreTemplateCard[];
  lastInstall: StoreTemplateInstall | null;
};

/** Active templates with their current version, plus this store's last install. Null for a foreign store. */
export async function listStoreTemplates(sellerId: string, storeId: string, q: Queryable = db): Promise<StoreTemplateGallery | null> {
  const store = await ownStore(q, sellerId, storeId);
  if (!store) return null;

  const rows = await q
    .select({
      id: templates.id,
      key: templates.key,
      name: templates.name,
      description: templates.description,
      category: templates.category,
      thumbnailUrl: templates.thumbnailUrl,
      isDefault: templates.isDefault,
      isPremium: templates.isPremium,
      version: templateVersions.version,
      config: templateVersions.config,
    })
    .from(templates)
    .innerJoin(templateVersions, eq(templateVersions.id, templates.currentVersionId))
    .where(eq(templates.isActive, true))
    .orderBy(desc(templates.isDefault), asc(templates.sortOrder), asc(templates.createdAt));

  const cards: StoreTemplateCard[] = [];
  for (const row of rows) {
    const config = siteConfigSchema.safeParse(row.config);
    if (!config.success) continue; // A broken template version is never offered.
    cards.push({
      id: row.id,
      key: row.key,
      name: localized(row.name),
      description: localized(row.description),
      category: row.category,
      thumbnailUrl: row.thumbnailUrl,
      isDefault: row.isDefault,
      isPremium: row.isPremium,
      version: row.version,
      outline: templateOutline(config.data),
    });
  }

  const [install] = await q
    .select({
      id: templateInstalls.id,
      templateKey: templates.key,
      installedAt: templateInstalls.installedAt,
      undoneAt: templateInstalls.undoneAt,
      hasDraft: sql<boolean>`${templateInstalls.previousDraft} IS NOT NULL`,
    })
    .from(templateInstalls)
    .innerJoin(templates, eq(templates.id, templateInstalls.templateId))
    .where(eq(templateInstalls.storeId, storeId))
    .orderBy(desc(templateInstalls.installedAt))
    .limit(1);

  return {
    currentKey: store.templateKey,
    templates: cards,
    lastInstall: install
      ? { id: install.id, templateKey: install.templateKey, installedAt: install.installedAt, canUndo: !install.undoneAt && install.hasDraft }
      : null,
  };
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

      const [template] = await tx
        .select({ id: templates.id, key: templates.key, isPremium: templates.isPremium, versionId: templateVersions.id, config: templateVersions.config })
        .from(templates)
        .innerJoin(templateVersions, eq(templateVersions.id, templates.currentVersionId))
        .where(and(eq(templates.key, templateKey), eq(templates.isActive, true)))
        .limit(1);
      if (!template) throw new TemplateError("template_not_found");
      // The theme store (paid templates from the store wallet) is not built yet (§8.1).
      if (template.isPremium) throw new TemplateError("premium_template");
      const config = validateSiteConfig(template.config, { allowedSections: options.allowedSections });
      if (!config.success) throw new TemplateError("invalid_template");

      await ensureStoreSiteScaffold(tx, storeId);
      const [ds] = await tx
        .select({ colors: storeDesignSystems.colors, typography: storeDesignSystems.typography, spacing: storeDesignSystems.spacing })
        .from(storeDesignSystems)
        .where(eq(storeDesignSystems.storeId, storeId));
      const pages = await tx
        .select({ id: storePages.id, slug: storePages.slug, isHome: storePages.isHome, draftContent: storePages.draftContent, orderIndex: storePages.orderIndex })
        .from(storePages)
        .where(eq(storePages.storeId, storeId))
        .orderBy(asc(storePages.orderIndex), asc(storePages.createdAt));

      const designSystem = designSystemSchema.safeParse(ds ?? {});
      const current = {
        designSystem: designSystem.success ? designSystem.data : { colors: {}, typography: {}, spacing: {} },
        header: asInstance(store.sharedHeader),
        footer: asInstance(store.sharedFooter),
        pages: pages.map((p) => ({ slug: p.slug, isHome: p.isHome, content: asContent(p.draftContent) })),
      };
      const merged = mergeTemplateIntoDraft(current, config.data, options.overrideKeys ?? {});

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
              name: { [store.defaultLocale]: page.name },
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
        .values({ templateId: template.id, templateVersionId: template.versionId, storeId, installedBy, previousDraft: previous })
        .returning({ id: templateInstalls.id });

      return { installId: install!.id, templateKey: template.key, pagesUpdated: updated, pagesCreated: createdPageIds.length };
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof TemplateError) return { success: false, error: error.code as ApplyTemplateError };
    throw error;
  }
}

export type UndoTemplateError = "not_found" | "store_read_only" | "nothing_to_undo";

/**
 * Puts back the drafts saved by this store's latest install (changes made
 * after it are replaced too; the UI says so). Pages the install created are
 * removed. Only the latest install can be undone, once.
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
          .where(and(eq(storePages.storeId, storeId), eq(storePages.isHome, false), inArray(storePages.id, saved.createdPageIds)));
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
