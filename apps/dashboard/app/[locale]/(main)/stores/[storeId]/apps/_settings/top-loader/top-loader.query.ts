import { and, db, eq, sql, storeDesignSystems, storeSiteRevisions, stores } from "@workspace/db";
import { CLASSIC_TOKENS } from "@workspace/store-sections/render";

/** Tallaby Classic's brand colour: the storefront's `--sf-brand` with no design system. */
export const CLASSIC_BRAND = CLASSIC_TOKENS["--sf-brand"] ?? "#145163";

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * The colour the storefront's top loader uses by default (`--sf-brand`): the
 * live site's design system primary, else the draft's, else Classic. Only a
 * hex colour is used (it is shown as a swatch). Not a server action: called
 * from the settings loader with a store already loaded for the session seller,
 * and filtered by that store and seller again (rule 5).
 */
export async function readStoreBrandColor(store: { id: string; sellerId: string }): Promise<string> {
  const [row] = await db
    .select({
      live: sql<string | null>`${storeSiteRevisions.snapshot} #>> '{designSystem,colors,primary}'`,
      draft: sql<string | null>`${storeDesignSystems.colors} ->> 'primary'`,
    })
    .from(stores)
    .leftJoin(storeSiteRevisions, and(eq(storeSiteRevisions.id, stores.publishedRevisionId), eq(storeSiteRevisions.storeId, stores.id)))
    .leftJoin(storeDesignSystems, eq(storeDesignSystems.storeId, stores.id))
    .where(and(eq(stores.id, store.id), eq(stores.sellerId, store.sellerId)))
    .limit(1);
  for (const value of [row?.live, row?.draft]) {
    const color = value?.trim();
    if (color && HEX_RE.test(color)) return color.toLowerCase();
  }
  return CLASSIC_BRAND;
}
