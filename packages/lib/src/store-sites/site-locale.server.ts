/**
 * A store's website drafts and its two languages (server-only).
 *
 * - `rebaseStoreDraftsLocale`: the store's default language changed (Store
 *   settings › General), so every draft page and the shared header and footer
 *   move to the new base language (`rebasePageContentLocale`), keeping what
 *   each language shows. Without it the renderer reads the old default's text
 *   as the new one's (an English store showing its Arabic template text). The
 *   live revision is never touched: it carries its own `settings.defaultLocale`
 *   and stays right until the next publish, which publishes the rebased drafts.
 * - `fillStoreSiteTranslations`: builder › More › Fill missing translations.
 *   Fills, in the DRAFTS only, the language template text is missing, from the
 *   code templates (`fillPageTranslations`, free, never AI), and the missing
 *   language of page names. The seller reviews it and publishes. It also
 *   counts what is still untranslated after that (`untranslated`), for the
 *   AI step.
 * - `collectStoreSiteUntranslated` / `applyStoreSiteAiTranslations`: the AI
 *   step (the dashboard runs the model, credits and caps between them, outside
 *   any transaction). Apply re-reads the drafts under the row lock and writes
 *   only into values that are still empty, so an edit made in between wins.
 *
 * Both run in the caller's transaction or their own, with the store row
 * locked; callers check that the store is the session seller's.
 */
import { and, asc, db, eq, isNull, sql, storePages, stores } from "@workspace/db";
import {
  applyPageAiTranslations,
  applyPageNameAiTranslation,
  applySectionAiTranslations,
  codeTranslationDictionary,
  collectPageNameUntranslated,
  collectPageUntranslated,
  collectSectionUntranslated,
  fillPageName,
  fillPageTranslations,
  fillSectionTranslations,
  rebasePageContentLocale,
  rebaseSectionLocale,
  sectionInstanceSchema,
  validatePageContent,
  type FillStats,
  type PageContent,
  type SectionInstance,
  type SiteLocale,
  type UntranslatedCollection,
  type UntranslatedText,
} from "@workspace/store-sections";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

type PageName = { ar?: string; en?: string };

const asLocale = (value: string): SiteLocale => (value === "en" ? "en" : "ar");

/**
 * The stored header/footer, as stored, or null when there is none or it no
 * longer parses (left untouched). The stored value is what gets changed, not
 * the parsed one, so nothing but its text ever changes.
 */
function storedSection(value: unknown): SectionInstance | null {
  if (!value || !sectionInstanceSchema.safeParse(value).success) return null;
  return value as SectionInstance;
}

/**
 * Stored draft content, as stored, or null when it no longer validates (left
 * untouched). Not the validated copy: validation drops sections that are no
 * longer supported, which only the seller's own save may make permanent.
 */
function storedContent(value: unknown): PageContent | null {
  return validatePageContent(value).success ? (value as PageContent) : null;
}

/**
 * Moves every draft of the store (pages, shared header and footer) from
 * `from` to `to` as its base language, bumping the versions it changes so an
 * open editor reloads instead of saving over it. Runs inside `tx`.
 */
export async function rebaseStoreDraftsLocale(tx: Tx, storeId: string, from: string, to: string): Promise<{ pages: number; chrome: boolean }> {
  const source = asLocale(from);
  const target = asLocale(to);
  if (source === target) return { pages: 0, chrome: false };

  let pages = 0;
  const rows = await tx.select({ id: storePages.id, draftContent: storePages.draftContent }).from(storePages).where(eq(storePages.storeId, storeId));
  for (const row of rows) {
    const content = storedContent(row.draftContent);
    if (!content) continue;
    const next = rebasePageContentLocale(content, source, target);
    if (next === content) continue;
    await tx
      .update(storePages)
      .set({ draftContent: next, draftVersion: sql`${storePages.draftVersion} + 1`, updatedAt: sql`now()` })
      .where(and(eq(storePages.id, row.id), eq(storePages.storeId, storeId)));
    pages += 1;
  }

  const [chrome] = await tx.select({ header: stores.sharedHeader, footer: stores.sharedFooter }).from(stores).where(eq(stores.id, storeId));
  const header = storedSection(chrome?.header);
  const footer = storedSection(chrome?.footer);
  const nextHeader = header && rebaseSectionLocale(header, source, target);
  const nextFooter = footer && rebaseSectionLocale(footer, source, target);
  const chromeChanged = nextHeader !== header || nextFooter !== footer;
  if (chromeChanged) {
    await tx
      .update(stores)
      .set({
        ...(nextHeader !== header && { sharedHeader: nextHeader }),
        ...(nextFooter !== footer && { sharedFooter: nextFooter }),
        chromeVersion: sql`${stores.chromeVersion} + 1`,
      })
      .where(eq(stores.id, storeId));
  }
  return { pages, chrome: chromeChanged };
}

