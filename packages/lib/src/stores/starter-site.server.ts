/**
 * A new store's starting site: the default template, written into the store's DRAFTS the first time
 * its site scaffold is made. The seller sees it in the website builder right
 * away, can change anything or use another template, and the live storefront
 * changes only when they publish.
 *
 * The default template is read from the database (`templates.is_default`
 * and its current version, owner 2026-10-20), in the caller's transaction,
 * so an admin's published edit reaches every store created afterwards and
 * switching the default in Admin changes what new stores get. The code
 * constant `DEFAULT_TEMPLATE` is only the fallback when the database has no
 * usable default (logged; it should never happen).
 *
 * The template is fitted to the store like "Use template" does
 * (`prepareTemplateForStore`): its newsletter and contact forms are created in
 * the store's language and bound, the store's name goes into the header and
 * footer, and an English-default store gets English first.
 *
 * Only for an active store that has never been published and has no home
 * page yet; the home row is claimed first, so two concurrent calls never
 * seed twice. Server-only; runs inside the caller's transaction when given one.
 */
import { logServerError } from "@workspace/db/log";
import { and, eq, isNull, sql, storeDesignSystems, storePages, stores, type db } from "@workspace/db";
import { validateSiteConfig, type SiteConfig } from "@workspace/store-sections";
import { DEFAULT_TEMPLATE, prepareTemplateForStore, templateFormNeeds, templateMeta, type TemplateMeta } from "@workspace/store-sections/templates";
import { loadDefaultTemplate } from "../store-sites/template-rows.server";
import { createStoreForm } from "../store-forms/server";
import { starterFormInput } from "../store-forms/starter-forms.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export type StarterStore = {
  id: string;
  sellerId: string;
  name: string;
  defaultLocale: string;
  sharedHeader: unknown;
  sharedFooter: unknown;
};

/** The database default template, or the code one (logged) when the database has none. */
async function starterTemplate(q: Queryable, storeId: string): Promise<{ key: string; config: SiteConfig; meta: TemplateMeta }> {
  const fromDb = await loadDefaultTemplate(q);
  if (fromDb) return fromDb;
  logServerError("publish", "default template missing in DB", { storeId, fallbackKey: DEFAULT_TEMPLATE.key });
  return { key: DEFAULT_TEMPLATE.key, config: DEFAULT_TEMPLATE.config(), meta: templateMeta(DEFAULT_TEMPLATE) };
}

/**
 * Claims the home page and fills the drafts from the default template.
 * Returns false when another call already made the home page.
 * `withDesignSystem`: the design-system row was just created (a new store),
 * so the template's colours and fonts become the store's.
 */
export async function seedStarterSite(q: Queryable, store: StarterStore, withDesignSystem: boolean): Promise<boolean> {
  const template = await starterTemplate(q, store.id);
  const config = template.config;
  const pageNames = template.meta.pageNames;
  const home = config.pages.find((p) => p.isHome);
  const [claimed] = await q
    .insert(storePages)
    .values({ storeId: store.id, slug: home?.slug ?? "home", isHome: true, name: pageNames[home?.slug ?? "home"] ?? pageNames.home ?? { ar: "الرئيسية", en: "Home" } })
    .onConflictDoNothing()
    .returning({ id: storePages.id });
  if (!claimed) return false;

  const locale = store.defaultLocale === "en" ? "en" : "ar";
  const formIds: Record<string, string> = {};
  for (const kind of templateFormNeeds(config)) {
    const input = starterFormInput(kind, locale);
    if (!input) continue;
    const created = await createStoreForm(store.sellerId, store.id, input, q);
    if (created.success) formIds[kind] = created.data.id;
  }
  const fitted = validateSiteConfig(prepareTemplateForStore(config, { defaultLocale: locale, storeName: store.name, formIds }));
  if (!fitted.success) throw new Error(`Default template ${template.key} is invalid`);
  const site = fitted.data;

  if (withDesignSystem) {
    await q
      .update(storeDesignSystems)
      .set({ ...site.designSystem, version: sql`${storeDesignSystems.version} + 1`, updatedAt: sql`now()` })
      .where(eq(storeDesignSystems.storeId, store.id));
  }
  // A header or footer the store already has stays.
  if (!store.sharedHeader && site.header) {
    await q.update(stores).set({ sharedHeader: site.header, chromeVersion: sql`${stores.chromeVersion} + 1` }).where(and(eq(stores.id, store.id), isNull(stores.sharedHeader)));
  }
  if (!store.sharedFooter && site.footer) {
    await q.update(stores).set({ sharedFooter: site.footer, chromeVersion: sql`${stores.chromeVersion} + 1` }).where(and(eq(stores.id, store.id), isNull(stores.sharedFooter)));
  }

  // The store remembers which template it started from (the gallery's "current" one).
  await q.update(stores).set({ templateKey: template.key }).where(eq(stores.id, store.id));

  let order = 0;
  for (const page of site.pages) {
    if (page.isHome) {
      await q.update(storePages).set({ draftContent: page.content, seo: page.seo }).where(eq(storePages.id, claimed.id));
      continue;
    }
    order += 1;
    await q
      .insert(storePages)
      .values({
        storeId: store.id,
        slug: page.slug,
        isHome: false,
        name: pageNames[page.slug] ?? { [locale]: page.name },
        seo: page.seo,
        showInNav: page.showInNav ?? true,
        orderIndex: order,
        draftContent: page.content,
      })
      .onConflictDoNothing();
  }
  return true;
}
