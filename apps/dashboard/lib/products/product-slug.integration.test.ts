import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createAuthUsers } from "../../../../packages/db/src/testing/auth-users";

/**
 * The real createProduct and updateProduct against the STAGING database, with
 * two sellers of its own that are removed afterwards. Runs only when
 * TEST_DATABASE_URL is the staging project. Never point it at production. The
 * session, the cache broadcast and the category counters are stubbed.
 */
const STAGING_REF = "cxqjrwjianxskhzmrkla";
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const isStaging = Boolean(TEST_DATABASE_URL?.includes(STAGING_REF));
if (isStaging) process.env.DATABASE_URL = TEST_DATABASE_URL;

const session = vi.hoisted(() => ({ sellerId: "" }));
vi.mock("@/actions/auth", () => ({ getUser: async () => ({ user: { id: session.sellerId } }) }));
vi.mock("@/lib/auth/seller-access", () => ({ getSellerAccess: async () => ({ allowed: true, status: "approved" }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {}, unstable_cache: (fn: unknown) => fn }));
vi.mock("@workspace/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@workspace/cache")>()),
  applyInvalidation: async () => {},
}));
vi.mock("@workspace/db/categories", () => ({
  syncCategoryProductCountForProductChange: async () => {},
  syncCategoryProductCountForProductMutation: async () => {},
  syncCategoryProductCountOnDelete: async () => {},
}));

