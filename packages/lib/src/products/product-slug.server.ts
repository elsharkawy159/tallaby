import { and, db, eq, isNull, ne, or, products, productTranslations, sql } from "@workspace/db";
import { fallbackProductSlug, pickFreeSlug } from "./product-slug.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * The slug to save for a product, called inside the transaction that writes it.
 * The DB has no unique index on slugs, so this is what keeps them apart.
 *
 * - Only the same seller's products count: a store opens a slug among its own
 *   seller's products, so another seller using it is fine.
 * - A product keeps the slug it already has, even when another product shares
 *   it, so saving never moves a live address on its own.
 * - Every status holds a slug, and so does a product in Trash: going live and
 *   restoring from Trash never re-check, and a slug given away meanwhile would
 *   make the two collide. Only a purged product lets go, since it never returns.
 * - Both languages count: a store falls back to the other language's slug
 *   (`getProductIdBySlug`), and a product saves one slug for both languages.
 *
 * The lock is per seller and ends with the transaction, so two saves at the
 * same moment take turns and the second one sees the first one's slug.
 */
export async function resolveProductSlug(
  tx: Tx,
  input: { sellerId: string; productId: string; desired: string | null | undefined },
): Promise<string> {
  const desired = input.desired?.trim() || fallbackProductSlug(input.productId);

  const [own] = await tx
    .select({ slug: productTranslations.slug })
    .from(productTranslations)
    .where(and(eq(productTranslations.productId, input.productId), eq(productTranslations.locale, "en")))
    .limit(1);
  if (own?.slug === desired) return desired;

  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`product-slug:${input.sellerId}`}, 0))`);

  const taken = await tx
    .select({ slug: productTranslations.slug })
    .from(productTranslations)
    .innerJoin(products, eq(products.id, productTranslations.productId))
    .where(
      and(
        eq(products.sellerId, input.sellerId),
        ne(products.id, input.productId),
        isNull(products.purgedAt),
        or(eq(productTranslations.slug, desired), sql`starts_with(${productTranslations.slug}, ${`${desired}-`})`),
      ),
    );
  return pickFreeSlug(desired, taken.map((row) => row.slug));
}