/** `untranslated`: distinct texts still missing the other language that AI could translate. */
export type FillTranslationsResult = FillStats & { pages: number; untranslated: number };

/**
 * Builder › Fill missing translations for one of the seller's stores: the
 * drafts' template text gets its missing language from the code templates,
 * and page names theirs. `null` when the store is not the seller's (or is
 * deleted); `store_read_only` for an archived or suspended store.
 */
export async function fillStoreSiteTranslations(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<{ success: true; data: FillTranslationsResult } | { success: false; error: "not_found" | "store_read_only" }> {
  const dictionary = codeTranslationDictionary();
  return q.transaction(async (tx) => {
    const [store] = await tx
      .select({ status: stores.status, name: stores.name, defaultLocale: stores.defaultLocale, header: stores.sharedHeader, footer: stores.sharedFooter })
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
      .for("update");
    if (!store) return { success: false as const, error: "not_found" as const };
    if (store.status !== "active") return { success: false as const, error: "store_read_only" as const };

    const defaultLocale = asLocale(store.defaultLocale);
    const stats: FillStats = { filled: 0, repaired: 0, missing: 0 };
    let pages = 0;
    // The drafts as they are after the fill, for the untranslated count.
    const after: SitePart[] = [];

    const rows = await tx
      .select({ id: storePages.id, name: storePages.name, draftContent: storePages.draftContent })
      .from(storePages)
      .where(eq(storePages.storeId, storeId))
      .orderBy(asc(storePages.orderIndex));
    for (const row of rows) {
      const content = storedContent(row.draftContent);
      const filled = content ? fillPageTranslations(content, { defaultLocale, dictionary, stats }).content : null;
      // Filled text comes from the templates, so it fits; a page that would not validate is left as it was.
      const contentChanged = Boolean(content && filled && filled !== content && validatePageContent(filled).success);
      const name = fillPageName((row.name ?? {}) as { ar?: string; en?: string }, dictionary);
      after.push({ content: contentChanged ? filled : content, name: name ?? ((row.name ?? {}) as PageName) });
      if (!contentChanged && !name) continue;
      await tx
        .update(storePages)
        .set({
          ...(contentChanged && { draftContent: filled, draftVersion: sql`${storePages.draftVersion} + 1` }),
          ...(name && { name }),
          updatedAt: sql`now()`,
        })
        .where(and(eq(storePages.id, row.id), eq(storePages.storeId, storeId)));
      pages += 1;
    }

    const header = storedSection(store.header);
    const footer = storedSection(store.footer);
    const nextHeader = header && fillSectionTranslations(header, { defaultLocale, dictionary, stats }).instance;
    const nextFooter = footer && fillSectionTranslations(footer, { defaultLocale, dictionary, stats }).instance;
    if (nextHeader !== header || nextFooter !== footer) {
      await tx
        .update(stores)
        .set({
          ...(nextHeader !== header && { sharedHeader: nextHeader }),
          ...(nextFooter !== footer && { sharedFooter: nextFooter }),
          chromeVersion: sql`${stores.chromeVersion} + 1`,
          updatedAt: sql`now()`,
        })
        .where(eq(stores.id, storeId));
    }
    const untranslated = collectSiteUntranslated(nextHeader, after, nextFooter, { defaultLocale, storeNames: [store.name] }).size;
    return { success: true as const, data: { ...stats, pages, untranslated } };
  });
}

type SitePart = { content: PageContent | null; name: PageName };

/** Every draft text AI could translate, deduped, in site order: header, pages (by order), footer. */
function collectSiteUntranslated(
  header: SectionInstance | null,
  pages: readonly SitePart[],
  footer: SectionInstance | null,
  ctx: { defaultLocale: SiteLocale; storeNames: string[] },
): UntranslatedCollection {
  const into: UntranslatedCollection = new Map();
  if (header) collectSectionUntranslated(header, ctx, into);
  for (const page of pages) {
    collectPageNameUntranslated(page.name, ctx, into);
    if (page.content) collectPageUntranslated(page.content, ctx, into);
  }
  if (footer) collectSectionUntranslated(footer, ctx, into);
  return into;
}

export type StoreSiteUntranslated = { defaultLocale: SiteLocale; storeName: string; texts: UntranslatedText[] };

/**
 * The AI step's input: every draft text of one of the seller's stores that is
 * still missing the other language (the rules: `ai-translate.ts` in
 * @workspace/store-sections). Read-only.
 */
export async function collectStoreSiteUntranslated(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<{ success: true; data: StoreSiteUntranslated } | { success: false; error: "not_found" | "store_read_only" }> {
  const [store] = await q
    .select({ status: stores.status, name: stores.name, defaultLocale: stores.defaultLocale, header: stores.sharedHeader, footer: stores.sharedFooter })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)));
  if (!store) return { success: false, error: "not_found" };
  if (store.status !== "active") return { success: false, error: "store_read_only" };
  const defaultLocale = asLocale(store.defaultLocale);
  const rows = await q
    .select({ name: storePages.name, draftContent: storePages.draftContent })
    .from(storePages)
    .where(eq(storePages.storeId, storeId))
    .orderBy(asc(storePages.orderIndex));
  const pages = rows.map((row) => ({ content: storedContent(row.draftContent), name: (row.name ?? {}) as PageName }));
  const texts = collectSiteUntranslated(storedSection(store.header), pages, storedSection(store.footer), { defaultLocale, storeNames: [store.name] });
  return { success: true, data: { defaultLocale, storeName: store.name, texts: [...texts.values()] } };
}

