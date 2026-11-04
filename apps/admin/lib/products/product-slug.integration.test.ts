import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createAuthUsers } from "../../../../packages/db/src/testing/auth-users";

/**
 * Admin's updateProduct against the STAGING database, with two sellers of its
 * own that are removed afterwards: a slug is checked among the product's own
 * seller. Runs only when TEST_DATABASE_URL is the staging project. Never point
 * it at production. The admin session and cache broadcast are stubbed.
 */
const STAGING_REF = "cxqjrwjianxskhzmrkla";
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const isStaging = Boolean(TEST_DATABASE_URL?.includes(STAGING_REF));
if (isStaging) process.env.DATABASE_URL = TEST_DATABASE_URL;

vi.mock("@/actions/auth", () => ({ getAdminUser: async () => ({ id: "admin" }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {}, unstable_cache: (fn: unknown) => fn }));
vi.mock("@workspace/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@workspace/cache")>()),
  applyInvalidation: async () => {},
}));
vi.mock("@workspace/db/categories", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@workspace/db/categories")>()),
  syncCategoryProductCountForProductMutation: async () => {},
}));

describe.skipIf(!isStaging)("admin product slug (integration)", { timeout: 120_000 }, () => {
  const run = randomUUID().slice(0, 8);
  const sellerA = randomUUID();
  const sellerB = randomUUID();
  const productA1 = randomUUID();
  const productA2 = randomUUID();
  const productB = randomUUID();
  const slug = `admin-slug-${run}`;

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("@/actions/products")),
  });

  const enSlug = async (productId: string) => {
    const { db, and, eq, productTranslations } = await load();
    const [row] = await db
      .select({ slug: productTranslations.slug })
      .from(productTranslations)
      .where(and(eq(productTranslations.productId, productId), eq(productTranslations.locale, "en")));
    return row?.slug;
  };

  beforeAll(async () => {
    const { db, users, sellers, products, productTranslations, categories } = await load();
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
    const base = { categoryId: category!.id, images: ["p/a.jpg"], quantity: "1", price: { base: 100, final: 100 }, status: "active" as const };
    await db.insert(products).values([
      { ...base, id: productA1, sellerId: sellerA },
      { ...base, id: productA2, sellerId: sellerA },
      { ...base, id: productB, sellerId: sellerB },
    ]);
    await db.insert(productTranslations).values([
      { productId: productA1, locale: "en", title: "One", slug },
      { productId: productA2, locale: "en", title: "Two", slug: `admin-other-${run}` },
      { productId: productB, locale: "en", title: "Three", slug: `admin-third-${run}` },
    ]);
  });

  afterAll(async () => {
    const { db, inArray, products } = await load();
    await db.delete(products).where(inArray(products.sellerId, [sellerA, sellerB]));
  });

  it("adds a suffix within the product's seller and returns the saved slug", async () => {
    const { updateProduct } = await load();
    const result = await updateProduct(productA2, { slug } as never);
    expect(result).toMatchObject({ success: true, slug: `${slug}-2` });
    expect(await enSlug(productA2)).toBe(`${slug}-2`);
  });

  it("does not add a suffix for another seller's slug", async () => {
    const { updateProduct } = await load();
    const result = await updateProduct(productB, { slug } as never);
    expect(result).toMatchObject({ success: true, slug });
  });

  it("keeps a slug the product already has", async () => {
    const { updateProduct } = await load();
    const result = await updateProduct(productA1, { slug } as never);
    expect(result).toMatchObject({ success: true, slug });
  });
});
