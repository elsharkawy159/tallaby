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
 *   language of page names. The seller reviews it and publishes.
 *
 * Both run in the caller's transaction or their own, with the store row
 * locked; callers check that the store is the session seller's.
 */
import { and, asc, db, eq, isNull, sql, storePages, stores } from "@workspace/db";
import {
  codeTranslationDictionary,
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
} from "@workspace/store-sections";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

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

export type FillTranslationsResult = FillStats & { pages: number };

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
      .select({ status: stores.status, defaultLocale: stores.defaultLocale, header: stores.sharedHeader, footer: stores.sharedFooter })
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
      .for("update");
    if (!store) return { success: false as const, error: "not_found" as const };
    if (store.status !== "active") return { success: false as const, error: "store_read_only" as const };

    const defaultLocale = asLocale(store.defaultLocale);
    const stats: FillStats = { filled: 0, repaired: 0, missing: 0 };
    let pages = 0;

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
    return { success: true as const, data: { ...stats, pages } };
  });
}