/**
 * Writes AI translations (trimmed source → translation) into the drafts of
 * one of the seller's stores, only where the other language is still empty,
 * with the store row locked, bumping the versions it changes so an open
 * editor reloads. `locale_changed` when the store's default language is no
 * longer `from` (the translations would land on the wrong side).
 */
export async function applyStoreSiteAiTranslations(
  sellerId: string,
  storeId: string,
  from: SiteLocale,
  translations: ReadonlyMap<string, string>,
  q: Queryable = db,
): Promise<{ success: true; data: { applied: number; pages: number } } | { success: false; error: "not_found" | "store_read_only" | "locale_changed" }> {
  return q.transaction(async (tx) => {
    const [store] = await tx
      .select({ status: stores.status, name: stores.name, defaultLocale: stores.defaultLocale, header: stores.sharedHeader, footer: stores.sharedFooter })
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
      .for("update");
    if (!store) return { success: false as const, error: "not_found" as const };
    if (store.status !== "active") return { success: false as const, error: "store_read_only" as const };
    if (asLocale(store.defaultLocale) !== from) return { success: false as const, error: "locale_changed" as const };
    if (!translations.size) return { success: true as const, data: { applied: 0, pages: 0 } };

    const ctx = { defaultLocale: from, storeNames: [store.name], translations };
    let applied = 0;
    let pages = 0;
    const rows = await tx
      .select({ id: storePages.id, name: storePages.name, draftContent: storePages.draftContent })
      .from(storePages)
      .where(eq(storePages.storeId, storeId));
    for (const row of rows) {
      const content = storedContent(row.draftContent);
      const result = content ? applyPageAiTranslations(content, ctx) : null;
      // Every value was checked against its field's limit; a page that would not validate is left as it was.
      const contentChanged = Boolean(content && result && result.content !== content && validatePageContent(result.content).success);
      const name = applyPageNameAiTranslation((row.name ?? {}) as PageName, ctx);
      if (!contentChanged && !name) continue;
      applied += (contentChanged ? result!.applied : 0) + (name ? 1 : 0);
      await tx
        .update(storePages)
        .set({
          ...(contentChanged && { draftContent: result!.content, draftVersion: sql`${storePages.draftVersion} + 1` }),
          ...(name && { name }),
          updatedAt: sql`now()`,
        })
        .where(and(eq(storePages.id, row.id), eq(storePages.storeId, storeId)));
      pages += 1;
    }

    const header = storedSection(store.header);
    const footer = storedSection(store.footer);
    const nextHeader = header && applySectionAiTranslations(header, ctx);
    const nextFooter = footer && applySectionAiTranslations(footer, ctx);
    const headerChanged = Boolean(nextHeader && nextHeader.instance !== header);
    const footerChanged = Boolean(nextFooter && nextFooter.instance !== footer);
    if (headerChanged || footerChanged) {
      applied += (headerChanged ? nextHeader!.applied : 0) + (footerChanged ? nextFooter!.applied : 0);
      await tx
        .update(stores)
        .set({
          ...(headerChanged && { sharedHeader: nextHeader!.instance }),
          ...(footerChanged && { sharedFooter: nextFooter!.instance }),
          chromeVersion: sql`${stores.chromeVersion} + 1`,
          updatedAt: sql`now()`,
        })
        .where(eq(stores.id, storeId));
    }
    return { success: true as const, data: { applied, pages } };
  });
}