describe.skipIf(!isStaging)("product slugs per seller (integration)", { timeout: 180_000 }, () => {
  const run = randomUUID().slice(0, 8);
  const sellerA = randomUUID();
  const sellerB = randomUUID();
  let categoryId = "";

  // Imported lazily so DATABASE_URL is set before @workspace/db connects.
  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("@/actions/products")),
    ...(await import("@workspace/lib/products/trash/server")),
  });

  const form = (title: string, slug: string, ar = true) => ({
    categoryId,
    price: { base: 100, final: 100 },
    quantity: "1",
    images: ["p/a.jpg"],
    localized: {
      en: { title, slug },
      ar: ar ? { title: `${title} ar` } : {},
    },
  });

  /** Creates a product as `sellerId` and returns its id. */
  const create = async (sellerId: string, title: string, slug: string, ar = true) => {
    const { createProduct } = await load();
    session.sellerId = sellerId;
    const result = await createProduct(form(title, slug, ar) as never);
    expect(result.error).toBeUndefined();
    return result.data!.id as string;
  };

  const save = async (sellerId: string, productId: string, title: string, slug: string) => {
    const { updateProduct } = await load();
    session.sellerId = sellerId;
    const result = await updateProduct(productId, { localized: form(title, slug).localized } as never);
    expect(result.error).toBeUndefined();
  };

  const slugsOf = async (productId: string) => {
    const { db, eq, productTranslations } = await load();
    const rows = await db
      .select({ locale: productTranslations.locale, slug: productTranslations.slug })
      .from(productTranslations)
      .where(eq(productTranslations.productId, productId));
    return Object.fromEntries(rows.map((row) => [row.locale, row.slug]));
  };

  beforeAll(async () => {
    const { db, users, sellers, categories } = await load();
    await createAuthUsers(sellerA, sellerB);
    await db.insert(users).values([sellerA, sellerB].map((id) => ({ id, isGuest: false, role: "seller" as const })));
    await db.insert(sellers).values(
      [sellerA, sellerB].map((id, index) => ({
        id,
        businessName: `Slug ${run} ${index}`,
        displayName: `Slug ${run} ${index}`,
        slug: `slugfix-${run}-${index}`,
        subdomain: `slugfix-${run}-${index}`,
        businessType: "individual" as const,
        legalAddress: { country: "EG" },
        supportEmail: "slug@example.test",
        status: "approved" as const,
      })),
    );
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    categoryId = category!.id;
  });

  // Deleting the auth rows (auth-users.ts) cascades these products; this is the safety net for that.
  afterAll(async () => {
    const { db, inArray, products } = await load();
    await db.delete(products).where(inArray(products.sellerId, [sellerA, sellerB]));
  });

  it("gives the same seller's second product -2 and the third -3, in both languages", async () => {
    const slug = `same-title-${run}`;
    expect(await slugsOf(await create(sellerA, "Same title", slug))).toEqual({ en: slug, ar: slug });
    expect(await slugsOf(await create(sellerA, "Same title", slug))).toEqual({ en: `${slug}-2`, ar: `${slug}-2` });
    expect(await slugsOf(await create(sellerA, "Same title", slug))).toEqual({ en: `${slug}-3`, ar: `${slug}-3` });
  });

  it("does not add a suffix because another seller uses the slug", async () => {
    const slug = `other-seller-${run}`;
    await create(sellerA, "Other seller", slug);
    expect((await slugsOf(await create(sellerB, "Other seller", slug))).en).toBe(slug);
  });

  it("applies the suffix to a slug the seller typed, and when an edit asks for a taken one", async () => {
    const typed = `typed-${run}`;
    await create(sellerA, "First", typed);
    expect((await slugsOf(await create(sellerA, "Second", typed))).en).toBe(`${typed}-2`);
    const third = await create(sellerA, "Third", `third-${run}`);
    await save(sellerA, third, "Third", typed);
    expect(await slugsOf(third)).toEqual({ en: `${typed}-3`, ar: `${typed}-3` });
  });

  it("keeps the slug on a re-save, also after a suffix", async () => {
    const slug = `resave-${run}`;
    const first = await create(sellerA, "Resave", slug);
    const second = await create(sellerA, "Resave", slug);
    await save(sellerA, first, "Resave", slug);
    await save(sellerA, second, "Resave", `${slug}-2`);
    expect((await slugsOf(first)).en).toBe(slug);
    expect((await slugsOf(second)).en).toBe(`${slug}-2`);
    // The form still holding what was typed lands on the same address, not -3.
    await save(sellerA, second, "Resave", slug);
    expect((await slugsOf(second)).en).toBe(`${slug}-2`);
  });

  it("leaves an existing duplicate alone until the seller changes its slug", async () => {
    const { db, eq, productTranslations } = await load();
    const slug = `old-dup-${run}`;
    await create(sellerA, "Old duplicate", slug);
    const younger = await create(sellerA, "Old duplicate", `old-dup-other-${run}`);
    // A duplicate from before this check existed.
    await db.update(productTranslations).set({ slug }).where(eq(productTranslations.productId, younger));

    await save(sellerA, younger, "Renamed, same link", slug);
    expect((await slugsOf(younger)).en).toBe(slug);

    await save(sellerA, younger, "New link", `old-dup-new-${run}`);
    expect((await slugsOf(younger)).en).toBe(`old-dup-new-${run}`);
  });

  it("checks each language: a slug held only in Arabic or only in English is taken", async () => {
    const { db, and, eq, productTranslations } = await load();
    const arHeld = `ar-held-${run}`;
    const enHeld = `en-held-${run}`;
    // An older product with its own Arabic slug: the store opens it by that slug.
    const older = await create(sellerA, "Older", enHeld);
    await db
      .update(productTranslations)
      .set({ slug: arHeld })
      .where(and(eq(productTranslations.productId, older), eq(productTranslations.locale, "ar")));

    expect(await slugsOf(await create(sellerA, "Arabic clash", arHeld))).toEqual({ en: `${arHeld}-2`, ar: `${arHeld}-2` });
    expect(await slugsOf(await create(sellerA, "English clash", enHeld))).toEqual({ en: `${enHeld}-2`, ar: `${enHeld}-2` });
    // No Arabic row of its own, and still not the Arabic slug: a store falls back between languages.
    const enOnly = await create(sellerA, "English only", arHeld, false);
    expect(await slugsOf(enOnly)).toEqual({ en: `${arHeld}-3` });
  });

  it("a draft and a trashed product hold their slug, so restoring never collides", async () => {
    const { db, eq, products, trashProducts, restoreProducts } = await load();
    const slug = `trash-${run}`;
    const trashed = await create(sellerA, "Trash", slug);
    await trashProducts(sellerA, sellerA, [trashed]);
    const created = await create(sellerA, "Trash", slug);
    expect((await slugsOf(created)).en).toBe(`${slug}-2`);
    await restoreProducts(sellerA, [trashed], { canPublish: true });
    expect((await slugsOf(trashed)).en).toBe(slug);

    const draftSlug = `draft-${run}`;
    const draft = await create(sellerA, "Draft", draftSlug);
    await db.update(products).set({ status: "draft" }).where(eq(products.id, draft));
    expect((await slugsOf(await create(sellerA, "Draft", draftSlug))).en).toBe(`${draftSlug}-2`);

    // A purged product never comes back, so it lets the slug go.
    const purgedSlug = `purged-${run}`;
    const purged = await create(sellerA, "Purged", purgedSlug);
    const now = new Date().toISOString();
    await db.update(products).set({ status: "draft", deletedAt: now, purgedAt: now }).where(eq(products.id, purged));
    expect((await slugsOf(await create(sellerA, "Purged", purgedSlug))).en).toBe(purgedSlug);
  });

  it("two saves at the same moment do not both win", async () => {
    const { createProduct } = await load();
    const slug = `race-${run}`;
    session.sellerId = sellerB;
    const results = await Promise.all(
      [1, 2, 3].map(() => createProduct(form("Race", slug) as never)),
    );
    const slugs = await Promise.all(results.map((result) => slugsOf(result.data!.id as string)));
    expect(slugs.map((row) => row.en).sort()).toEqual([slug, `${slug}-2`, `${slug}-3`]);
  });

  it("does not let one seller edit another seller's product", async () => {
    const { updateProduct } = await load();
    const slug = `foreign-${run}`;
    const owned = await create(sellerA, "Foreign", slug);
    session.sellerId = sellerB;
    const result = await updateProduct(owned, { localized: form("Foreign", `stolen-${run}`).localized } as never);
    expect(result.success).toBe(false);
    expect((await slugsOf(owned)).en).toBe(slug);
  });
});
